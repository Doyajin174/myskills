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

Receive enriched prompts from guide, classify complexity, dispatch subagents, and manage implement→verify loops with git checkpoints.

**Pipeline position:**
```
/guide (enriched prompts 생성)
    ↓
/question → /result → /research → /spec
    ↓
/implementer ← YOU ARE HERE
    1. Read enriched prompt
    2. Classify complexity (from enriched prompt)
    3. Select pipeline
    4. Dispatch subagents
    5. Implement→verify loops
    6. Report results
    ↓
/validation → ship / fix
```

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

## STEP 0: Parse Input

Read enriched prompt (full mode) or gather context (degraded mode).

Extract:
- Original request
- Complexity classification
- Project constraints
- Spec reference (if exists)
- Prior artifacts

---

## STEP 1: Pipeline Selection

| Complexity | Pipeline |
|------------|----------|
| **Trivial** | Scope → Implement → Verify |
| **Simple** | Scope → Light Design → [Implement→Verify]ⁿ → Final Verify |
| **Medium** | Scope → Design → [Implement→Verify]ⁿ → Final Verify |
| **Complex** | Scope → Design + APPROVAL GATE → [Maker→Reviewer]ⁿ → Integration Verify |

**HIGH_RISK** (DB, auth, billing, destructive ops) → forces APPROVAL GATE.

---

## STEP 2: Subagent Prompt Generation

Generate structured prompts for subagents:

### Always Required
```xml
<context>{from enriched prompt or project context}</context>
<goal>{what to achieve, acceptance criteria}</goal>
<constraints>{non-negotiable limits}</constraints>
<output>{expected deliverables, file list}</output>
<verification>{how to confirm success}</verification>
```

### Add for MEDIUM+
```xml
<risks>{edge cases, blast radius, rollback plan}</risks>
```

### Add for COMPLEX
```xml
<approval_gate>{what needs user confirmation}</approval_gate>
<recovery>{max retries, rollback triggers}</recovery>
```

---

## STEP 3: Dispatch Subagents

### Agent Type Selection

| Phase | Agent Type |
|-------|-----------|
| Research / Exploration | `subagent_type: "Explore"` |
| Design / Planning | `subagent_type: "Plan"` |
| Implementation | `subagent_type: "general-purpose"` |

### Dispatch Strategy

| Complexity | Strategy |
|------------|----------|
| **Trivial / Simple** | Single agent |
| **Medium** | Single agent with internal loops |
| **Complex** | Phase-split: Explore → Plan → Implement → Review |

### Parallel Execution Rules
Only parallelize tasks in **separate dependency boundaries**:
- Different files that DON'T import from each other ✅
- Same file or shared interface ❌

When in doubt, run sequentially.

---

## STEP 4: Implement→Verify Loop

```
┌─── IMPLEMENT LOOP ──────────────────────┐
│                                          │
│  1. Agent writes code                   │
│  2. Verify: tsc --noEmit / tests        │
│  3. If errors:                          │
│     ├─ Read errors, fix                 │
│     ├─ Retry (max 3 attempts)           │
│     └─ If 3 failures:                   │
│        git stash + skip + log           │
│                                          │
│  4. If clean:                           │
│     git add + commit                    │
│                                          │
└──────────────────────────────────────────┘
```

### Abort Rules
- 50%+ of batches failed → HARD STOP + /problem
- 2 consecutive failures → reassess strategy
- >20 tsc errors from one change → revert, re-plan

---

## STEP 5: Results Report

```
📊 실행 결과: [task description]
복잡도: [level] | 파이프라인: [phases executed]

## What Changed
[1-3 sentences]

## Files Modified
- path/to/file — [what changed]

## Verification
- tsc --noEmit: ✅/❌
- tests: ✅/❌

## Remaining Issues
- [any unresolved items, or "None"]
```

→ "Implementation complete. Use `/validation` to evaluate quality."

---

## STEP 6: Execution Memory

Append to `.claude/skills/implementer/implementer_memory.md`:

```
[date] | [complexity] | [task] | [pipeline] | [result] | [lesson]
```

Keep last 20 entries. Read in STEP 0 to inform decisions.

---

## Quality Checklist

### Must-pass
- [ ] Enriched prompt or project context read
- [ ] Complexity classification applied
- [ ] Pipeline selected matches complexity
- [ ] Subagent prompts include context, goal, constraints, verification
- [ ] Each successful batch committed
- [ ] Failed batches stashed (not left broken)
- [ ] Results report generated

### Should-pass
- [ ] Prior execution memory checked
- [ ] Parallel opportunities identified
- [ ] Rollback plan defined for MEDIUM+
- [ ] /validation handoff mentioned

---

## Anti-Patterns

- **No big-bang** — small bounded steps, verify between each
- **No guess-fixing** — diagnose root cause before retrying
- **No infinite retry** — 3 strikes then revert and escalate
- **No context hoarding** — summarize at boundaries, discard raw data
- **No committing broken state** — never commit if tsc fails
- **No skipping verification** — every edit followed by build check
- **No prompt generation** — that's guide's job. Implementer executes, not designs.

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `implementer` to **Completed**, update **Artifacts** with modified files, set **Recommended Next** to `/validation, /problem`
