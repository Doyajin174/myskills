---
name: research-prompt-generator
description: >
  Generate structured research prompts for external AI tools (ChatGPT, Gemini, Perplexity, etc.).
  Auto-reads project context, classifies research type, applies type-specific template,
  and outputs a self-contained prompt with evidence pack. MUST trigger on: "리서치 프롬프트",
  "research prompt", "외부 AI", "기술 조사", "비교 분석", "타당성 조사", "feasibility",
  "technology comparison", "조사해줘", "리서치", or any request to generate a prompt for
  pasting into an external AI. NOT for bug investigation or fix prompts (use buildup-prompt-generator).
---

# Research Prompt Compiler v2

Generate self-contained prompts for external AI tools that know NOTHING about our project.

**Announce at start:** "I'm using the /research-prompt-generator skill to create a research prompt for external AI."

**Core philosophy:** The external AI has zero project context. The prompt must be completely self-contained, precise, and structured. Summarize architecture; include evidence verbatim.

---

## STEP 0: 컨텍스트 수집 (Context Gathering)

**Read these sources (expand beyond CLAUDE.md):**

| Source | What to Extract |
|--------|----------------|
| `CLAUDE.md` | Project overview, architecture, conventions |
| Relevant source files | Current implementation related to the topic |
| `package.json` / `requirements.txt` / lockfile | **Exact** dependency versions |
| `docs/` | Existing research, reports, prior prompts |
| `.env.example` / config files | Environment shape, deployment target |
| `git log --oneline -10` | Recent changes related to topic |
| Error logs / CI output | Exact error messages (if troubleshooting) |

**Context rules:**
- **Summarize** architecture, goals, project identity (keep under 200 words)
- **Include verbatim** error messages, config snippets, version numbers, benchmark data
- Don't dump entire files — extract only what's relevant to the research topic

---

## STEP 1: 유저 요구사항 구조화

Parse the request into:

| Category | Question |
|----------|---------|
| **Problem** | What specific gap or issue? |
| **Goal** | What outcome from this research? |
| **Scope** | What to investigate? What's out of scope? |
| **Constraints** | Non-negotiable limits (hardware, budget, compatibility) |
| **Decision criteria** | How to evaluate options (prioritized) |
| **Decision context** | Immediate implementation? Future roadmap? Sprint commitment? |

**If unclear, ask the user before proceeding.**

---

## STEP 1.5: 리서치 유형 분류 (Research Type Classification)

Classify the request into one of these types. Each uses a different template emphasis:

| Type | When | Template Focus |
|------|------|---------------|
| **Comparison** | "X vs Y", "which is better", "compare options" | Side-by-side evaluation table, criteria matrix |
| **Feasibility** | "can we do X?", "is it possible?", "will it work?" | Constraints analysis, risk assessment, proof-of-concept path |
| **Best Practice** | "how should we do X?", "what's the standard?", "recommendations" | Industry patterns, anti-patterns, implementation guidance |
| **Troubleshooting** | "why does X fail?", "how to fix?", "root cause" | Error evidence, reproduction steps, environment details |
| **Architecture** | "how to design X?", "what structure?", "trade-offs" | Requirements, constraints, rejected alternatives, decision criteria |
| **Tool Selection** | "what tool for X?", "buy vs build" | Requirements checklist, candidate list, evaluation matrix |

---

## STEP 2: 프롬프트 생성 (Generate Prompt)

### Core Template (all types)

```markdown
# Research Request: [Topic Title]

> Act as a [relevant expert role, e.g., "senior backend engineer specializing in
> real-time audio processing on Apple Silicon"].

## Project Context
[1-3 sentences: what the project is, platform, key technologies]
[Bullet list: only the architecture components relevant to this research]
[Key dependency versions from package.json/requirements.txt]

## Constraints & Boundaries
[Non-negotiable limits: hardware, budget, performance targets]
- In scope: [what to investigate]
- Out of scope: [what to skip]

## Problem / Motivation
[What prompted this research — with metrics, symptoms, or gaps]

## What We've Already Tried
[Solutions tested and their results — prevents redundant suggestions]

## Evidence Pack
[Verbatim snippets — only include what's relevant:]
- Exact error messages / stack traces
- Config snippets
- Benchmark numbers
- Version manifest excerpt
- Reproduction steps
[If none applicable, omit this section]

## What We Want to Know
[Numbered, answerable questions — mutually exclusive, collectively exhaustive]

## Evaluation Criteria (Priority Order)
[Prioritized list of how to judge options]

## Decision Context
[Why: immediate implementation / sprint planning / future roadmap / strategic evaluation]
[Expected decision after research: choose option, design experiment, reject approach, etc.]

## Expected Output
[Exact deliverable format with length guidance]
[e.g., "Comparison table of top 5 options with columns: Name, Type, Latency,
Memory, Korean Support, License. Keep total response under 1000 words."]

## Source Rules
- Prefer primary sources and official documentation
- Separate facts from inference — flag uncertainty explicitly
- If data is unavailable, say so rather than guessing
```

### Type-Specific Additions

**Comparison** — add to "What We Want to Know":
```
Include a comparison table with these columns: [specify columns].
For each option, note: strengths, weaknesses, and "best for" scenario.
```

**Troubleshooting** — emphasize Evidence Pack, add:
```
## Reproduction
- Steps to reproduce: [1, 2, 3]
- Environment: [OS, runtime version, relevant config]
- Frequency: [always / intermittent / CI-only]
```

**Feasibility** — add:
```
## Acceptable Trade-offs
[Where we're willing to compromise — e.g., "accept 200ms latency if it saves 50% memory"]
## Risk Factors
[What could go wrong, what's uncertain]
```

---

## STEP 3: 한국어 번역 (Optional)

Generate Korean version **only if**:
- User explicitly requests it
- User's primary language is Korean
- Prompt is for internal team documentation

**Translation rules:**
- Technical terms: first occurrence in Korean with English in parentheses, then English only
  - "음성 인식(STT)" first time, then just "STT"
- Code, file paths, commands, version numbers stay in English
- Both versions must be equally self-contained

---

## STEP 4: 파일 출력

**Always generate:**
- `docs/{topic}-research-prompt.md` — English (primary, for AI input)

**If Korean requested:**
- `docs/{topic}-research-prompt-ko.md` — Korean (for team documentation)

`{topic}` = kebab-case descriptor (e.g., `tts-latency-comparison`, `stt-accuracy-improvement`)

**Also print the English prompt to console** for immediate copy-paste.

---

## STEP 5: 품질 체크리스트

### Must-pass (prompt fails without these)
- [ ] Problem statement is specific with metrics/symptoms
- [ ] Constraints include hardware specs and non-negotiable limits
- [ ] "What We've Already Tried" is populated (or explicitly "nothing yet")
- [ ] Questions are numbered and answerable
- [ ] Expected output format is described with length guidance
- [ ] Evidence Pack includes verbatim data where applicable

### Should-pass (improves quality)
- [ ] Expert role specified at top
- [ ] Evaluation criteria are prioritized
- [ ] Decision context explains why this research matters now
- [ ] No internal jargon or file paths that external AI can't understand
- [ ] Version numbers are exact (from dependency files, not memory)
- [ ] Source rules included

---

## Anti-Patterns

- **Vague context**: "We have a voice app" → include architecture, versions, constraints
- **Open-ended questions**: "What should we use?" → specify criteria and constraints
- **Dumping entire files**: Include only relevant excerpts as evidence
- **Summarizing error messages**: Include them verbatim — details matter
- **Assuming external AI knows our project**: Every prompt must be self-contained
- **Mixing unrelated topics**: One research topic per prompt
- **No length guidance**: Always tell the AI how long/short you want the answer

---

## STEP 6: 응답 검토 가이드 (Post-Response Review)

After pasting the prompt into an external AI and getting a response, review:

- [ ] Did it answer all numbered questions?
- [ ] Did it suggest anything we already tried? (→ "Already Tried" was insufficient)
- [ ] Are recommendations within our constraints?
- [ ] Are claims backed by sources or clearly marked as inference?
- [ ] Is there a gap that needs a follow-up prompt?

**If follow-up needed:** Generate a shorter follow-up prompt that references the previous answer's gaps, not a full re-prompt. Include: "In your previous response you covered X. We still need clarity on Y."
