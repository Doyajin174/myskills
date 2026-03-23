---
name: research-prompt-generator
description: >
  Generate structured research prompts for external AI tools (ChatGPT, Gemini, Perplexity, etc.).
  Auto-reads project context, classifies research type, applies type-specific template,
  and outputs a self-contained prompt with evidence pack. MUST trigger on: "리서치 프롬프트",
  "research prompt", "외부 AI", "기술 조사", "비교 분석", "타당성 조사", "feasibility",
  "technology comparison", "조사해줘", "리서치", or any request to generate a prompt for
  pasting into an external AI. NOT for bug investigation or fix prompts (use problem-prompt-generator).
  State routing: user has 1-2 candidate approaches needing deep-dive.
  If no approach yet → /question. If artifact exists → /validation. If bug/error → /problem.
---

# Research Prompt Compiler v2

Generate self-contained prompts for external AI tools that know NOTHING about our project.

**Announce at start:** "I'm using the /research skill to create a research prompt for external AI."

**Core philosophy:** The external AI has zero project context. The prompt must be completely self-contained, precise, and structured. Summarize architecture; include evidence verbatim.

**Pipeline position:** This skill is for deep-dive research on a SPECIFIC topic where the approach is already chosen. If the user hasn't decided on an approach yet, redirect to `/question` first.

```
User: "이거 만들고 싶다" (no approach)
         ↓
   /question
   "세상에 뭐가 있어? 트렌드는?"
         ↓
   Options identified, approach chosen
         ↓
   /research  ← YOU ARE HERE
   "이 기술로 구체적으로 어떻게 구현?"
         ↓
   Deep implementation details received
```

---

## Dual Execution Model

This skill does TWO things in parallel:
1. **Generate prompt** for external AI (user copy-pastes to ChatGPT/Gemini/Perplexity)
2. **Run internal investigation** using Agent tool with internet-researcher subagents

```
/research activated
    ├─ STEP 0-2: Generate external AI prompt → save to docs/prompts/
    └─ STEP 2.5: Dispatch internal research agents (parallel)
         ├─ Agent 1 — SCOUT: Official docs, production guides
         ├─ Agent 2 — CRITIC: Problems, limitations, edge cases
         ├─ Agent 3 — CONTEXT: Codebase fit, dependency compatibility
         └─ Agent 4 — IMPLEMENTATION: Code patterns [optional]
              ↓
         Save to docs/reports/{topic}-research-internal-findings.md
```

After both complete, user runs `/result` to synthesize internal + external findings.

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

**Scope check:** If the research topic is too broad ("research AI"), narrow with the user before proceeding. If too narrow (a single API call question), answer directly without generating a full research prompt.

---

## STEP 1.5: claude_guide Knowledge Loading

Read all documents in `claude_guide/` directory. Use the knowledge from these documents to enhance the quality of prompts generated in subsequent steps.

---

## STEP 1.6: 리서치 유형 분류 (Research Type Classification)

Classify the request into one of these types. Each uses a different template emphasis:

| Type | When | Template Focus |
|------|------|---------------|
| **Comparison** | "X vs Y", "which is better", "compare options" | Side-by-side evaluation table, criteria matrix |
| **Feasibility** | "can we do X?", "is it possible?", "will it work?" | Constraints analysis, risk assessment, proof-of-concept path |
| **Best Practice** | "how should we do X?", "what's the standard?", "recommendations" | Industry patterns, anti-patterns, implementation guidance |
| **Troubleshooting** | "why does X fail?", "how to fix?", "root cause" | Error evidence, reproduction steps, environment details |
| **Architecture** | "how to design X?", "what structure?", "trade-offs" | Requirements, constraints, rejected alternatives, decision criteria |
| **Tool Selection** | "what tool for X?", "buy vs build" | Requirements checklist, candidate list, evaluation matrix |

**Troubleshooting vs /problem:** If there is a specific error message or broken behavior NOW, use `/problem`. Use Troubleshooting research type only for understanding WHY a class of problems occurs or how to prevent them — not for fixing a current bug.

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

## Length Target
Keep total prompt under 3000 words. If evidence pack or code snippets exceed
this, include only the most relevant excerpts and summarize the rest.
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

**Best Practice** — add to "What We Want to Know":
```
What are the established patterns for [X] in production systems?
Include: common mistakes to avoid, recommended project structure, testing strategy.
```

**Architecture** — add to "What We Want to Know":
```
What are the trade-offs between [approach A] and [approach B]?
Include: scalability implications, maintenance burden, migration difficulty.
```

**Tool Selection** — add to "What We Want to Know":
```
Evaluate [candidates] against these requirements: [list].
Include: licensing, community size, release frequency, breaking change history.
```

---

## STEP 2.5: 자체 조사 실행 (Internal Investigation)

While the user copies the prompt to external AI, run internal deep-dive using agents:

```
Dispatch role-based agents, each focused on a specific question from
"What We Want to Know":

Agent 1 — SCOUT (technical depth):
  subagent_type: "internet-researcher"
  run_in_background: true
  prompt: "Deep-dive on [specific technology]. Search for:
           - Official documentation and API reference
           - Production deployment guides
           - '[tech] tutorial production [YEAR]'
           Include: exact API signatures, configuration examples, version requirements.
           Project context: [constraints from STEP 0]"

Agent 2 — CRITIC (edge cases and gotchas):
  subagent_type: "internet-researcher"
  run_in_background: true
  prompt: "Find problems, limitations, and edge cases for [specific technology]. Search for:
           - '[tech] known issues site:github.com'
           - '[tech] gotchas production'
           - '[tech] vs [alternative] benchmark'
           Include: breaking changes, performance bottlenecks, platform-specific bugs."

Agent 3 — CONTEXT (project fit):
  subagent_type: "Explore"
  run_in_background: true
  prompt: "Check how [specific technology] fits our codebase:
           - Read relevant source files for integration points
           - Check dependency compatibility
           - Compare with patterns already used in the project
           Return: integration plan + potential conflicts."

Agent 4 — IMPLEMENTATION (code patterns) [optional, for Architecture/Best Practice types]:
  subagent_type: "internet-researcher"
  run_in_background: true
  prompt: "Find production code examples for [specific technology] in [language]. Search for:
           - '[tech] [language] example production'
           - Open source projects using [tech]
           Return: 2-3 code patterns with pros/cons."
```

**Agent dispatch rules:**
- Each agent gets ONE focused role (not the entire research scope)
- Include project constraints in each agent's prompt
- Agent 4 is optional — only for Architecture/Best Practice research types
- Save combined results to `docs/reports/{topic}-research-internal-findings.md`

**After all agents complete:**
- Summarize key findings from each role
- Note contradictions (Scout says X works, Critic found issues with X)
- If any agent returned empty: note the gap in findings and proceed with available data
- Inform user: "Internal investigation complete. Use /result after external responses arrive."

---

## STEP 3: 한국어 번역 (Optional)

**Korean translation:** Generate Korean version (`-ko.md`) if the user's primary language is Korean. Korean rules:
- Technical terms: first occurrence "한국어(English)", then English only
- Code, file paths, commands, version numbers stay in English

---

## STEP 4: 파일 출력

**Always generate:**
- `docs/prompts/{category}/{topic}-research-prompt.md` — English (primary, for AI input)

**If Korean requested:**
- `docs/prompts/{category}/{topic}-research-prompt-ko.md` — Korean (for team documentation)

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

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `research` to **Completed**, update **Artifacts** with generated files, set **Recommended Next** to `/result, /spec, /question, /problem`

---## Anti-Patterns

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

---

## STEP 7: Handoff Routing (MANDATORY)

After research is complete (internal agents done + external responses reviewed):

```
If research answers are clear and approach is decided:
  → "Use /result to synthesize all findings, then /spec to lock decisions."

If research raises more questions than it answers:
  → "Use /research again with a DIFFERENT, more specific question."

If research reveals this is the wrong approach entirely:
  → "Use /question to re-explore the landscape with new constraints."

If a bug or error was discovered during research:
  → "Use /problem to investigate: [specific issue]"
```

**If user skips external AI step:** Internal agent findings alone are sufficient. Proceed to /result with internal-only data. Mark external review as "skipped."

This routing is not optional. Every /research invocation MUST end with an explicit next step.
