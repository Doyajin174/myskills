# Bug Investigation: LLM Prompt Logic — Bootstrap Gate Skipped in Orchestrator Skill

> Act as a senior prompt engineer debugging a logic bug in a multi-step LLM skill system.
> You have deep experience with LLM instruction design, control flow in natural language prompts, and Claude's instruction-following behavior.
> Focus on root cause analysis of why the LLM doesn't follow the bootstrap gate, not surface-level fixes.

## System Context
A Claude Code custom skills system with 16 pipeline skills orchestrated by an `/orchestrator` skill. The orchestrator is a SKILL.md (markdown prompt) that instructs Claude to classify user requests and route them to specialized skills. A `/guide` skill compiles "enriched prompts" (project context + best practices) that downstream skills use for higher quality output.

## Expected vs Actual
- **Expected:** For non-trivial requests, orchestrator calls /guide first (bootstrap), which generates enriched prompts. Then on next turn, orchestrator routes to the classified target skill with enriched context.
- **Actual:** Orchestrator skips /guide and directly invokes the classified target skill. `bootstrap_completed` stays false, `enriched_prompt_paths` stays empty.
- **Frequency:** Always — bootstrap has never been observed to work in production.

## Evidence

### Contradiction 1: Non-linear flow
STEP 1.5 (Bootstrap Gate) says: "STEP 2로 분류 먼저 실행" (go to STEP 2 for classification first). After STEP 2 completes, the LLM should return to STEP 1.5 lines 94-103 to decide routing. But there is no explicit "return here" marker. The LLM proceeds linearly: STEP 2 -> STEP 3 -> STEP 4, never returning.

### Contradiction 2: Report template
STEP 3 template: "다음 스킬: /[skill-name]" — LLM fills with classified skill name. After reporting "다음 스킬: /code-migration", it naturally invokes /code-migration in STEP 4, not /guide.

### Contradiction 3: Rule 7 (3-action constraint)
Critical Rule 7 says: "Your entire job is exactly 3 actions: (1) Read state (2) Classify+report+confirm (3) Write+invoke. Anything beyond these 3 is a violation." Bootstrap requires redirecting action (3) to /guide instead of classified skill — this isn't acknowledged in Rule 7.

### Contradiction 4: TRIVIAL 3-way inconsistency
- routing-table.md: TRIVIAL -> /guide
- SKILL.md STEP 1.5: TRIVIAL -> /implementer (skip bootstrap)
- SKILL.md STEP 3 L197: Report "/implementer" but "invoke /guide"

### Contradiction 5: Undefined path
Single-skill non-trivial (e.g., "PR 리뷰해줘" -> /validation only) has no explicit handling. TRIVIAL and multi-skill paths are defined, but single-non-trivial falls through.

## What Changed Recently
The Bootstrap Gate (STEP 1.5) was added to an already-working orchestrator. The original design had no bootstrap — classify and route. The bootstrap was layered on top without restructuring STEPs 2-4 to accommodate it.

## What We've Already Tried
- Adding "확실하지 않으면 bootstrap 포함" as a safety fallback — LLM still skips it.
- Detailed pending_target_skill state table in reference docs — LLM doesn't reference it during execution.

## Constraints
- The orchestrator is a pure router: it only uses Read, Write, Glob, Skill tools
- Must remain a single SKILL.md file (no executable code)
- The 2-turn bootstrap pattern (turn 1: /guide, turn 2: target skill) is intentional
- Enriched prompts are valuable — removing bootstrap is not an option

## Prior Investigation
Internal debugging found 3 compounding root causes:
1. Recency bias: STEP 3/4 instructions override STEP 1.5 (HIGH confidence)
2. Non-linear flow: 1.5->2->back to 1.5 not followed (MEDIUM-HIGH)
3. Rule 7 structural exclusion: 3-action model has no room for bootstrap (MEDIUM)

## Investigation Questions
1. Is there a known pattern for making LLMs reliably execute "classify as X but invoke Y instead" in natural language prompts?
2. Should the bootstrap decision be moved AFTER classification (as STEP 2.5) instead of BEFORE (STEP 1.5) to create linear flow?
3. How should Rule 7 be modified to accommodate the 2-turn bootstrap without weakening the "simple router" constraint?
4. For the TRIVIAL routing inconsistency: should it go to /guide or /implementer? What's the right design?
5. Should single-skill non-trivial requests also get bootstrap, or is it genuinely optional for them?

## Expected Output
- Assessment of whether our 3 hypotheses are correct
- Recommended prompt structure that makes bootstrap reliable
- Specific rewrite suggestions for STEP 1.5, Rule 7, STEP 3, STEP 4
- Design decision on TRIVIAL routing

## Length Target
Keep total response under 2500 words.
