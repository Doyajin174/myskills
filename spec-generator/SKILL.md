---
name: spec-generator
description: >
  Translate research decisions into concrete implementation specifications.
  Bridges the gap between "/result (what to use)" and "/guide (build it)".
  Outputs: target solution, file change map, interfaces, constraints, acceptance criteria.
  Pipeline position: /question → /result → /research → /result → /spec → /guide.
  MUST trigger on: "명세", "스펙", "spec", "뭘 만들지 확정", "구현 계획", "implementation spec",
  "요구사항 정리", "만들 거 정리", "acceptance criteria", or when research is done and the user
  wants to define exactly what to build before coding starts.
  NOT for broad exploration (/question), deep research (/research), or actual coding (/guide).
  State routing: research complete, decisions ready to lock before implementation.
  If too many unknowns → /research. If impl ready → /guide (after spec).
  If bug found → /problem. If artifact needs quality review → /validation.
---

# Spec Generator

Translate research conclusions into a concrete, unambiguous implementation specification. This is the "what exactly are we building?" document that `/guide` consumes.

**Announce at start:** "I'm using the /spec skill to define the implementation specification."

**Pipeline position:**

```
/question → /result① → /research → /result②
                                        ↓
                                    /spec  ← YOU ARE HERE
                                    "리서치 끝. 정확히 뭘 만들지 확정"
                                        ↓
                                    /guide → 구현 → /validation
                                    ↗ /research (too many unknowns)
                                    ↗ /problem (bug found)
```

**Why this exists:** Without `/spec`, `/guide` receives vague research conclusions ("AudioWorklet이 좋대") and must simultaneously interpret research AND plan implementation. This causes scope drift and wasted context. `/spec` forces a decision checkpoint.

---

## STEP 0: Read Research Conclusions

Read the latest `/result` synthesis report:

```
Scan for:
  docs/reports/*-synthesis-report.md  (most recent)
  docs/reports/*-research-report.md   (if no synthesis)
```

Extract:
- Chosen approach (from HIGH confidence findings)
- Open questions (from MEDIUM/LOW/CONFLICT items)
- Constraints identified during research

**If no research report exists:** Offer options:
1. Proceed with user-provided context (if user has domain knowledge or external research)
2. Redirect to /research for structured investigation
3. Redirect to /question if the scope itself is unclear

---

## STEP 1: Decision Lock-In

Force explicit decisions on everything still open:

```markdown
## Decision Checklist

| Decision | Status | Choice |
|----------|--------|--------|
| Core approach | LOCKED | [e.g., AudioWorklet + WebSocket binary] |
| Auth method | LOCKED | [e.g., HTTP Basic + HMAC token] |
| Deployment | LOCKED | [e.g., Cloudflare Named Tunnel] |
| Anti-aliasing | OPEN | [FIR filter vs naive — needs testing] |
```

Rules:
- LOCKED = decided, no more discussion
- OPEN = will be resolved during implementation (must have fallback)
- Every OPEN item needs a **default choice** and **when to switch**

**If too many items are OPEN (more OPEN than LOCKED, or 3+ core decisions OPEN):** Redirect to `/research` for more investigation.

---

## STEP 1.5: claude_guide Knowledge Loading

Read all documents in `claude_guide/` directory. Use the knowledge from these documents to enhance the quality of prompts generated in subsequent steps.

---

## STEP 2: Generate Spec Document

### Template

```markdown
# [Feature Name] — Implementation Specification

> Generated from research synthesis on [date]
> Research report: [link to synthesis report]

## Goal
[One sentence: what this implementation achieves]

## Chosen Approach
[2-3 sentences: the specific technology/architecture chosen and why]

## Decisions (Locked)
| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | [topic] | [choice] | [why, from research] |

## Decisions (Open — resolve during implementation)
| # | Decision | Default | Switch If |
|---|----------|---------|-----------|
| 1 | [topic] | [default choice] | [condition to change] |

## Scope
### In Scope
- [feature 1]
- [feature 2]

### Out of Scope
- [explicitly excluded feature]
- [future work, not this round]

## File Change Map
| Order | File | Action | Purpose |
|-------|------|--------|---------|
| 1 | `path/to/file` | Create/Modify | [what it does] |

## Interfaces & Contracts
[Key interfaces between components — what data flows where]

```
Component A → [data format] → Component B
```

## Constraints
- [from research: hardware, budget, compatibility]
- [from project: existing code patterns, test requirements]

## Acceptance Criteria
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| [from research MEDIUM/CONFLICT items] | | | |

## Dependencies
- [external: libraries, services, accounts needed]
- [internal: other code that must exist first]

## Estimated Complexity
[TRIVIAL / SIMPLE / MEDIUM / COMPLEX — for /guide classification hint]
[Brief justification: number of files, external deps, architectural decisions]
```

---

## STEP 3: Validate Spec Completeness

Before handing off to `/guide`, verify:

### Must-have (spec document)
- [ ] Goal is one sentence, unambiguous
- [ ] All HIGH confidence research items are LOCKED decisions
- [ ] Scope has both IN and OUT sections
- [ ] File change map has specific paths
- [ ] Acceptance criteria are testable (not "works well")
- [ ] Every OPEN decision has a default + switch condition

### Should-have (spec document)
- [ ] Interfaces documented between components
- [ ] Risks mapped from research CONFLICT/LOW items
- [ ] Dependencies listed
- [ ] Estimated complexity (for `/guide` classification)

---

## STEP 4: File Output

### Minimal Required Schema

The spec output MUST include at minimum these fields (for /guide to consume):

| Field | Required | Purpose |
|-------|----------|---------|
| Goal (1 sentence) | Yes | /guide uses for scope definition |
| Chosen approach | Yes | /guide uses for complexity classification |
| Locked decisions | Yes | /guide must not re-decide these |
| Scope (in/out) | Yes | /guide uses for boundary checking |
| Acceptance criteria | Yes | /guide uses for verification |
| File change map | Yes | /guide uses for parallel execution planning |
| Open decisions with defaults | If any exist | /guide resolves during implementation |
| Estimated complexity | Recommended | /guide uses for pipeline selection |
| Risks | Recommended | /guide uses for rollback planning |

`/spec` = what/why. `/guide` = how/order. Do not include implementation code in the spec.

Save to:
- `docs/specs/{topic}-spec.md`

**Korean translation:** Generate Korean version (`-ko.md`) if the user's primary language is Korean. Korean rules:
- Technical terms: first occurrence "한국어(English)", then English only
- Code, file paths, commands, version numbers stay in English

Print spec summary to console (Goal + Locked Decisions + Acceptance Criteria). Full spec is in the file.

---

## STEP 5: Quality Checklist

### Must-pass (skill execution)
- [ ] Research report or synthesis read (if exists)
- [ ] All LOCKED decisions have rationale from research
- [ ] Every OPEN decision has a default + switch condition
- [ ] Scope has both IN and OUT sections
- [ ] Acceptance criteria are testable (not "works well")
- [ ] Spec file saved to docs/specs/

### Should-pass
- [ ] Estimated complexity noted for /guide classification
- [ ] Risks mapped from research CONFLICT/LOW items
- [ ] Korean version generated (if user is Korean)
- [ ] Spec printed to console (summary if document is long)

---

## STEP 6: Handoff Routing

```
IF spec is accepted and task is MEDIUM/COMPLEX:
  → "Use /guide to start implementation. /guide will read docs/specs/{topic}-spec.md."

IF spec is accepted and task is TRIVIAL/SIMPLE (single file, no external deps):
  → "Simple enough — use /guide directly. Spec serves as documentation."

IF spec reveals too many unknowns (more OPEN than LOCKED):
  → "Too much uncertainty. Use /research to investigate: [list OPEN items]"

IF a bug is discovered during spec writing:
  → "Use /problem to investigate: [specific issue]"

IF user wants quality review of an existing artifact:
  → "Use /validation to evaluate."
```

**Conditional gate:** /spec is mandatory for MEDIUM/COMPLEX tasks but optional for TRIVIAL/SIMPLE.
/guide will check for spec existence and request one if complexity > SIMPLE.

`/guide` should read the spec file as its primary input, not rely on conversational context.

**If user requests changes:** Revise spec, re-run STEP 3 validation, and re-present.

---

## Anti-Patterns

- **Spec as wishlist**: Every item must be a locked decision or explicitly OPEN with fallback
- **Vague acceptance criteria**: "잘 작동함" → "localhost:8084에서 브라우저 마이크로 STT 동작"
- **No out-of-scope**: If everything is in scope, nothing is — always exclude something
- **Skipping research without justification**: Spec without research or domain knowledge = guessing. If user has external research or expertise, proceed; otherwise redirect to `/question` or `/research`
- **Over-specifying**: Don't include implementation code in the spec — that's `/guide`'s job
- **Ignoring OPEN items**: Every open decision needs a default. "나중에 결정" is not a plan
