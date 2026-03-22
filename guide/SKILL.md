---
name: guide
description: >
  Adaptive task orchestration skill. Classifies complexity via risk/ambiguity/coupling
  (not file count), selects pipeline depth, generates structured subagent prompts,
  dispatches with specialized agent types, and handles failure recovery.
  Use when the user wants to implement any feature or task via subagent dispatch.
---

# Adaptive Guide v2 — Task Orchestration & Subagent Dispatch

**Announce at start:** "I'm using the /guide skill to build an adaptive pipeline for your request."

**Core philosophy:** Bounded implement→verify micro-loops, not big-bang. Risk-aware classification, not file counting. Fail fast and recover, don't loop forever.

---

## STEP 0: 요청 파악 + 프로젝트 컨텍스트

1. Parse `$ARGUMENTS` to understand user's request
2. Explore `claude_guide/` for relevant documents (hooks, skills, conventions)
3. Read root `CLAUDE.md` for project-specific rules and constraints
4. Check execution memory (`guide_memory.md`) for past patterns on similar tasks
5. Summarize findings internally — do NOT dump raw file content forward

---

## STEP 1: 복잡도 분류 (Risk-Driven Classification)

Classify by **risk → ambiguity → verification → coupling → file count** (in that order).

### Phase 1: Requirement Clarity
```
Are acceptance criteria clearly defined?
├─ NO → EXPLORATORY
└─ YES → continue
```

### Phase 2: Risk Assessment
```
Does change touch: DB schema, auth/permissions, public API contracts,
production config, destructive operations, or payment/billing?
├─ YES → add HIGH_RISK tag (forces approval gate regardless of complexity)
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
├─ YES, describable in one sentence → TRIVIAL
├─ YES, within one module → SIMPLE
├─ NO, crosses module boundaries → MEDIUM
└─ NO, crosses multiple interfaces/contracts → COMPLEX
```

### Phase 5: Adjust (secondary signals)
- File count > 10 → bump +1 if not already COMPLEX
- Unknown dependency graph → bump +1
- Default under uncertainty → MEDIUM

### Mid-Flight Reclassification
After Research phase completes, reassess:
- Scope smaller than expected → downgrade (e.g., MEDIUM → SIMPLE)
- Hidden complexity discovered → upgrade (e.g., SIMPLE → COMPLEX)
- Ambiguity remains → switch to EXPLORATORY

---

## STEP 2: 파이프라인 선택

| Complexity | Pipeline |
|------------|----------|
| **Trivial** | Scope → Implement → Verify |
| **Simple** | Scope → Light Design → [Implement→Verify]ⁿ → Final Verify |
| **Medium** | Scope → Research → Design → [Implement→Verify]ⁿ → Final Verify |
| **Complex** | Scope → Parallel Research → Design + APPROVAL GATE → [Maker→Reviewer]ⁿ → Integration Verify |
| **Exploratory** | Scope → Research Loop → Structured Report → STOP |

**HIGH_RISK tag** → forces APPROVAL GATE after Design, regardless of complexity level.

### Implement→Verify Loop Rules
- **Max retries:** 3 per step. After 3 failed verify cycles:
  1. Revert changes (`git checkout` the affected files)
  2. Summarize what was attempted and why it failed
  3. Report dead-end to user with options: retry differently, adjust scope, or abort
- **Partial success:** If 3/4 steps pass but 1 fails, commit passing work, isolate failure.

### Complex: Maker→Reviewer Pattern
For COMPLEX tasks, split implement and verify across different agents:
1. **Maker Agent** — writes the code
2. **Reviewer Agent** — given original scope + maker's output, writes failing tests, finds edge cases, checks for regressions
This prevents confirmation bias (the author is blind to their own mistakes).

---

## STEP 3: 서브에이전트 프롬프트 생성

Generate a structured prompt for the subagent. **Sections are tiered by complexity:**

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
<parallel>{which portions can run independently, dependency boundaries}</parallel>
```

### Add for COMPLEX only
```xml
<approval_gate>{what needs user confirmation before proceeding}</approval_gate>
<recovery>{max retries, rollback triggers, escalation path}</recovery>
<alternatives>{list 2-3 approaches, critique each, justify chosen one}</alternatives>
```

### Structural Thinking Directives (replace "think hard/ultrathink")

Instead of abstract keywords, specify concrete reasoning requirements:
- **Research phase:** "List what you found AND what you didn't find. Flag assumptions."
- **Design phase:** "Describe 2-3 alternative approaches. Critique each. Justify your choice."
- **Implement phase:** "After each file change, verify no raw values/broken imports before moving on."
- **Verify phase:** "If test fails, diagnose root cause before retrying. Don't guess-fix."

### Context Management
- At **phase boundaries**: summarize findings, discard raw file contents
- Retain: function signatures, interface contracts, error messages, decisions made
- Discard: implementation boilerplate, unchanged file contents, verbose logs
- If context feels heavy: synthesize into a brief before continuing

---

## STEP 4: 유저에게 보고 + 확인

Present a summary to the user before execution:

```
📋 태스크: [task description]
📊 복잡도: [TRIVIAL/SIMPLE/MEDIUM/COMPLEX/EXPLORATORY] [+HIGH_RISK if applicable]
🔧 파이프라인: [selected pipeline phases]

Phase 1 ([name]): [brief description]
Phase 2 ([name]): [brief description]
...

실행할까요?
```

**Wait for user confirmation before proceeding.**

---

## STEP 5: 서브에이전트 디스패치

### Agent Type Selection

| Phase | Agent Type | Reasoning |
|-------|-----------|-----------|
| Research / Exploration | `subagent_type: "Explore"` | Read-only, fast, broad search |
| Design / Planning | `subagent_type: "Plan"` | Architecture decisions, no code changes |
| Implementation | `subagent_type: "general-purpose"` or specialized | Code changes, full tool access |
| Review (Complex) | `subagent_type: "superpowers:code-reviewer"` | Adversarial review of implementation |

### Dispatch Strategy

| Complexity | Strategy |
|------------|----------|
| **Trivial / Simple** | Single agent with lightweight prompt |
| **Medium** | Single agent with full prompt (internal loops) |
| **Complex** | Phase-split: Explore agent → Plan agent → Implement agent(s) → Reviewer agent |
| **Exploratory** | Explore agent only → structured report → user decides |

### Parallel Execution Rules
Parallel agents are allowed ONLY when tasks are in **separate dependency boundaries**:
- Different files that DON'T import from each other ✅
- Different modules with no shared interfaces ✅
- Same file ❌
- Different files that share an interface/contract ❌
- Files where one imports from the other ❌

When in doubt, run sequentially.

---

## STEP 6: 결과 보고

### Summary Format
```
📊 실행 결과: [task description]
복잡도: [level] | 파이프라인: [phases executed]

## What Changed
[1-3 sentences: what was done and why]

## Files Modified
- path/to/file.py — [what changed]
- path/to/other.py — [what changed]

## Verification
- [test/check name]: ✅ passed / ❌ failed
- [test/check name]: ✅ passed / ❌ failed

## Remaining Issues
- [any unresolved items, or "None"]
```

For COMPLEX tasks, include the step-by-step table:
```
| Step | Status | Details |
|------|--------|---------|
| Research | ✅ | [brief] |
| Design | ✅ | [brief] |
| Implement 1 | ✅ | [brief] |
| Review | ⚠️ | [issues found] |
| Fix | ✅ | [resolved] |
```

**On failure:** Report what was attempted, what failed, revert if needed, present options:
1. Retry with adjusted approach
2. Reduce scope
3. Abort and revert

---

## STEP 7: 실행 메모리 업데이트 (Execution Memory)

After each completed execution, append one line to `guide_memory.md`:

```
[date] | [complexity] | [task summary] | [pipeline used] | [result: success/partial/fail] | [lesson]
```

Example:
```
2026-03-20 | MEDIUM | STT accuracy improvement | Research→Design→Implement×6→Verify | success | RMS normalization + domain dictionary worked well as parallel changes
2026-03-20 | SIMPLE | Add collect_stt.py | Design→Implement→Verify | success | Reusing VAD logic from local.py saved time
```

- Keep only the **last 20 entries**
- Read this file in STEP 0 to inform classification and pipeline selection
- If a similar task previously failed, flag the failure pattern before proceeding

---

## Anti-Pattern Prevention

Include these rules in every subagent prompt:
- **No big-bang implementation** — small bounded steps, verify between each
- **No rigid pipeline** — skip/merge phases when complexity allows
- **No guess-fixing** — diagnose root cause before attempting a fix
- **No context hoarding** — summarize at boundaries, discard raw data
- **No implementation under uncertainty** — EXPLORATORY produces research, not code
- **No infinite retry** — 3 strikes then revert and escalate
- **No same-boundary parallel** — check dependency graph before parallelizing
