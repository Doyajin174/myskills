---
name: guide
description: >
  Adaptive task orchestration skill. Classifies complexity via risk/ambiguity/coupling
  (not file count), selects pipeline depth, generates structured subagent prompts,
  dispatches with specialized agent types, and handles failure recovery.
  Use when the user wants to implement any feature or task via subagent dispatch.
  State routing: implementation-ready state with clear requirements.
  If no approach decided → /question. If approach needs deep-dive → /research.
  If decisions not locked → /spec. If implementation complete → /validation.
  If bug found → /problem.
---

# Adaptive Guide v2 — Task Orchestration & Subagent Dispatch

**Announce at start:** "I'm using the /guide skill to build an adaptive pipeline for your request."

**Pipeline position:**

```
/question → /result① → /research → /result② → /spec
                                                  ↓
                                              /guide  ← YOU ARE HERE
                                              1. Read spec (if exists)
                                              2. Classify complexity
                                              3. Select pipeline
                                              4. Dispatch subagents
                                              5. Verify implementation
                                                  ↓
                                              /validation → ship / fix / re-architect
```

**Core philosophy:** Bounded implement→verify micro-loops, not big-bang. Risk-aware classification, not file counting. Fail fast and recover, don't loop forever.

---

## STEP 0: 요청 파악 + 프로젝트 컨텍스트

1. Parse `$ARGUMENTS` to understand user's request
1.5. **Vagueness check:** If the request has no identifiable target (module, file, feature, or behavior), route to `/question`: "Request too broad for /guide. Use /question to clarify requirements first."
2. Read root `CLAUDE.md` for project-specific rules and constraints
3. Explore `.claude/skills/` for relevant skill conventions
4. Read spec file if available (`docs/specs/{topic}-spec.md`) — this is the primary input when coming from `/spec`
5. Read synthesis report if available (`docs/reports/{topic}-synthesis-report.md`) — for confidence-mapped decisions
6. Check execution memory (`guide_memory.md`) for past patterns on similar tasks
7. Summarize findings internally — do NOT dump raw file content forward

**Context rule:** Ground implementation in finalized artifact files (`docs/specs/`, `docs/reports/`), not conversation history. Discard exploratory chat context.

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

**Note:** Bumps are applied AFTER Phase 4 assigns a base level. If already COMPLEX, bump adds HIGH_RISK tag instead of a nonexistent higher level.

### Phase 4: Change Coupling
```
Is the change isolated to a single module/boundary?
├─ YES, single edit to single function in single file, no new tests needed → TRIVIAL
├─ YES, within one module but multiple functions or new tests needed → SIMPLE
├─ NO, crosses module boundaries → MEDIUM
└─ NO, crosses multiple interfaces/contracts → COMPLEX
```

### Phase 5: Adjust (secondary signals)
- File count > 10 → bump +1 (cap at COMPLEX)
- Unknown dependency graph → bump +1 (cap at COMPLEX)
- If already COMPLEX and bump triggers → add HIGH_RISK tag instead
- Default under uncertainty → MEDIUM

### Mid-Flight Reclassification
After any phase reveals significant new information, reassess:
- Scope smaller than expected → downgrade (e.g., MEDIUM → SIMPLE)
- Hidden complexity discovered → upgrade (e.g., SIMPLE → COMPLEX)
- Ambiguity remains → switch to EXPLORATORY
- **On downgrade:** preserve any `<risks>` identified at the higher level — pass them through to the subagent prompt even at the lower complexity tier

---

## STEP 1.5: claude_guide Knowledge Loading

Read all documents in `claude_guide/` directory. Use the knowledge from these documents to enhance the quality of prompts generated in subsequent steps.

---

## STEP 2: 파이프라인 선택

| Complexity | Pipeline |
|------------|----------|
| **Trivial** | Scope → Implement → Verify |
| **Simple** | Scope → Light Design → [Implement→Verify]ⁿ → Final Verify |
| **Medium** | Scope → Research → Design → [Implement→Verify]ⁿ → Final Verify |
| **Complex** | Scope → Parallel Research → Design + APPROVAL GATE → [Maker→Reviewer]ⁿ → Integration Verify |
| **Exploratory** | Scope → Research Loop → Structured Report → STOP |

**EXPLORATORY exit routing:** After the Structured Report is delivered:
- If decisions can now be locked → route to `/spec`
- If more investigation needed → route to `/research`
- If requirements are now clear → re-invoke `/guide` (reclassification will assign implementation level)

**HIGH_RISK tag** → forces APPROVAL GATE after Design, regardless of complexity level.

### Implement→Verify Loop Rules
- **Max retries:** 3 per step. After 3 failed verify cycles:
  1. Revert changes: `git checkout -- <modified files>` AND `git clean -f <newly created files>`. Verify with `git status` that working tree is clean.
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

**TRIVIAL without HIGH_RISK:** Skip confirmation — proceed directly. Show a brief inline note: "TRIVIAL: [description]. Proceeding."

**All other levels:**

**Wait for user confirmation before proceeding.**

**If user rejects or modifies:**
- Classification wrong → re-run STEP 1 with user's correction
- Scope wrong → adjust and re-present STEP 4
- Approach wrong → discuss alternatives, update plan
- User aborts → stop, no changes made

Loop STEP 4 until confirmed or aborted.

---

## STEP 5: 서브에이전트 디스패치

### Agent Type Selection

| Phase | Agent Type | Reasoning |
|-------|-----------|-----------|
| Research / Exploration | `subagent_type: "Explore"` | Read-only, fast, broad search |
| Design / Planning | `subagent_type: "Plan"` | Architecture decisions, no code changes |
| Implementation (multi-file or integration) | `subagent_type: "general-purpose"` | Full tool access, cross-file coordination |
| Implementation (single-file, clear spec) | `subagent_type: "general-purpose"` with focused prompt | Faster, constrained scope |
| Review (Complex) | `subagent_type: "superpowers:code-reviewer"` | Adversarial review of implementation |

### Dispatch Strategy

| Complexity | Strategy |
|------------|----------|
| **Trivial / Simple** | Single agent with lightweight prompt |
| **Medium** | Single agent with full prompt (internal loops) |
| **Complex** | Phase-split: Explore agent → Plan agent → Implement agent(s) → Reviewer agent |
| **Exploratory** | Explore agent only → structured report → user decides |

### Dependency Discovery (before parallelizing)

Before dispatching parallel agents, verify independence:
1. List target files for each agent
2. For each file, extract imports/requires
3. Build dependency adjacency: if file A imports from file B, they share a boundary
4. Only files in **disconnected subgraphs** can be parallelized

If this analysis is impractical (dynamic imports, runtime dependencies), default to sequential.

### Parallel Execution Rules
Parallel agents are allowed ONLY when tasks are in **separate dependency boundaries**:
- Different files that DON'T import from each other ✅
- Different modules with no shared interfaces ✅
- Same file ❌
- Different files that share an interface/contract ❌
- Files where one imports from the other ❌

When in doubt, run sequentially.

### Subagent Failure Recovery
- If a subagent returns empty or error: retry once with a simplified prompt (reduce scope, remove optional sections)
- If retry also fails: log the failure, execute that phase manually in the current context, continue the pipeline
- Report any subagent failures in STEP 6 results under "Remaining Issues"

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

**On failure:** Report what was attempted, what failed, then decide:
- **Revert if:** partial changes break existing tests, OR changes are interdependent and partial application is meaningless
- **Keep partial if:** changes are independent and passing portions can be committed separately

Then present options:
1. Retry with adjusted approach
2. Reduce scope
3. Abort and revert

### Handoff
After successful implementation and verification:
→ "Implementation complete. Use `/validation` to evaluate quality before shipping."

---

## STEP 7: 실행 메모리 업데이트 (Execution Memory)

After each completed execution, append one line to `guide_memory.md`:

**Path:** `.claude/skills/guide/guide_memory.md`. If the file does not exist, create it with header: `# Guide Execution Memory`.

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

## STEP 8: Quality Checklist

### Must-pass (before dispatching subagents)
- [ ] Spec file read (if complexity > SIMPLE)
- [ ] Complexity classification justified with specific evidence
- [ ] Pipeline selected matches complexity level
- [ ] Subagent prompt includes context, goal, constraints, output, verification
- [ ] Verification method defined (how to confirm success)

### Should-pass
- [ ] Prior guide_memory.md checked for similar past tasks
- [ ] Parallel execution opportunities identified
- [ ] Rollback plan defined for MEDIUM+ tasks
- [ ] /validation handoff mentioned in results report

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `guide` to **Completed**, update **Artifacts** with modified/created files, set **Recommended Next** to `/validation, /problem`

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
- **No pipeline isolation** — after implementation, always hand off to /validation; don't declare "done" without quality check
- **No research thrashing** — if the same options keep appearing across /question↔/research rounds with no new info, force /spec commit
- **No spec fossilization** — if implementation diverges significantly from spec, update the spec rather than ignoring it
- **No validation laundering** — passing /validation ≠ production-ready; it's a quality checkpoint, not a guarantee
- **No over-routing** — for simple fixes, don't force full pipeline traversal; /guide handles TRIVIAL directly
