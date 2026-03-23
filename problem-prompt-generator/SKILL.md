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
| What changed recently? (git log, dependency updates, config) | Regression candidate |
| What has already been tried? | Avoid repeating failed fixes |
| Relevant source files (read them) | Context for diagnosis |
| Does a /validation report exist? | Check `docs/reports/` — primary inbound from /validation |

**Primary inbound routes:**
- User reports: "This doesn't work" + description
- /validation report: issues detected automatically
- Monitoring alerts: metrics show anomaly

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

---

## STEP 1.5: claude_guide Knowledge Loading

Read all documents in `claude_guide/` directory. Use the knowledge from these documents to enhance the quality of prompts generated in subsequent steps.

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
           5. Check configs — environment variables, config files, path resolution
           6. Check logs — application logs, error logs if available
           If static analysis is insufficient, note what runtime data would help.
           Return: call chain, type analysis, recent changes, config state, related patterns."

Agent 2 — ROOT CAUSE (hypothesis testing):
  subagent_type: "general-purpose"
  run_in_background: true
  prompt: "Given this error: [error description + evidence]
           Form 2-3 competing hypotheses for the root cause.
           For each hypothesis:
           - What evidence supports it?
           - What evidence contradicts it?
           - How would you test/prove it?
           Return: ranked hypotheses with evidence assessment."

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

## STEP 5: Fix Application

Based on investigation findings, apply the fix:

```
IF root cause is clear and fix is minimal:
  → Apply fix directly. "Applying minimal fix: [description]"

IF fix requires design changes or touches multiple modules:
  → Hand off to /guide. "Fix scope exceeds simple patch. Use /guide to implement: [description]"

IF root cause is unclear even after investigation:
  → Ask user. "Investigation inconclusive. Top hypotheses: [list]. Which to pursue?"
```

After fix is applied (by any path), proceed to STEP 6 (Post-Fix Routing).

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
2. Markdown body: add `problem` to **Completed**, update **Artifacts** with generated files, set **Recommended Next** to `/validation, /guide`

---## Anti-Patterns

- **Prescriptive fixes without investigation**: Don't write "change X to Y" before understanding WHY
- **Skipping evidence gathering**: Every diagnosis must cite specific evidence, not intuition
- **Fixing symptoms not causes**: Address root cause, not just the visible error
- **Shotgun debugging**: Don't change multiple things hoping one works — one hypothesis at a time
- **Ignoring blast radius**: Check what else uses the code you're changing
- **No re-verification**: Every fix MUST route back to /validation
- **Infinite fix loops**: After 3 same-issue cycles, escalate — don't keep trying the same approach
