---
name: problem-prompt-generator
description: >
  Generate investigation-to-fix prompts for expected-vs-actual mismatches: runtime errors, build failures,
  performance regressions. Creates external AI prompts AND runs internal investigation in parallel.
  Use when behavior differs from expectation — not for design flaws (use /research) or quality review (use /validation).
  MUST trigger on: "버그", "에러", "안돼", "깨졌어", "크래시", "crash", "bug", "error",
  "왜 안돼", "fix", "고장", "느려", "slow", "performance issue", "expected X but got Y",
  "작동 안 함", "실패", "fail", or any request where something was working and now isn't,
  or where output differs from expected result.
  NOT for: design flaws or architectural concerns (→ /research), quality review (→ /validation),
  tech exploration (→ /question).
  State routing: expected-vs-actual MISMATCH exists (something broken/slow/wrong).
  If design flaw → /research. If quality review → /validation. If exploring → /question.
---

# Problem Prompt Generator

Generate investigation prompts for expected-vs-actual mismatches AND run internal debugging agents in parallel.

**Announce at start:** "I'm using the /problem skill to investigate this issue."

**Pipeline position diagram:**

```
User report / /validation issues / monitoring alert
     ↓
/problem  ← YOU ARE HERE
  1. Gather evidence (mismatch description)
  2. Classify problem type
  3. Dispatch internal debugging agents
  4. Generate external AI investigation prompt
  5. Apply fix (or hand off to /guide)
     ↓
Fix applied → /validation (re-check)
Escalate  → /research (design flaw found)
Circuit break → user decision (after 3 failed cycles)
```

---

## STEP 0: Evidence Gathering

Extract the mismatch details. For each, ask:

| Question | Purpose |
|----------|---------|
| What is the expected behavior? | Define baseline |
| What is the actual behavior? | Define mismatch |
| How to reproduce? (exact steps) | Reproduction path — essential for intermittent bugs |
| Error messages, stack traces (verbatim) | Evidence, not paraphrase |
| Application logs, system logs | Runtime context — check log files if available |
| Environment: OS, language version, key dependency versions | Environment-specific bugs |
| Test env vs report env: how was bug verified? (Playwright, curl, real browser, staging, prod) | Environment parity — automation ≠ real world |
| Runtime state: session/token validity, DB sync, cache, HMR state | Stale state bugs — DB reset 후 세션 불일치 등 |
| What changed recently? (git log, dependency updates, config) | Regression candidate |
| What has already been tried? | Avoid repeating failed fixes |
| Relevant source files (read them) | Context for diagnosis |
| Does a /validation report exist? | Check `docs/reports/` — primary inbound from /validation |

**Primary inbound routes:**
- User reports: "This doesn't work" + description
- /validation report: issues detected automatically
- Monitoring alerts: metrics show anomaly

### STEP 0.1: Environment Parity Snapshot (브라우저/앱/런타임 버그 시 필수)

가설 수립 전에 보고 환경과 조사 환경의 상태를 비교:

| 비교 항목 | 보고 환경 | 조사 환경 |
|----------|----------|----------|
| 브라우저/프로필 | | |
| 로그인 상태 (세션/토큰) | | |
| DB 상태 (reset/seed/migration 여부) | | |
| 캐시 (브라우저, .next, webpack) | | |
| 환경변수 (.env.local vs .env.production) | | |
| 개발서버 상태 (HMR, Fast Refresh) | | |

**차이가 있으면 `ENVIRONMENT-SUSPECT`로 태그하고, 코드 수정 전에 상태 불일치부터 해결.**

---

## STEP 1: Problem Classification

Classify the issue type. This guides investigation strategy:

| Type | When | Investigation Focus |
|------|------|---|
| **Runtime error** | crash, exception, stack trace | Stack trace analysis, error propagation path, callback chain |
| **Build failure** | compile error, import error | Dependency graph, version conflicts, module loading |
| **Logic bug** | wrong output, data corruption | Data flow tracing, edge cases, conditional logic |
| **Performance** | slow, memory leak, timeout | Profiling, bottleneck identification, resource usage |
| **Regression** | worked before, broke after | Git bisect, recent change analysis, version comparison |
| **Configuration** | wrong config, env var, path mismatch | Config file diff, environment comparison, path resolution |
| **Race condition** | intermittent, timing-dependent | Concurrency analysis, lock ordering, async flow tracing |
| **Environment** | works here, fails there | OS/version diff, dependency comparison, platform-specific behavior |

### ENVIRONMENT-SUSPECT 자동 감지 규칙

아래 신호 중 **하나라도** 해당되면 자동으로 `ENVIRONMENT-SUSPECT`로 태그:
- 자동화 테스트(Playwright/Jest/curl)는 통과하지만 실제 브라우저에서 실패
- 새 로그인으로는 되지만 기존 세션으로는 실패
- DB reset/seed/migration 직후 발생한 문제
- 브라우저/프로필/시크릿 모드에 따라 재현이 달라짐
- 캐시/스토리지 클리어 시 결과가 바뀜
- 로컬에서는 되지만 preview/staging/production에서 실패
- 서버 재시작 후 됨/안 됨이 달라짐

**`ENVIRONMENT-SUSPECT` 태그 시:** 코드 가설보다 런타임 상태 가설을 먼저 검증. STEP 0.1 패리티 스냅샷 필수.
**→ STEP 4.5 (Hypothesis Verification) 필수.** Fast-track bypass 불가 — 반드시 런타임 데이터로 가설 검증 후 수정 진행.

---

## Context Mode Detection

Check how this skill was invoked:

**Full mode** (via orchestrator pipeline):
- IF args contain `enriched_prompt:` path → Read the enriched prompt file and use as primary context
- This enriched prompt already contains claude_guide knowledge, project context, and complexity analysis

**Degraded mode** (direct invocation):
- IF no enriched prompt → Read `claude_guide/INDEX.md` and select 1-2 relevant documents
- Load only those selected documents for lightweight context
- Note: "Running in standalone mode. For best results, use /orchestrator."

---

## STEP 2: Dual Execution — Prompt + Internal Investigation

### 2A: Generate External AI Prompt

Create a self-contained prompt for external AI analysis:

```markdown
# Bug Investigation: [Brief description]

> Act as a senior engineer debugging a [type] issue in a [tech stack] application.
> You have deep experience with [relevant technologies].
> Focus on root cause analysis, not surface-level fixes.

## System Context
[2-3 sentences: what the system does, platform, key dependencies]

## Expected vs Actual
- Expected: [specific behavior]
- Actual: [specific behavior]
- Frequency: [always / intermittent / environment-specific]

## Evidence
[Verbatim error messages, stack traces, log excerpts]

## What Changed Recently
[Recent commits, dependency updates, config changes]

## What We've Already Tried
[Previous fix attempts and their results]

## Constraints
[What cannot change, what must be preserved]

## Prior Investigation
[If coming from /validation loop: reference the validation report findings.
If first investigation: "Initial investigation — no prior findings."]

## Investigation Questions
1. What is the most likely root cause based on the evidence?
2. What other possible causes should we investigate?
3. What's the minimal fix that addresses the root cause?
4. What regression risks does the fix introduce?
5. How do we verify the fix works and doesn't break anything else?

## Expected Output
- Root cause analysis with evidence
- Ranked list of possible causes (most to least likely)
- Specific fix recommendation with code changes
- Verification steps

## Length Target
Keep total prompt under 2500 words. If stack traces or code sections exceed
this, include the most relevant 20 lines and summarize the rest.
```

### 2B: Run Internal Debugging Agents (in parallel)

**Methodology:** Follow the `/ai-only-debugging` skill's priority stack. AI leads with static analysis — runtime observation is a structured escalation, not the starting point.

```
Level 1: TYPE ANALYSIS     — Check type errors, interface mismatches, narrowing gaps
Level 2: GIT HISTORY       — git blame / git log to find when it broke
Level 3: CODE TRACING      — Trace value flow backwards from symptom to source
Level 4: TEST REPRODUCTION — Write a failing test that reproduces the bug
Level 5: INSTRUMENTATION   — Add targeted log points at gaps in the pipeline
Level 6: RUNTIME ESCALATION — Request specific runtime data (with justification)
```

Dispatch agents to investigate while external AI reviews the prompt:

```
Agent 1 — TRACE (evidence gathering, follows /ai-only-debugging priority stack):
  subagent_type: "Explore"
  run_in_background: true
  prompt: "Investigate [specific error/behavior] using AI-first debugging:
           1. Check types — interface mismatches, type narrowing gaps
           2. Check git history — git blame/log for when this broke
           3. Trace code — follow value flow backward from symptom to source
           4. Find related patterns — similar code elsewhere that works
           5. Check environment parity — reported runtime vs investigation runtime
           6. Check session/auth artifacts — cookies, localStorage, token age, user identity match
           7. Check backend sync — does session's user/tenant still exist in DB after reset/seed/migration?
           8. Check configs — environment variables, config files, base URLs, path resolution
           9. Check logs — application logs, network errors, auth failures
           If automation and manual behavior differ, prioritize runtime-state mismatch before code-change hypotheses.
           Return: call chain, type analysis, recent changes, config state, environment parity, related patterns."

Agent 2 — ROOT CAUSE (hypothesis testing):
  subagent_type: "general-purpose"
  run_in_background: true
  prompt: "Given this error: [error description + evidence]
           Form 2-3 competing hypotheses for the root cause.
           **Must include at least 1 state-divergence hypothesis:**
           - Stale session/token referencing deleted DB records
           - Orphaned auth state after DB reset/seed/migration
           - Cached assets from previous build (browser, .next, service worker)
           - HMR partial reload leaving inconsistent state
           For each hypothesis:
           - What evidence supports it?
           - What evidence contradicts it?
           - How would you test/prove it?
           - **Verification command:** Provide the exact command, query, or manual step
             to confirm/disprove this hypothesis (e.g., SQL query, curl command,
             browser DevTools check, log grep). Be specific — not "check the DB"
             but "SELECT * FROM users WHERE id = {value}".
           Return: ranked hypotheses with evidence assessment + verification commands."

Agent 3 — REGRESSION (impact analysis) [optional — for fixes touching shared code]:
  subagent_type: "Explore"
  run_in_background: true
  prompt: "Check what would be affected if we modify [file/function]:
           - Find all callers/importers of the affected function
           - Check test coverage for the affected area
           - Identify integration points that might break
           Return: blast radius assessment + test gap list."
```

**Agent dispatch rules:**
- Agent 1 (TRACE) and Agent 2 (ROOT CAUSE) always dispatched
- Agent 3 (REGRESSION) dispatch if the **bug's location** touches shared/imported code (check callers/importers of affected files)
- For obvious single-cause bugs (typo, missing import): Agent 2 can return a single hypothesis instead of forcing 2-3
- Include the exact error message, file paths, and relevant code snippets in each agent prompt

**After all agents complete:**
- Compare hypotheses against trace evidence
- If agents disagree on root cause: list both with evidence strength
- Save to `docs/reports/{topic}-problem-internal-findings.md`

---

## STEP 3: File Output

**Always generate:**
- `docs/prompts/{category}/{topic}-problem-prompt.md` — English prompt
- `docs/prompts/{category}/{topic}-problem-prompt-ko.md` — Korean prompt (if user's primary language is Korean)
- `docs/reports/{topic}-problem-internal-findings.md` — Internal investigation results

**Korean translation:** Generate Korean version (`-ko.md`) if the user's primary language is Korean. Korean rules:
- Technical terms: first occurrence "한국어(English)", then English only
- Code, file paths, commands, version numbers stay in English

Print prompt to console for copy-paste.

---

## STEP 4: Assessment Report

After agents complete, compile findings:

```markdown
# Problem Investigation: [Brief description]

## Mismatch Summary
- Expected: [X]
- Actual: [Y]
- Type: [runtime/build/logic/performance/regression]

## Internal Investigation Results

### Trace Findings
[Call chain, recent changes, related patterns]

### Root Cause Hypotheses
| # | Hypothesis | Evidence For | Evidence Against | Confidence |
|---|-----------|-------------|-----------------|------------|

### Blast Radius (if applicable)
[Affected callers, test gaps]

## Recommended Fix
[Specific, minimal fix with rationale]

## Awaiting External Review
Paste external AI responses, then use /result to synthesize.
```

---

## STEP 4.5: Hypothesis Verification Gate

**Purpose:** 가설을 런타임 데이터로 검증한 후에만 코드 수정을 진행한다. 가설 수립(STEP 4) → 가설 검증(STEP 4.5) → 코드 수정(STEP 5).

### Fast-track bypass

아래 조건을 **모두** 만족하면 이 단계를 건너뛰고 STEP 5로 직행:
- 가설 confidence가 HIGH
- 모든 evidence가 정적 분석 기반 (코드, 타입, git history)
- `ENVIRONMENT-SUSPECT` 태그가 **없음**

**`ENVIRONMENT-SUSPECT` 태그 시:** bypass 불가. 반드시 런타임 검증 수행.

### Verification Protocol

상위 가설(STEP 4 보고서에서 #1 ranked)에 대해:

**1. 검증 명령어 생성**

Agent 2의 "Verification command" 출력을 기반으로 구체적 검증 계획을 작성:

```
## Hypothesis Verification Plan

### Hypothesis: [top-ranked hypothesis]
### Verification commands:

| # | 명령어/확인 방법 | 가설이 맞으면 예상 결과 | 가설이 틀리면 예상 결과 |
|---|-----------------|----------------------|----------------------|
| 1 | [구체적 명령어] | [expected if true] | [expected if false] |
| 2 | [구체적 명령어] | [expected if true] | [expected if false] |

### AI가 직접 확인 가능:
- [ ] 파일 시스템 상태 (파일 존재 여부, 설정 파일 내용)
- [ ] 환경변수 값
- [ ] git log / git blame

### 사용자 확인 필요:
- [ ] DB 쿼리 실행: `[exact query]`
- [ ] 브라우저 DevTools: [구체적 확인 항목]
- [ ] 서버 로그: `[grep command]`
- [ ] curl/API 테스트: `[exact command]`
```

**2. AI 자동 확인 실행**

직접 확인 가능한 항목은 즉시 실행하고 결과를 기록.

**3. 사용자 확인 요청**

수동 확인이 필요한 항목은 사용자에게 구체적 명령어와 함께 요청:
```
가설을 검증하려면 아래 확인이 필요합니다:
1. [명령어] — 결과를 알려주세요
2. [확인 방법] — 스크린샷 또는 출력값을 붙여주세요
```

**4. 결과 판정**

```
IF 검증 결과가 가설을 확인 (CONFIRMED):
  → "가설 확인됨: [evidence]. STEP 5로 진행합니다."
  → STEP 5 (Fix Application)

IF 검증 결과가 가설을 반증 (DISPROVEN):
  → "가설 반증됨: [why]. 다음 가설(#2)로 이동합니다."
  → 다음 ranked hypothesis로 STEP 4.5 반복

IF 모든 가설이 반증됨:
  → "모든 가설이 반증되었습니다. 배제된 원인: [list]."
  → 사용자에게 새 정보 요청 또는 /research 에스컬레이션

IF 검증 불가 (런타임 접근 불가):
  → "검증에 필요한 [resource]에 접근할 수 없습니다.
     사용자가 [specific action]을 수행해야 합니다."
  → 사용자 응답 대기
```

---

## STEP 5: Fix Application

Based on investigation findings, apply the fix.

**GUARD:** IF `ENVIRONMENT-SUSPECT` tagged AND hypothesis NOT verified in STEP 4.5 → **STOP. Return to STEP 4.5.** Do not apply code fixes for runtime-state bugs without runtime verification.

```
IF root cause is clear and fix is minimal:
  → Apply fix directly. "Applying minimal fix: [description]"

IF fix requires design changes or touches multiple modules:
  → Hand off to /guide. "Fix scope exceeds simple patch. Use /guide to implement: [description]"

IF root cause is unclear even after investigation:
  → Ask user. "Investigation inconclusive. Top hypotheses: [list]. Which to pursue?"
```

After fix is applied (by any path), proceed to STEP 5.1 then STEP 6.

### STEP 5.1: Fix Verification in Reported Environment (MANDATORY)

수정 후 검증은 반드시 **버그가 보고된 환경**에서 수행:
- 브라우저 버그 → 실제 브라우저에서 확인 (Playwright만으로는 불충분)
- 특정 계정/세션 버그 → 해당 세션으로 확인 (새 로그인이 아닌 기존 세션)
- DB 리셋 후 발생한 버그 → 기존 세션이 유효한지 확인
- `ENVIRONMENT-SUSPECT` 태그 → 반드시 보고 환경 + 새 환경 모두에서 확인

**규칙:** 자동화 테스트(Playwright/Jest) PASS는 코드 정합성만 보장. 세션/DB/캐시 같은 환경 요인은 별도 확인 필수.

---

## STEP 6: Post-Fix Routing (MANDATORY)

After fix is applied:

```
## Routing Decision

→ RE-VALIDATE. "Fix applied. Use /validation to re-check."

IF same issue persists after fix (loop count 2+):
  → ESCALATE. "Same issue after [N] fix attempts.
    Consider: different root cause, or use /research to investigate the underlying design."

IF fix reveals a design flaw (not just a bug):
  → RE-ARCHITECT. "This is a design issue, not a bug. Use /research to re-investigate."
```

**Circuit breaker:** Track fix attempts for the same issue (same failing test, same error message pattern, or same affected function). After 3 cycles of /problem → fix → /validation → same failure:
- STOP automated fixing
- Present options to user: (1) different approach, (2) /research for design change, (3) accept current state

---

## STEP 7: Post-External Synthesis

After receiving external AI investigation responses:

1. Run `/result` to synthesize internal agent findings + external AI analysis
2. Or manually merge: "External suggested [X], internal trace found [Y]"
3. Update root cause confidence based on combined evidence

```
Final synthesis:
  1. Confirmed root cause (HIGH confidence from multiple sources)
  2. Alternative hypotheses to investigate if primary fix fails
  3. Regression risks identified
```

**If no external review is provided:** Internal agent findings alone constitute the investigation. Proceed to fix application based on internal evidence only. Mark external review as "skipped."

---

## STEP 8: Quality Checklist

### Must-pass
- [ ] Expected vs Actual clearly stated with specific behavior
- [ ] Evidence includes verbatim error messages (not paraphrased)
- [ ] Internal debugging agents dispatched (TRACE + ROOT CAUSE minimum)
- [ ] Hypotheses are ranked with evidence assessment
- [ ] Fix recommendation is minimal and specific
- [ ] Exit routing includes /validation re-check

### Should-pass
- [ ] Recent git changes checked for regression candidates
- [ ] Blast radius assessed for shared code changes
- [ ] Problem classified by type (runtime/build/logic/performance/regression)
- [ ] Prior /validation report referenced (if coming from validation loop)

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `problem` to **Completed**, update **Artifacts** with generated files, set **Recommended Next** to `/validation, /research, /guide`

---## Anti-Patterns

- **Prescriptive fixes without investigation**: Don't write "change X to Y" before understanding WHY
- **Skipping evidence gathering**: Every diagnosis must cite specific evidence, not intuition
- **Fixing symptoms not causes**: Address root cause, not just the visible error
- **Shotgun debugging**: Don't change multiple things hoping one works — one hypothesis at a time
- **Ignoring blast radius**: Check what else uses the code you're changing
- **No re-verification**: Every fix MUST route back to /validation
- **Infinite fix loops**: After 3 same-issue cycles, escalate — don't keep trying the same approach
