---
name: validation-prompt-generator
description: >
  Generate implementation review prompts for external AI AND run internal code audit in parallel.
  Use AFTER implementation to evaluate quality, find gaps, and get improvement suggestions.
  Last step in the development pipeline: question → research → result → guide → validation.
  MUST trigger on: "평가해줘", "리뷰해줘", "validation", "검증", "이거 괜찮아?",
  "잘 만든 거 맞아?", "개선점", "어떻게 개선", "수준이 어때", "프로덕션 수준",
  "production ready", "review my implementation", "code review", "이거 어때",
  "잘 했어?", "놓친 거 없어?", or any request to evaluate completed implementation quality.
  NOT for bug fixing (use problem-prompt-generator) or pre-implementation research
  (use question/research-prompt-generator).
  State routing: implementation artifact EXISTS and needs quality evaluation.
  If no artifact yet → /question or /guide first. If bug/mismatch → /problem.
---

# Validation Prompt Generator

Evaluate completed implementations by generating external AI review prompts AND running internal code audit in parallel. Produces quality assessment with concrete improvement suggestions.

**Announce at start:** "I'm using the /validation skill to evaluate this implementation."

**Pipeline position:**

```
/question → /result① → /research → /result② → /spec → /guide → 구현 완료
                                                                    ↓
                                                              /validation  ← YOU ARE HERE
                                                                1. Read implementation
                                                                2. Generate review prompt for external AI
                                                                3. Run internal audit agents
                                                                4. Combine into assessment report
                                                                    ↓
                                              SHIP → /finishing-a-development-branch
                                              FIX → /problem
                                              RE-ARCHITECT → /research
                                              RE-SCOPE → /guide
```

---

## STEP 0: Implementation Snapshot

Capture what was built:

| What to Read | Why |
|-------------|-----|
| Changed files (`git diff $(git merge-base HEAD main)..HEAD` or ask user for base branch) | What was actually modified |
| New files | What was created |
| `CLAUDE.md` / architecture docs | Design intent |
| Test files | What's covered |
| Prior research reports (`docs/reports/`) | What was recommended vs what was built |

**Extract:**
- Total files changed/created
- Lines of code added
- Key architectural decisions made
- Dependencies added
- Test coverage (if measurable)

---

## STEP 1: Assessment Dimensions

Evaluate across these dimensions:

| Dimension | What to Check |
|-----------|--------------|
| **Correctness** | Does it do what it's supposed to? Edge cases handled? |
| **Security** | Auth, input validation, injection, secrets exposure |
| **Performance** | Bottlenecks, memory leaks, unnecessary computation |
| **Maintainability** | Code clarity, modularity, naming, documentation |
| **Robustness** | Error handling, reconnection, graceful degradation |
| **Completeness** | Missing features from spec? Partial implementations? |
| **Best Practices** | Industry standards followed? Anti-patterns present? |

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

## STEP 2: Dual Execution — Prompt + Internal Audit

### 2A: Generate External AI Review Prompt

```markdown
# Implementation Review Request: [Feature Name]

> Act as a senior engineer conducting a thorough code review.
> You have deep experience with [relevant tech stack] in production.
> Be critical but constructive — find real issues, not style nitpicks.

## What Was Built
[1-3 sentences: what the implementation does]

## Tech Stack
- Language: [X]
- Key libraries: [with versions]
- Platform: [OS, hardware constraints]

## Architecture Decisions Made
[Bullet list of key decisions and why they were chosen]

## Code to Review

### [File 1: path/to/file]
```[language]
[relevant code — not entire file, just key sections]
```

### [File 2: path/to/file]
```[language]
[relevant code]
```

[Include 3-5 most critical files, not everything]

## Prior Research Findings
[What was recommended in research phase — so reviewer can check alignment.
If no prior research exists: "Direct implementation — no prior research phase."]

## Review Questions

1. **Correctness**: Are there logic errors, race conditions, or unhandled edge cases?
2. **Security**: Any vulnerabilities? (injection, auth bypass, secrets exposure, XSS)
3. **Performance**: Bottlenecks? Memory issues? Unnecessary work?
4. **Architecture**: Would you structure this differently? Why?
5. **Missing pieces**: What's not implemented that should be?
6. **Production readiness**: On a scale of 1-10, how production-ready is this?
   What would need to change to reach 9+?

## What NOT to Review
- Style/formatting (we have linters)
- Variable naming (unless genuinely confusing)
- Documentation completeness

## Expected Output
- Severity-ranked list of issues (CRITICAL / IMPORTANT / MINOR)
- For each issue: what's wrong, why it matters, how to fix it
- Per-dimension verdict: PASS / CONCERN / FAIL with specific evidence
- Overall: list of blocking issues / important improvements / nice-to-have
- Top 3 improvements that would have the most impact
- Keep under 2000 words

## Length Target
Keep total prompt under 3000 words. If code sections exceed this, prioritize
the most architecturally significant files and summarize the rest.
```

### 2B: Run Internal Audit Agents (in parallel)

Dispatch audit agents in parallel, each focused on a specific quality dimension:

```
Agent 1 — SECURITY (vulnerability scan):
  subagent_type: "Explore"
  run_in_background: true
  prompt: "Read CLAUDE.md first. Evaluate against project conventions.
           Audit [implementation] for security vulnerabilities:
           - Check for exploitable patterns (eval, innerHTML, SQL concat, exec, subprocess with shell=True)
             Only report if the pattern is exploitable in context — safe wrappers, sanitized input, and
             framework-provided escaping are NOT vulnerabilities.
           - Check auth implementation and session handling
           - Check input validation at system boundaries
           - Check for hardcoded secrets/credentials (ignore env var references, test fixtures, documentation)
           IGNORE: test files, documentation files, comments explaining vulnerabilities, safe usage patterns.
           Return: vulnerability list. Each finding MUST include file:line reference, code snippet,
           and explanation of how it could be exploited. Findings without exploitability evidence → discard.
           If no vulnerabilities found, return 'No security issues identified' with brief justification."

Agent 2 — ARCHITECTURE & PERFORMANCE (structure + perf review):
  subagent_type: "Explore"
  run_in_background: true
  prompt: "Read CLAUDE.md first. Evaluate against project conventions, not generic standards.
           Review [implementation] for structural defects:
           - Check for performance defects that cause measurable impact (N+1 queries, unbounded loops, memory leaks)
           - Check resource cleanup (connections, file handles, event listeners)
           - Compare implementation against research recommendations in docs/reports/
           Do NOT recommend architectural patterns the project has not adopted.
           Do NOT flag coupling/cohesion without concrete evidence of a resulting defect.
           If no research report exists in docs/reports/, read CLAUDE.md for project conventions
           and flag only issues that violate stated patterns or would cause runtime failures.
           Return: defect list. Each finding MUST include:
             - file:line reference and code snippet
             - concrete impact (what breaks, degrades, or becomes unmaintainable)
           Findings without file:line evidence → discard.
           Improvements without defect evidence → omit.
           If no defects found, return 'No architectural/performance defects identified' with brief justification."

Agent 3 — COMPLETENESS (spec alignment):
  subagent_type: "Explore"
  run_in_background: true
  prompt: "Read CLAUDE.md first. Evaluate against project conventions.
           Check [implementation] completeness:
           - Compare against spec in docs/specs/ (if exists)
           - List features from spec that are missing or partial
           - Check test coverage gaps for critical paths
           - Note TODO/FIXME/HACK counts as informational context only —
             do NOT report as issues unless they indicate incomplete critical functionality.
           Return: gap list. Each gap MUST include:
             - spec section or requirement it traces to
             - file where implementation should exist
           Gaps that cannot cite a specific spec requirement or task description clause → discard.
           If no spec exists in docs/specs/, compare against the research
           synthesis in docs/reports/ or the original task description.
           Report 'No formal spec found — compared against [source].'
           If no gaps found, return 'Implementation complete against [source]' with brief justification.
```

**Agent dispatch rules:**
- Agent 1 (SECURITY) and Agent 2 (ARCHITECTURE) always dispatched
- Agent 3 (COMPLETENESS) only if spec or research report exists; skip for documentation-only or config-only changes
- If implementation is non-code (markdown, config), skip SECURITY agent

**Severity definitions (apply across all agents):**
- **CRITICAL:** Runtime failure, security vulnerability, data loss risk
- **IMPORTANT:** Performance degradation, maintainability issue, spec non-compliance
- **MINOR:** Improvement possible but no impact on current behavior

**After all agents complete:**
- Reconcile findings across agents — deduplicate overlapping issues
- **Filter:** Discard findings without file:line evidence or concrete impact statement
- If any agent returned empty results: this is valid. Do not treat empty results as a gap
- Prioritize remaining findings by severity before compiling the report

Save to `docs/reports/{topic}-validation-internal-findings.md`.

---

## STEP 3: File Output

**Always generate:**
- `docs/prompts/{category}/{topic}-validation-prompt.md` — External review prompt (EN)
- `docs/prompts/{category}/{topic}-validation-prompt-ko.md` — Korean version (if user's primary language is Korean)
- `docs/reports/{topic}-validation-internal-findings.md` — Internal audit results

**Korean translation:** Generate Korean version (`-ko.md`) if the user's primary language is Korean. Korean rules:
- Technical terms: first occurrence "한국어(English)", then English only
- Code, file paths, commands, version numbers stay in English

Print prompt to console for copy-paste.

---

## STEP 4: Assessment Report Template

After internal audit completes (before external responses):

```markdown
# Implementation Assessment: [Feature Name]

## Quick Summary
- Files: [N] modified, [M] created
- Lines added: [X]
- Test coverage: [Y]% (or "no tests" / "manual testing only")

## Internal Audit Results

### Security: [PASS / WARN / FAIL]
[Findings]

### Performance: [PASS / WARN / FAIL]
[Findings]

### Completeness: [X/Y features implemented]
| Feature | Status | Notes |
|---------|--------|-------|
| [from spec] | Done / Partial / Missing | |

### Issues Found
| # | Severity | Description | File:Line | Suggested Fix |
|---|----------|-------------|-----------|---------------|
| 1 | CRITICAL | ... | ... | ... |
| 2 | IMPORTANT | ... | ... | ... |

## Preliminary Score: [X/10]
[Justification — what's good, what needs work]

## Awaiting External Review
Paste external AI responses, then use /result to synthesize.
```

---

## STEP 5: Post-External Synthesis

After receiving external AI reviews:

1. Run `/result` to synthesize internal audit + external reviews
2. Or manually merge: "External found X that internal missed"
3. Produce final prioritized improvement list

```
Final output:
  1. CRITICAL fixes (do before deploy)
  2. IMPORTANT improvements (do soon)
  3. MINOR enhancements (nice to have)
  4. Overall score consensus: [X/10]
```

**If no external review is provided:** The internal audit alone constitutes the assessment. Produce the routing decision based on internal findings only. Mark external review as "skipped" in the report.

---

## STEP 6: Quality Checklist

### Must-pass
- [ ] Implementation snapshot includes git diff summary
- [ ] All 7 assessment dimensions addressed
- [ ] Code snippets in prompt are key sections, not full dumps
- [ ] Internal audit agents dispatched with subagent_type
- [ ] Issues are severity-ranked (CRITICAL / IMPORTANT / MINOR)
- [ ] Routing decision present (ship / fix / re-architect / re-scope)

### Should-pass
- [ ] Prior research findings referenced (alignment check)
- [ ] Review questions are specific to this implementation
- [ ] Score justification cites specific evidence
- [ ] Korean version generated (if user is Korean)

---

## STEP 7: Post-Validation Routing (MANDATORY)

After assessment, output ONE of these routing decisions:

```
## Routing Decision

Based on the assessment:

IF no CRITICAL/IMPORTANT issues:
  → SHIP. "Ready to deploy. Use /finishing-a-development-branch."

IF bugs or security issues found:
  → FIX. "Use /problem to address: [list specific issues]"

IF architectural/design flaws found:
  → RE-ARCHITECT. "Use /research to re-investigate: [specific design question]"

IF missing features or scope gaps:
  → RE-SCOPE. "Use /guide to implement missing: [list features]"
```

**Priority ordering:** If multiple categories apply, route to the highest-priority action and list remaining issues as follow-up:
FIX (bugs/security) > RE-ARCHITECT (design flaws) > RE-SCOPE (missing features) > SHIP

This routing is not optional. Every validation MUST end with an explicit next step.

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `validation` to **Completed**, update **Artifacts** with generated files, set **Recommended Next** to `/finishing, /problem, /guide, /research`

---## Anti-Patterns

- **Rubber stamp**: "Looks good" without evidence — if no issues found, state "No issues identified in [dimension]" with specific justification for why the code passes. Empty findings are valid when supported by evidence of quality
- **Style policing**: Focus on bugs/security/architecture, not formatting
- **Full file dumps**: Include only relevant sections in the prompt
- **No prior context**: Always reference what research recommended
- **No routing decision**: Every validation MUST end with ship/fix/re-architect/re-scope
- **Ignoring internal audit**: Don't skip self-review just because external is coming
- **Scoring without criteria**: Never assign X/10 without per-dimension justification — gut feelings are not assessments
- **Reviewing against wrong baseline**: Validate against what was specified (spec/research), not personal preferences
- **Context-free evaluation**: Never evaluate against "general best practices" without reading CLAUDE.md first. Project conventions override textbook patterns
- **Evidence-free findings**: Every reported issue MUST have file:line reference + code snippet + concrete impact. Vague assertions like "coupling is too high" without pointing to specific code are false positives
- **Forced finding quota**: Do NOT manufacture issues to avoid empty results. If code is clean, say so with justification
