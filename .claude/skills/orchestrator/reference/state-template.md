# Pipeline State Template

This is the template for `.claude/pipeline-state.md`. The orchestrator creates and updates this file to track pipeline progress across conversation turns.

## Format

The state file uses **YAML frontmatter** for structured fields (machine-parseable) and **Markdown body** for descriptive fields (human-readable).

## Template

```markdown
---
stage: [현재 상태: "awaiting user" / skill name]
delegated_to: [마지막으로 호출한 스킬 — 완료 시 orchestrator가 reconcile 후 비움]
visit_count:
  [skill_name]: [N]
updated: [YYYY-MM-DD]
pipeline_id: [goal 해시 — 파이프라인 스코프 식별자. 새 goal 감지 시 state 리셋 트리거]
pipeline_plan: [스킬 실행 순서 — orchestrator가 계획 시 기록]
bootstrap_completed: [true/false — /guide bootstrap 완료 여부. pipeline_id와 함께 스코프됨]
pending_target_skill: [bootstrap 후 라우팅할 스킬 — Read-and-Clear 규칙 적용 (아래 상태표 참조)]
enriched_prompt_paths:
  [skill_name]: [enriched prompt 파일 경로]
---
## Pipeline State
- **Goal:** [사용자의 원래 요청 — 1줄]
- **Completed:** [완료된 스킬 목록, comma-separated]
- **Key Decisions:** [지금까지 확정된 핵심 사항 — 2-3개]
- **Artifacts:** [생성된 파일 경로 목록]
- **Recommended Next:** [다음 단계 후보 스킬 1-2개]
```

## Field Descriptions

### YAML Frontmatter (structured)

| Field | Required | Purpose |
|-------|----------|---------|
| stage | Yes | 현재 파이프라인 상태. `awaiting user` = 유저 확인 대기 중. 스킬 이름 = 해당 스킬 실행 중/예정. |
| delegated_to | Yes | 마지막 호출된 스킬. 오케스트레이터가 스킬 호출 전에 기록. 다음 호출 시 reconciliation에 사용. 비어있으면 = 이전 스킬 결과 처리 완료. |
| visit_count | Yes | 스킬별 호출 횟수. 루프 감지에 사용. 3회 이상이면 오케스트레이터가 유저에게 경고. |
| updated | Yes | 마지막 업데이트 날짜. Stale 판단 기준 (7일 이상이면 경고). |

### Markdown Body (descriptive)

| Field | Required | Purpose |
|-------|----------|---------|
| Goal | Yes | 파이프라인의 원래 목적. 변경 불가. Stale 여부 판단 기준. |
| Completed | Yes | 이미 완료된 스킬. 순서대로 기록. 루프 감지의 ping-pong 판단에도 사용. |
| Key Decisions | Yes | 파이프라인 과정에서 확정된 핵심 결정. 다음 스킬에 전달할 컨텍스트. |
| Artifacts | No | 생성된 파일 경로. 다음 스킬이 읽어야 할 산출물 위치. |
| Recommended Next | Yes | 다음 단계 후보. "다음"/"계속" 시 여기서 라우팅. |

## Example — Mid-Pipeline

```markdown
---
stage: awaiting user
delegated_to:
visit_count:
  brainstorming: 1
  question: 1
  result: 1
updated: 2026-03-23
---
## Pipeline State
- **Goal:** 결제 기능 구현
- **Completed:** brainstorming, question, result
- **Key Decisions:** Stripe API 선택, webhook 기반 알림, Next.js API route로 구현
- **Artifacts:** docs/reports/payment-synthesis-report.md
- **Recommended Next:** /spec, /guide
```

## Example — Just Delegated (orchestrator wrote this before invoking /guide)

```markdown
---
stage: guide
delegated_to: guide
visit_count:
  guide: 1
updated: 2026-03-23
---
## Pipeline State
- **Goal:** 대시보드 반응형 레이아웃 수정
- **Completed:** (none — TRIVIAL direct route)
- **Key Decisions:** (none)
- **Artifacts:** (none)
- **Recommended Next:** /validation
```

## Example — After Reconciliation (orchestrator reads delegated_to, moves to completed)

```markdown
---
stage: awaiting user
delegated_to:
visit_count:
  guide: 1
updated: 2026-03-23
---
## Pipeline State
- **Goal:** 대시보드 반응형 레이아웃 수정
- **Completed:** guide
- **Key Decisions:** CSS Grid 기반 반응형 적용
- **Artifacts:** app/(dashboard)/layout.tsx
- **Recommended Next:** /validation
```

## Lifecycle

1. **Created** when orchestrator first classifies a request (STEP 4: Write State)
2. **Updated before** each skill invocation — orchestrator sets `delegated_to` and increments `visit_count`
3. **Reconciled** when orchestrator is re-invoked — STEP 1 reads `delegated_to`, moves to `completed`, clears it
4. **Deleted** when user says "종료", "abort", or pipeline reaches "ship" state
5. **Stale check:** If `updated` is 7+ days old, orchestrator asks: "이 파이프라인을 계속할까요?"

## State Ownership

- **Orchestrator writes (pre-dispatch):** `stage`, `delegated_to`, `visit_count`, `updated`, `Goal`
- **Worker skill writes (post-completion):** `Completed` (자기 이름 추가), `Artifacts` (생성 파일), `Recommended Next` (라우팅 테이블 기반)
- **Worker skill clears:** `delegated_to` → 비움
- **Key Decisions:** Worker skill이 발견한 핵심 결정사항 추가
- **Guide (bootstrap) writes:** `bootstrap_completed`, `enriched_prompt_paths`
- **Orchestrator manages:** `pipeline_id` (생성/비교/리셋), `pending_target_skill` (set/read-and-clear)
- **Orchestrator fallback:** Worker가 state를 안 쓴 경우, STEP 1에서 Glob 기반으로 reconcile

---

## pending_target_skill 상태표

| Event | Action | 주체 |
|-------|--------|------|
| NON-TRIVIAL 분류 + bootstrap_completed=false | **SET** `pending_target_skill` = classified_skill | Orchestrator STEP 2.5 (Row 3) |
| /guide 호출 직전 | (유지 — guide가 수정하지 않음) | Orchestrator |
| /guide 완료, orchestrator 재진입 | `invoke_now` = pending_target_skill → 즉시 **CLEAR** | Orchestrator STEP 2.5 (Row 1) |
| 스킬 dispatch | **DISPATCH** invoke_now (값은 이미 state에서 제거됨) | Orchestrator STEP 4 |
| pipeline_id 변경 (새 goal) | **INVALIDATE** + **CLEAR** | Orchestrator STEP 1 |
| 사용자 수동 스킬 지명 | **INVALIDATE** + **CLEAR** | Orchestrator STEP 2.5 |
| enriched_prompt 경로 없음 | **INVALIDATE** + **CLEAR** (guide 실패) | Orchestrator STEP 2.5 |

---

## Example — Bootstrap Turn 1 (NON-TRIVIAL, /guide 호출)

이것은 bootstrap이 정상 작동하는 예시입니다. `invoke_now`가 classified_skill이 아닌 `/guide`입니다.

```markdown
---
stage: guide
delegated_to: guide
classified_skill: validation
visit_count:
  guide: 1
updated: 2026-03-26
pipeline_id: pr-review-abc123
pipeline_plan: [guide, validation]
bootstrap_completed: false
pending_target_skill: validation
enriched_prompt_paths:
---
## Pipeline State
- **Goal:** PR 리뷰해줘 내부감사만으로 충분해
- **Completed:** (none)
- **Key Decisions:** (none)
- **Artifacts:** (none)
- **Recommended Next:** /validation (after bootstrap)
```

**핵심:** `classified_skill: validation`이지만 `delegated_to: guide`입니다.
이것이 정상입니다 — 분류와 실행은 다른 변수입니다.

## Example — Bootstrap Turn 2 (pending_target_skill 소비)

/guide가 완료된 후, orchestrator가 재진입하여 pending_target_skill을 소비합니다.

```markdown
---
stage: validation
delegated_to: validation
classified_skill: validation
visit_count:
  guide: 1
  validation: 1
updated: 2026-03-26
pipeline_id: pr-review-abc123
pipeline_plan: [guide, validation]
bootstrap_completed: true
pending_target_skill:
enriched_prompt_paths:
  validation: .claude/enriched/validation.md
---
## Pipeline State
- **Goal:** PR 리뷰해줘 내부감사만으로 충분해
- **Completed:** guide
- **Key Decisions:** (none)
- **Artifacts:** .claude/enriched/validation.md
- **Recommended Next:** /validation
```

**핵심:** `bootstrap_completed: true`, `pending_target_skill` 비움 (소비됨),
`enriched_prompt_paths`에 validation 경로가 있음.
