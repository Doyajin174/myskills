---
name: implementer
description: >
  Execute code implementation using enriched prompts from guide. Dispatches subagents,
  runs Build-Check Loops, manages git checkpoints. The executor that guide used to be.
  Use when actual code writing/modification is needed after planning is complete.
  MUST trigger on: orchestrator delegation for implementation, "구현", "코드 작성", "implement".
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent
---

# Implementer — Code Execution Engine

**Announce at start:** "I'm using the /implementer skill to execute the implementation."

**Core philosophy:** Bounded implement→verify micro-loops, not big-bang. Risk-aware classification, not file counting. Fail fast and recover, don't loop forever.

**Pipeline position:**
```
orchestrator → /guide (enriched prompts 생성)
                  ↓
                /question → /result → /research → /spec
                                                    ↓
                                                /implementer ← YOU ARE HERE
                                                    ↓
                                                /validation → /finishing
```

---

## Context Mode Detection

**Full mode** (via orchestrator pipeline):
- IF args contain `enriched_prompt:` path → Read the enriched prompt file and use as primary context
- This enriched prompt already contains claude_guide knowledge, project context, and complexity analysis

**Degraded mode** (direct invocation):
- IF no enriched prompt → Read `claude_guide/INDEX.md` and select 1-2 relevant documents
- Read project root `CLAUDE.md` for conventions
- **HIGH_RISK guard:** If request touches DB schema, auth/permissions, billing, migration, deletion, secrets, or production config:
  → **HARD FAIL:** "이 작업은 enriched prompt 없이 실행할 수 없습니다. /orchestrator를 통해 진행하세요."
- Degraded mode는 아래 조건을 **모두** 만족할 때만 허용:
  - 단일 파일 수정
  - 되돌릴 수 있는 변경
  - CLAUDE.md 읽기 완료
  - Baseline 검증 완료

---

## STEP 0: Parse Input + Context Loading

### 0.1 Read Enriched Prompt
Full mode: enriched prompt 파일 읽기.
Degraded mode: claude_guide/INDEX.md에서 1-2개 선별 + CLAUDE.md 읽기.

### 0.2 필수 읽기
- 프로젝트 루트 `CLAUDE.md` (conventions, tech stack, constraints)
- `docs/specs/` 에서 관련 spec (enriched prompt에 참조가 있으면)
- 수정 대상 파일 (현재 코드 파악)
- 관련 테스트 파일 (기존 테스트 패턴 파악)

### 0.3 프로젝트 언어 감지
- `pyproject.toml` / `requirements.txt` / `setup.py` → **Python**
- `tsconfig.json` / `package.json` → **TypeScript/Node**
- `Makefile` / `*.sh` 주체 → **Shell/Mixed**
- 감지 결과를 STEP 4 검증에 사용

### 0.4 Baseline 검증
수정 전 현재 상태 검증 실행:
- 프로젝트 테스트/린트 실행 (해당 언어, 아래 STEP 4 명령 참조)
- 기존 pass/fail 수 기록
- 이후 구현에서 regression 비교용
- 기존 테스트가 이미 깨져있으면 기록하고 진행 (신규 regression만 책임)

### 0.4B Runtime Parity Baseline (환경 의존 변경 시)
변경이 auth, session, DB reset/seed/migration, 캐시, HMR, SSR/CSR에 해당하면:
- 보고 환경 vs 구현 환경 기록
- 현재 세션 상태 기록 (로그인 유저, 토큰 유효성)
- DB 상태 기록 (reset/seed/migration 이력, 세션 user ID가 DB에 존재하는지)
- IF DB reset 수행됨 → 기존 브라우저 세션이 무효화되었음을 경고로 기록

### 0.5 Execution Memory 확인
`.claude/skills/implementer/implementer_memory.md` 읽기.
유사 작업의 과거 실패 패턴이 있으면 미리 참고.

---

## STEP 0.6: Design Token Guardrails (UI 작업 시)

수정 대상에 CSS/스타일이 포함될 때 적용:

### 토큰 전용 규칙
아래 속성에 raw value 사용 금지. 반드시 CSS custom property(`var(--*)`)만 사용:
- `color`, `background-color`, `border-color`
- `margin`, `padding`, `gap`
- `font-family`, `font-size`
- `border-radius`

**허용 예외:** `0`, `1px` (hairline border), `100%`, `transparent`, `currentColor`, `inherit`

### 에스컬레이션 트리거
기존 토큰으로 표현할 수 없는 값이 필요할 때:
→ 코드에 raw value를 넣지 말고, 사용자에게 보고:
"이 변경에 새 토큰이 필요합니다. `/design-system`으로 에스컬레이션하시겠습니까?"

### 로컬 스코프 원칙
- 일회성 CSS는 해당 페이지/래퍼에만 스코프
- 글로벌 셀렉터 추가 금지
- 기존 컴포넌트 클래스에 스타일 덧붙이기 금지

### 프로젝트 토큰 참조
UI 작업 시 프로젝트의 토큰 정의 파일을 먼저 읽기:
- `collect_styles.css`의 `:root` 섹션
- 또는 `CLAUDE.md`에 명시된 토큰 파일

사용 가능한 토큰을 파악한 후 작업 시작.

---

## STEP 1: 복잡도 분류 (Risk-Driven Classification)

Classify by **risk → ambiguity → verification → coupling → file count** (in that order).

### Phase 1: Requirement Clarity
```
Are acceptance criteria clearly defined?
├─ NO → EXPLORATORY (→ report only, no code. Route to /research or /spec)
└─ YES → continue
```

### Phase 2: Risk Assessment
```
Does change touch: DB schema, auth/permissions, public API contracts,
production config, destructive operations, or payment/billing?
├─ YES → add HIGH_RISK tag (forces APPROVAL GATE regardless of complexity)
└─ NO → continue
```

### Phase 3: Verification Feasibility
```
Can the change be verified by automated tests or clear manual steps?
├─ NO → bump complexity +1 level
└─ YES → continue
```

### Phase 4: Change Coupling
```
Is the change isolated to a single module/boundary?
├─ YES, single function/constant in single file → TRIVIAL
├─ YES, within one module but multiple functions → SIMPLE
├─ NO, crosses module boundaries → MEDIUM
└─ NO, crosses multiple interfaces/contracts → COMPLEX
```

### Phase 5: Adjust (secondary signals)
- File count > 10 → bump +1 (cap at COMPLEX)
- Unknown dependency graph → bump +1
- Default under uncertainty → MEDIUM (한 단계 높게)

### Rubric 요약

| Level | 파일 수 | 모듈 경계 | 위험도 | 예시 |
|-------|--------|----------|--------|------|
| **Trivial** | 1 | 단일 함수/상수 | 없음 | 함수명 변경, 로그 추가, 상수 수정 |
| **Simple** | 1-3 | 단일 모듈 내 | 낮음 | 새 엔드포인트, 기존 패턴 따르는 기능 |
| **Medium** | 3-8 | 모듈 경계 넘음 | 중간 | 새 기능 모듈, 기존 인터페이스 변경 |
| **Complex** | 8+ | 다중 인터페이스 | 높음 | 아키텍처 변경, DB 스키마, 새 서브시스템 |

### Mid-Flight Reclassification
구현 중 새로운 정보가 발견되면 재평가:
- 범위가 예상보다 작음 → 하향 (예: MEDIUM → SIMPLE)
- 숨겨진 복잡도 발견 → 상향 (예: SIMPLE → COMPLEX)
- **상향 시:** 사용자에게 보고, 재계획 제안

---

## STEP 2: 파이프라인 선택

| Complexity | Pipeline |
|------------|----------|
| **Trivial** | Scope → Implement → Verify |
| **Simple** | Scope → Light Design → [Implement→Verify]ⁿ → Final Verify |
| **Medium** | Scope → Design → [Implement→Verify]ⁿ → Final Verify |
| **Complex** | Scope → Design + APPROVAL GATE → [Maker→Reviewer]ⁿ → Integration Verify |

**HIGH_RISK tag** → forces APPROVAL GATE after Design, regardless of complexity level.

**APPROVAL GATE:**
사용자에게 실행 계획을 보고하고 확인 받기:
```
📋 태스크: [task description]
📊 복잡도: [level] [+HIGH_RISK if applicable]
🔧 파이프라인: [phases]
⚠️ 위험 요소: [what could go wrong]

실행할까요?
```

---

## STEP 3: Subagent Task Delegation

Generate structured task briefs for subagents. **Sections are tiered by complexity:**

### Always Required (all complexity levels)
```xml
<context>{project rules from CLAUDE.md, relevant architecture}</context>
<goal>{what to achieve, acceptance criteria}</goal>
<constraints>{non-negotiable limits, safety rules}</constraints>
<output>{expected deliverables, file list}</output>
<verification>{how to confirm success — tests, commands, checks}</verification>
```

### Add for MEDIUM+ only
```xml
<risks>{edge cases, blast radius, rollback plan}</risks>
<file_scope>
  수정 허용: [파일 목록]
  읽기 전용: [참조 파일]
  새로 생성: [신규 파일]
</file_scope>
<dependency_order>
  수정 순서: [A → B → C] (import 깨짐 방지)
</dependency_order>
<test_expectations>
  반드시 통과: [테스트 목록]
  진행 중 실패 가능: [테스트 목록]
  최종: 전부 pass
</test_expectations>
<checkpoints>
  [소작업 1] 완료 후: git commit
  [소작업 2] 완료 후: git commit
  최종 전: 전체 테스트
</checkpoints>
```

### Add for COMPLEX only
```xml
<approval_gate>{what needs user confirmation before proceeding}</approval_gate>
<recovery>{max retries, rollback triggers, escalation path}</recovery>
<alternatives>{list 2-3 approaches, critique each, justify chosen one}</alternatives>
```

### Structural Thinking Directives
- **Design phase:** "Describe 2-3 alternative approaches. Critique each. Justify your choice."
- **Implement phase:** "After each file change, verify no broken imports before moving on."
- **Verify phase:** "If test fails, diagnose root cause before retrying. Don't guess-fix."

### Context Management
- At **phase boundaries**: summarize findings, discard raw file contents
- Retain: function signatures, interface contracts, error messages, decisions made
- Discard: implementation boilerplate, unchanged file contents, verbose logs

---

## STEP 4: Dispatch Subagents

### Agent Type Selection

| Phase | Agent Type | Reasoning |
|-------|-----------|-----------|
| Implementation | `subagent_type: "general-purpose"` | Code changes, full tool access |
| Review (Complex) | `subagent_type: "superpowers:code-reviewer"` | Adversarial review |

### Dispatch Strategy

| Complexity | Strategy |
|------------|----------|
| **Trivial / Simple** | Single agent with lightweight prompt |
| **Medium** | Single agent with full prompt (internal loops) |
| **Complex** | Phase-split: Implement agent(s) → Reviewer agent |

### Maker→Reviewer Pattern (COMPLEX only)
1. **Maker Agent** — 코드 + 테스트 작성. 소단위 커밋 (1 기능 = 1-3 커밋). 설계 결정 코멘트로 기록. 완료 시 요약 작성.
2. **Reviewer Agent** — Maker의 커밋 + 요약 읽기. 아키텍처 정합성 검증. 엣지 케이스 + 에러 핸들링 확인. 테스트 커버리지 체크. 승인 또는 수정 요청.

### Dependency Discovery (before parallelizing)
1. 대상 파일 목록 작성
2. 각 파일의 imports/requires 추출
3. 의존성 인접 그래프 구성: A가 B를 import하면 같은 boundary
4. **별도 subgraph의 파일만** 병렬 가능

When in doubt, run sequentially.

### Subagent Failure Recovery
- Subagent 빈 결과/에러 반환 → 프롬프트 축소해서 1회 재시도
- 재시도도 실패 → 해당 phase를 현재 context에서 직접 수행
- 실패 사항은 STEP 6 결과에 "Remaining Issues"로 기록

---

## STEP 5: Implement→Verify Loop

```
┌─── IMPLEMENT LOOP ──────────────────────────┐
│                                              │
│  1. Agent writes code                       │
│  2. Verify (언어별 — 아래 참조)             │
│  3. Baseline 비교 (STEP 0.4 대비 regression)│
│  4. If errors:                              │
│     ├─ 동일 에러 1회 재시도 후 같으면       │
│     │  → 진단 필수 (guess-fix 금지)         │
│     ├─ 총 3회 실패 시:                      │
│     │  → 복구 + HARD STOP                   │
│     └─ 복구: git restore + git clean -fd    │
│                                              │
│  5. If clean:                               │
│     git add + commit                        │
│                                              │
└──────────────────────────────────────────────┘
```

### 검증 (언어별)

프로젝트 자체 명령이 있으면 우선 사용 (Makefile, pyproject.toml scripts, package.json scripts).
없으면 아래 기본값:

**Python:**
1. `ruff check {변경 파일}` — 린트 (syntax + import 에러)
2. `python -m pytest -q {관련 테스트} -x --tb=short` — 테스트 (fail-fast)
3. `mypy {변경 파일} --ignore-missing-imports` — 타입 체크 (mypy 사용 프로젝트만)

**TypeScript/Node:**
1. `tsc --noEmit` — 타입 체크
2. `npm test` (또는 프로젝트 테스트 명령)

**Shell:**
1. `shellcheck {변경 파일}` (설치되어 있으면)

**Fallback (테스트 없는 프로젝트):**
1. `python -c "import {모듈}"` 또는 `node -e "require('{모듈}')"` — 최소 import 확인
2. 린트만 실행

### Baseline 비교
- STEP 0.4에서 저장한 baseline과 비교
- 기존 pass → fail 전환 = **regression, 수정 필요**
- 기존 fail → fail 유지 = 허용 (이번 작업 책임 아님)

### Runtime Verification Gate (환경 의존 변경 시 필수)

코드 검증(tsc, test) 통과 후, 변경이 아래 영역에 해당하면 환경 검증 추가 수행:

| 변경 유형 | 환경 검증 방법 |
|----------|--------------|
| UI/페이지/네비게이션 | 실제 브라우저에서 확인 (Playwright ≠ 실제 브라우저) |
| 인증/세션/미들웨어 | 기존 세션 + 새 세션 모두 확인 |
| DB 스키마/reset/migration | 기존 세션이 유효한지 확인 (JWT user ID ↔ DB) |
| API 엔드포인트 | 실제 클라이언트에서 호출 확인 |
| 캐시/HMR 관련 | 하드 리프레시 + 서버 재시작 후 확인 |

**The Automation Paradox:** Playwright/Jest PASS는 코드 정합성만 보장. clean-room 테스트 환경은 stale state 버그를 숨긴다. 버그 수정의 경우, **버그가 보고된 재현 경로**로 반드시 최종 확인.

IF 자동화 테스트 PASS but 실제 브라우저 FAIL → **STOP**, `/problem`으로 라우팅.

### 실패 시 복구
1. `git restore --staged --worktree .` (tracked 파일 복원)
2. `git clean -fd` (untracked 파일 제거)
3. 실패 로그 기록 (에러 메시지 + 시도한 접근)

### Abort 규칙
- **batch** = 하나의 독립 파일군 또는 logical change set
- 동일 에러 1회 재시도 후 동일 → **진단 필수** (guess-fix 금지)
- 3회 실패 → HARD STOP + `/problem` 안내
- 50%+ batch 실패 → HARD STOP
- **Partial success:** 3/4 batch pass, 1 fail → pass 부분 커밋, fail 분리 보고

---

## STEP 6: Results Report

```
📊 실행 결과: [task description]
복잡도: [level] | 파이프라인: [phases executed]

## What Changed
[1-3 sentences: what was done and why]

## Files Modified
- path/to/file — [what changed]

## Verification
- lint: ✅/❌
- tests: ✅/❌ ([N] passed, [M] failed)
- baseline comparison: regression 없음 / [N]개 regression

## Remaining Issues
- [any unresolved items, or "None"]
```

For COMPLEX tasks, include step-by-step table:
```
| Step | Status | Details |
|------|--------|---------|
| Design | ✅ | [brief] |
| Implement 1 | ✅ | [brief] |
| Review | ⚠️ | [issues found] |
| Fix | ✅ | [resolved] |
```

**On failure:** Report what was attempted, what failed, present options:
1. Retry with adjusted approach
2. Reduce scope
3. Abort and revert

→ "Implementation complete. Use `/validation` to evaluate quality."

---

## STEP 7: Execution Memory

Append to `.claude/skills/implementer/implementer_memory.md`:

```
[date] | [complexity] | [task summary] | [pipeline used] | [result: success/partial/fail] | [lesson]
```

- Keep only the **last 20 entries**
- Read this file in STEP 0.5 to inform classification and pipeline selection
- If a similar task previously failed, flag the failure pattern before proceeding

---

## Quality Checklist

### Must-pass
- [ ] CLAUDE.md + 관련 spec 읽기 완료
- [ ] 프로젝트 언어 감지됨
- [ ] Baseline 검증 실행됨
- [ ] Complexity classification 적용됨 (rubric 기반)
- [ ] Pipeline selected matches complexity
- [ ] Subagent prompts include context, goal, constraints, verification
- [ ] 언어에 맞는 검증 명령 사용됨 (Python → ruff/pytest, 아닌 tsc)
- [ ] Each successful batch committed
- [ ] Failed batches cleaned (git restore + git clean -fd)
- [ ] Results report generated
- [ ] /validation handoff 명시됨

### Should-pass
- [ ] Prior execution memory checked
- [ ] Parallel opportunities identified (dependency graph 확인)
- [ ] Rollback plan defined for MEDIUM+
- [ ] Baseline comparison 결과 보고됨

### Conditional must-pass (해당 시 필수)
- [ ] 버그 수정 시: 보고된 재현 경로로 최종 확인 완료 (자동 테스트만으로 선언 금지)
- [ ] 환경 의존 변경 시: 실제 런타임 환경에서 확인 완료
- [ ] DB reset/seed/migration 발생 시: 세션 identity가 현재 DB와 일치하는지 확인

---

## Anti-Patterns

- **No big-bang** — small bounded steps, verify between each
- **No guess-fixing** — diagnose root cause before retrying. 동일 에러 반복 시 진단 없이 재시도 금지
- **No infinite retry** — 3 strikes then revert and escalate
- **No context hoarding** — summarize at boundaries, discard raw data
- **No committing broken state** — never commit if verification fails
- **No skipping verification** — every edit followed by language-appropriate check
- **No same-boundary parallel** — check dependency graph before parallelizing
- **No ignoring project conventions** — CLAUDE.md 규칙을 따르기
- **No implementing without reading** — 수정 대상 파일과 관련 spec을 먼저 읽기
- **No raw CSS values** — color, spacing, radius, font에 하드코딩 금지. `var(--*)` 토큰만 사용
- **No design-system bypassing** — 새 토큰이 필요하면 에스컬레이션, 임의 생성 금지
- **No automation-only signoff** — Playwright/Jest PASS는 코드 정합성만 보장. 세션/DB/캐시 같은 환경 요인은 별도 확인 필수. clean-room 테스트가 dirty-state 버그를 숨김
- **No stale-session assumptions** — DB reset/seed/migration 후 기존 브라우저 세션의 auth token 유효성을 반드시 재확인

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `implementer` to **Completed**, update **Artifacts** with modified files, set **Recommended Next** to `/validation, /problem`
