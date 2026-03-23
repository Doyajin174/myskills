---
name: result-synthesizer
description: >
  Synthesize findings from multiple sources (internal investigation + external AI responses)
  into a unified research report. Final step in the prompt pipeline:
  question (broad) → research (deep) → result (synthesize).
  MUST trigger on: "결과 종합", "result", "종합해줘", "합쳐줘", "synthesize",
  "크로스체크", "교차 검증", "결과 정리", "외부 결과", "리서치 결과 정리",
  or when the user has gathered responses from external AI and wants them combined
  with internal findings into a final report.
  State routing: external AI responses received, ready to combine with internal findings.
  Reusable after any /question or /research round.
  Routes to: /spec (decisions ready to lock), /guide (trivial tasks), /research (needs more depth), /problem (bug found).
  Max 2 synthesis rounds per topic before forcing /spec commit.
---

# Result Synthesizer

Combine internal investigation findings + external AI responses into a single, actionable report with cross-validated conclusions.

**Announce at start:** "I'm using the /result skill to synthesize all research findings."

**Pipeline position:**

```
/question → prompts + internal findings
     ↓
User pastes prompt → external AI responses
     ↓
/result ① ← synthesize question findings → approach decided
     ↓
/research → prompts + internal findings
     ↓
User pastes prompt → external AI responses
     ↓
/result ② ← synthesize research findings → decisions ready
     ↓
/spec → lock decisions → /guide → 구현 → /validation

/result is reusable — call it after ANY investigation round.
It reads whatever internal findings + external responses exist and synthesizes them.
```

---

## STEP 0: Gather All Sources

Collect everything available:

### Internal Sources (auto-read)
```
Scan for files matching these patterns:
  docs/reports/*-question-internal-findings.md
  docs/reports/*-research-internal-findings.md
  docs/reports/*-validation-internal-findings.md
  docs/reports/*-problem-internal-findings.md
  docs/reports/*-research-report.md  (legacy — pre-pipeline manual reports)
```

### External Sources (user provides)
The user pastes or references external AI responses. Accept them as:
- Direct paste in chat
- File paths (if user saved responses to files)
- URLs (if responses are in a shared doc — may fail for auth-protected pages; if URL cannot be fetched, paste content directly)

**Label each source** for traceability:
- Internal-Claude (our own agent investigation)
- External-ChatGPT / External-Gemini / External-Perplexity / External-Claude

---

## STEP 1: Source Inventory

Before synthesizing, list what we have:

```markdown
## Source Inventory

| # | Source | Type | Topic | Word Count |
|---|--------|------|-------|------------|
| 1 | Internal investigation | question | Tech landscape | ~2000 |
| 2 | ChatGPT response | question | Tech landscape | ~1500 |
| 3 | Gemini response | question | Tech landscape | ~1800 |
| 4 | Internal investigation | research | AudioWorklet deep-dive | ~3000 |
| 5 | Gemini response | research | Implementation plan | ~2500 |

Total sources: 5
```

**If < 2 sources:** Warn user that cross-validation is limited.

---

## STEP 1.5: claude_guide Knowledge Loading

Read all documents in `claude_guide/` directory. Use the knowledge from these documents to enhance the quality of prompts generated in subsequent steps.

---

## STEP 2: Cross-Validation Matrix

### Synthesis Mode Detection

Detect inbound context to adjust synthesis behavior:

| Inbound From | Mode | Action Mapping |
|-------------|------|---------------|
| `/question` (landscape exploration) | **Discovery** | HIGH = "strong candidate, explore further via /research", MEDIUM = "worth considering", LOW = "unlikely fit" |
| `/research` (deep-dive on specific tech) | **Decision** | HIGH = "adopt — lock in /spec", MEDIUM = "test first before committing", LOW = "hypothesis only", CONFLICT = "needs more /research" |
| `/validation` (implementation quality review) | **Quality Assessment** | HIGH = "confirmed — no action needed", MEDIUM = "worth improving", LOW = "minor suggestion", CONFLICT = "internal and external disagree — investigate" |
| `/problem` (bug investigation) | **Root Cause Analysis** | HIGH = "confirmed root cause — apply fix", MEDIUM = "likely cause — test before committing", LOW = "alternative hypothesis", CONFLICT = "competing diagnoses — need more evidence" |

**How to detect:** Check source file patterns (priority order):
- `*-problem-internal-findings.md` → Root Cause Analysis mode
- `*-validation-internal-findings.md` → Quality Assessment mode
- `*-research-internal-findings.md` → Decision mode
- `*-question-internal-findings.md` → Discovery mode
- Multiple types present → use highest-priority mode from the list above

For each key claim/recommendation, check which sources agree:

```markdown
## Cross-Validation

| Claim | Internal | ChatGPT | Gemini | Perplexity | Confidence |
|-------|----------|---------|--------|------------|------------|
| Use AudioWorklet over ScriptProcessor | Y | Y | Y | - | HIGH |
| 48kHz→16kHz decimation needed | Y | Y | Y | - | HIGH |
| FIR anti-aliasing filter required | Y | N | N | - | MEDIUM (only internal found this) |
| Cloudflare Tunnel for exposure | Y | Y | Y | - | HIGH |
| HMAC token over simple token | N | N | Y | - | LOW (only one source) |
```

**Confidence levels → Action mapping:**
- **HIGH**: All sources agree (or 3+ in absolute terms) → action per mode table above
- **MEDIUM**: Majority agrees but minority disagrees or is silent → **test first** (validate before committing)
- **LOW**: Only 1 source mentions it → **hypothesis** (note but don't act yet)
- **CONFLICT**: Sources actively disagree (contradictory claims) → **research more** (need `/research` deep-dive on this specific item)

**Note:** With only 2 sources, 2/2 agreement = HIGH, not MEDIUM. Confidence is about agreement ratio, not absolute count.

---

## STEP 3: Conflict Resolution

For each item below HIGH confidence (CONFLICT, LOW, or MEDIUM with opposing evidence):

```markdown
## Conflicts & Uncertainties

### Anti-aliasing filter (MEDIUM)
- **Internal says:** FIR 7-tap filter mandatory — naive decimation causes 8-24kHz aliasing
- **External says:** Just take every 3rd sample
- **Resolution:** Internal is technically correct. Naive decimation does alias.
  Impact depends on use case — for STT, aliased frequencies may or may not
  affect accuracy. Recommend testing both.
- **Action:** Test with and without filter, compare STT word error rate.
```

---

## STEP 4: Generate Unified Report

### Report Template

```markdown
# [Topic] — Research Synthesis Report

> Synthesized from [N] sources on [date]

## Executive Summary
[3-5 sentences: what we learned, key decisions, confidence level]

## Consensus Findings (HIGH confidence)
[Items all sources agree on — safe to act on immediately]

## Strong Recommendations (MEDIUM confidence)
[Items most sources agree on — act on with awareness of caveats]

## Needs Further Investigation (LOW confidence)
[Items only one source mentioned — worth exploring but don't commit yet]

## Conflicts & Divergences
[Items where sources disagree — include both perspectives and resolution]

## Decision Matrix
[Final comparison table combining all sources]

| Option | Consensus Rating | Key Strengths | Key Risks | Recommended? |
|--------|-----------------|---------------|-----------|--------------|

## Recommended Next Steps
1. [Immediate action based on HIGH confidence findings]
2. [Investigation needed for MEDIUM items]
3. [Defer or test for LOW/CONFLICT items]

## Source Attribution
[Which finding came from which source — for traceability]

## Appendix: Raw Source Summaries
[Brief summary of each source's key points.
Preserve exact numbers (versions, benchmarks, measurements), specific API names,
and direct quotes. Summarize narrative explanations and general observations.]
```

---

## STEP 5: File Output

Save to:
- `docs/reports/{topic}-synthesis-report.md`

**Korean translation:** Generate Korean version (`-ko.md`) if the user's primary language is Korean. Korean rules:
- Technical terms: first occurrence "한국어(English)", then English only
- Code, file paths, commands, version numbers stay in English

Print executive summary + decision matrix to console.

---

## STEP 6: Actionable Handoff

Based on synthesis findings, route to the appropriate next step:

```
If findings point to a clear winner (MEDIUM+ complexity — multiple files, external dependencies, or architectural decisions needed):
  → "Decisions ready to lock. Use /spec to define the implementation specification."

If findings point to a clear winner (TRIVIAL/SIMPLE — single file, no external dependencies, no architectural decisions):
  → "Simple enough to implement directly. Use /guide to start."

If 2-3 options need deeper comparison:
  → "Use /research to deep-dive on [Option A] and [Option B]."

If fundamental uncertainty remains:
  → "Need proof-of-concept. Build minimal prototype of [X] to validate."

If a bug or error was discovered during synthesis:
  → "Use /problem to investigate: [specific issue]"
```

---

## STEP 6 (continued): Circuit Breaker

Track research iteration depth by checking for existing synthesis reports.
**Detection:** If `docs/reports/{topic}-synthesis-report.md` already exists, read its Source Inventory and confidence levels. If the current round has the same sources and unchanged confidence levels, this is a repeat without new information.

If this is the 2nd `/result` synthesis for the SAME topic without new information:

```
⚠️ Research cycle limit reached.
You've synthesized findings on [topic] twice without convergence.

Options:
1. Lock decisions now → /spec (accept current best option with noted risks)
2. Change research angle → /research with a DIFFERENT question
3. Abandon this approach → return to /question for alternative exploration
```

**Signs of research thrashing (stop and escalate):**
- Same options keep appearing in successive rounds
- Confidence levels haven't changed between rounds
- No new sources or evidence in the latest round
- User has pasted the same external AI response twice

---

## STEP 7: Quality Checklist

### Must-pass
- [ ] All available sources inventoried (internal + external)
- [ ] Synthesis mode detected (Discovery / Decision / Quality Assessment / Root Cause Analysis)
- [ ] Cross-validation matrix complete for key claims
- [ ] Confidence levels assigned (HIGH/MEDIUM/LOW/CONFLICT)
- [ ] Executive summary is actionable (not just descriptive)
- [ ] Routing decision present with next step

### Should-pass
- [ ] Conflicts explicitly noted with resolution or "needs testing"
- [ ] Decision matrix present with clear recommendation column
- [ ] Source attribution included for traceability
- [ ] Exact numbers, versions, and API names preserved (not summarized away)

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `result` to **Completed**, update **Artifacts** with generated files, set **Recommended Next** to `/spec, /guide`

---## Anti-Patterns

- **Cherry-picking**: Don't only include findings that support one option
- **False consensus**: 2 AI tools parroting the same blog post ≠ independent confirmation
- **Ignoring internal findings**: Internal investigation often finds things external AI misses (e.g., FIR filter)
- **No conflicts**: If zero conflicts found, verify this isn't false consensus (AI tools parroting the same source). For factual claims with independent convergence, zero conflicts is acceptable.
- **Recommendation without confidence**: Always state how sure you are and why
