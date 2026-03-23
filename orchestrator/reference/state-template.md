# Pipeline State Template

This is the template for `.claude/pipeline-state.md`. The orchestrator creates and updates this file to track pipeline progress across conversation turns.

## Template

```markdown
## Pipeline State
- **Goal:** [사용자의 원래 요청 — 1줄]
- **Current Stage:** [현재 진행 중인 스킬 이름, 또는 "awaiting user" if between stages]
- **Completed:** [완료된 스킬 목록, comma-separated]
- **Key Decisions:** [지금까지 확정된 핵심 사항 — 2-3개]
- **Artifacts:** [생성된 파일 경로 목록]
- **Next Candidates:** [다음 단계 후보 스킬 1-2개]
- **Updated:** [YYYY-MM-DD]
```

## Field Descriptions

| Field | Required | Purpose |
|-------|----------|---------|
| Goal | Yes | 파이프라인의 원래 목적. 변경 불가. Stale 여부 판단 기준. |
| Current Stage | Yes | 지금 어느 스킬이 실행 중인지. "awaiting user" = 유저 확인 대기 중. |
| Completed | Yes | 이미 완료된 스킬. 순서대로 기록. 중복 호출 방지에 사용. |
| Key Decisions | Yes | 파이프라인 과정에서 확정된 핵심 결정. 다음 스킬에 전달할 컨텍스트. |
| Artifacts | No | 생성된 파일 경로. 다음 스킬이 읽어야 할 산출물 위치. |
| Next Candidates | Yes | 다음 단계 후보. "다음"/"계속" 시 여기서 라우팅. |
| Updated | Yes | 마지막 업데이트 날짜. Stale 판단 기준 (7일 이상이면 경고). |

## Example — Mid-Pipeline

```markdown
## Pipeline State
- **Goal:** 결제 기능 구현
- **Current Stage:** awaiting user
- **Completed:** brainstorming, question, result
- **Key Decisions:** Stripe API 선택, webhook 기반 알림, Next.js API route로 구현
- **Artifacts:** docs/reports/payment-synthesis-report.md
- **Next Candidates:** /spec, /guide
- **Updated:** 2026-03-23
```

## Example — Fresh Start

```markdown
## Pipeline State
- **Goal:** 대시보드 반응형 레이아웃 수정
- **Current Stage:** guide (in progress)
- **Completed:** (none — TRIVIAL direct route)
- **Key Decisions:** (none)
- **Artifacts:** (none)
- **Next Candidates:** /validation
- **Updated:** 2026-03-23
```

## Lifecycle

1. **Created** when orchestrator first classifies a request
2. **Updated** after each skill completes (Current Stage, Completed, Artifacts, Next)
3. **Deleted** when user says "종료", "abort", or pipeline reaches "ship" state
4. **Stale check:** If Updated is 7+ days old, orchestrator asks: "이 파이프라인을 계속할까요?"
