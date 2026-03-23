---
name: question-prompt-generator
description: >
  Explore tech landscape: generates prompts for external AI AND runs internal investigation in parallel.
  Use BEFORE implementation when the user knows WHAT to build but not HOW.
  Discovers technologies, trends, and option comparisons. First step in pipeline:
  question (broad) → research (deep) → result (synthesize).
  MUST trigger on: "뭐가 있어", "옵션 뭐가 있지", "어떻게 만들지", "방법이 뭐야", "기술 스택",
  "트렌드", "question", "탐색", "뭘 써야해", "세상에 뭐가 있어", "선택지", "landscape",
  "what options", "what's available", "tech stack options", or any request where the user has a goal
  but hasn't decided on an approach yet. NOT for deep-dive on a chosen tech (use research-prompt-generator).
  State routing: DEFAULT entry when no approach exists.
  If approach already chosen → /research. If artifact exists → /validation. If bug/error → /problem.
---

# Question Prompt Generator

Map the technology landscape before committing to an approach. Generates external AI prompts AND runs internal investigation in parallel.

**Announce at start:** "I'm using the /question skill to explore the tech landscape."

**Pipeline position:**

```
User: "이거 만들고 싶다" (goal, no approach)
         ↓
   /question  ← YOU ARE HERE
   1. Generate prompt for external AI (copy-paste)
   2. Run internal investigation (WebSearch + Agent)
   3. Save both: prompt file + internal findings
         ↓
   User pastes prompt → external AI responds
   Internal investigation results ready
         ↓
   /result — synthesize internal + external findings
         ↓
   Options chosen → approach decided
         ↓
   /research — deep-dive on specific chosen approach
```

---

## STEP 0: Goal Extraction

The user has a goal but not an approach. Extract:

| Category | Question | Example |
|----------|---------|---------|
| **What to build** | What's the end result? | "브라우저에서 서버로 실시간 오디오 전송" |
| **Why** | What problem does it solve? | "Mac 앞에 안 앉아도 STT 데이터 수집하고 싶다" |
| **Constraints** | Non-negotiable limits | Hardware, budget, language, existing stack |
| **Current stack** | What's already built | Python, websockets, Mac Mini M4 |
| **Experience level** | What the user already knows | "WebSocket은 써봤는데 WebRTC는 모른다" |
| **Timeline** | Deadline or urgency? | "2주 안에 완성" eliminates experimental tools |
| **Deployment target** | Local-only, cloud, hybrid? | Narrows option space dramatically |
| **Team size** | Solo developer or team? | Complex ops tools unsuitable for solo dev |

**If the user already knows their approach** (e.g., "AudioWorklet으로 만들건데"), redirect to `/research`.

---

## STEP 1: Context Gathering

Read project context:

| Source | What to Extract |
|--------|----------------|
| `CLAUDE.md` | Project overview, architecture summary |
| Relevant source files | Current implementation shape (brief) |
| Dependencies | Key versions (requirements.txt, package.json) |
| `docs/` | Prior research or decisions on related topics |

**Context rules:**
- Summarize architecture in 2-3 sentences
- Include exact versions only if they constrain options
- Don't dump implementation details — this is about WHAT to use, not HOW

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

## STEP 2: Dual Execution — Prompt + Internal Investigation

### 2A: Generate External AI Prompt

Create a self-contained prompt for external AI tools:

```markdown
# Technology Landscape Exploration: [Goal in one phrase]

> Act as a senior engineer who has built multiple production systems solving
> similar problems. You follow industry trends closely and have hands-on
> experience with both established and emerging solutions.

## What We Want to Build
[1-3 sentences: the end result, not the approach]

## Current Stack & Constraints
- Platform: [OS, hardware]
- Language: [primary language]
- Key dependencies: [only if they constrain choices]
- Budget: [free / $X/month / enterprise]
- Non-negotiable: [things that cannot change]

## What We Don't Know
We haven't decided on an approach yet. We need to understand what options exist.

## Questions

1. **What approaches exist for solving this?**
   List all major categories of solutions (not just the most popular).
   For each, name 1-2 representative tools/libraries.

2. **What's the current industry standard (as of [YEAR])?**
   What do most production systems use today? Why?

3. **What's emerging or trending?**
   New tools/approaches gaining traction. Include maturity level
   (experimental / early-adopter / production-ready).

4. **Comparison matrix**
   | Option | Category | Maturity | Complexity | Performance | Best For |
   |--------|----------|----------|------------|-------------|----------|

5. **What fits our constraints best?**
   Which 2-3 options should we investigate further? Why?

6. **What should we NOT use?**
   Options that look appealing but have known issues, are deprecated,
   or don't fit our constraints.

## Expected Output
- Under 2000 words
- Lead with the comparison matrix
- Separate facts from opinions
- Flag uncertainty explicitly
- Include links to official documentation

## Source Rules
- Prefer official documentation and release notes
- Separate established facts from emerging trends
- Note dates for recent status changes (deprecated, major update)

## Length Target
Keep total prompt under 2500 words. Summarize project context rather than
dumping full architecture details.
```

**Constraint-specific additions:**

- **Hardware-constrained:** Add Hardware Context section + "Hardware Compatibility" column
- **Migrating:** Add Current Approach section + "Migration Difficulty" column
- **Multi-platform:** Add Platform Requirements + "Platform Support" column

### 2B: Run Internal Investigation (in parallel)

While the user copies the prompt to external AI, dispatch role-based agents:

```
Agent 1 — SCOUT (broad discovery):
  subagent_type: "internet-researcher"
  run_in_background: true
  prompt: "Search for official documentation, comparison articles, and
           latest release notes for [topic]. Focus on:
           - '[topic] comparison [YEAR]'
           - '[topic] best practices production'
           - Official docs of top 3-5 known tools in this space
           Return: list of options with maturity level and official links."

Agent 2 — CRITIC (risks and failures):
  subagent_type: "internet-researcher"
  run_in_background: true
  prompt: "Search for failure cases, known issues, and complaints about
           [topic] solutions. Focus on:
           - '[tool name] issues site:github.com'
           - '[tool name] problems site:stackoverflow.com'
           - '[topic] deprecated alternatives'
           Return: anti-recommendations with evidence."

Agent 3 — CONTEXT (local constraints):
  subagent_type: "Explore"
  run_in_background: true
  prompt: "Scan the project workspace to check:
           - Existing dependencies that constrain options (requirements.txt, package.json)
           - Prior research in docs/reports/ on related topics
           - Current architecture patterns that new tools must fit
           Return: constraints summary + compatibility notes."
```

**Agent dispatch rules:**
- Agent 1 (SCOUT) and Agent 2 (CRITIC) always dispatched for technology topics
- Agent 3 (CONTEXT) skip if greenfield project with no existing codebase
- For non-technical landscape questions (process, methodology), skip CRITIC (GitHub issue search not informative)

**After all agents complete:**
- Summarize key findings from each role, prioritized by relevance
- Note contradictions (Scout found X, Critic found problems with X)
- If any agent returned empty: note the gap in findings (do NOT re-dispatch — proceed with available data)
- Save to `docs/reports/{topic}-question-internal-findings.md`

### Multi-AI Strategy Tip

Include with the prompt:

```markdown
## Recommended External AI Targets

| AI Tool | Strength | What to Ask |
|---------|----------|-------------|
| **Perplexity** | Real-time search, recent data | Trending tools, latest versions |
| **ChatGPT** | Broad knowledge, comparisons | Architecture patterns, trade-offs |
| **Gemini** | Google ecosystem, depth | Implementation specifics, benchmarks |
| **Claude** | Nuanced analysis, caveats | Risk assessment, edge cases |

Tip: Paste into 2-3 tools and cross-reference.
All mention it → solid. Only one mentions it → investigate further.
```

---

## STEP 3: File Output

**Always generate:**
- `docs/prompts/{category}/{topic}-question-prompt.md` — English prompt
- `docs/prompts/{category}/{topic}-question-prompt-ko.md` — Korean prompt (if user's primary language is Korean)
- `docs/reports/{topic}-question-internal-findings.md` — Internal investigation results

**Korean translation:** Generate Korean version (`-ko.md`) if the user's primary language is Korean. Korean rules:
- Technical terms: first occurrence "한국어(English)", then English only
- Code, file paths, commands, version numbers stay in English

Print the English prompt to console for immediate copy-paste.

---

## STEP 4: Quality Checklist

### Must-pass
- [ ] Goal stated as WHAT, not HOW (no pre-selected approach)
- [ ] Constraints include hardware/budget/stack specifics
- [ ] Comparison matrix with concrete columns requested
- [ ] Both "what to use" AND "what NOT to use" asked
- [ ] Current year included for trend relevance
- [ ] Output format and length specified
- [ ] Internal investigation agents dispatched
- [ ] No internal jargon in external prompt

### Should-pass
- [ ] Multi-AI strategy guide included
- [ ] Constraint-specific template additions applied
- [ ] Prior research/decisions referenced
- [ ] Internal findings saved to docs/reports/

---

## STEP 5: Handoff

After receiving external AI responses + internal findings:

1. User runs `/result` to synthesize all sources
2. OR manually cross-reference and select 2-3 options
3. Then use `/research` for deep-dive on chosen options

```
"Internal investigation done + external prompt ready.
 Paste into external AIs, then use /result to synthesize all findings.
 Or use /research to deep-dive on specific options."
```

**If user skips external AI step:** Internal investigation findings alone are sufficient to proceed. Route to /result with internal-only findings, or directly select 2-3 options for /research based on internal agent results. Mark external review as "skipped."

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `question` to **Completed**, update **Artifacts** with generated report/prompt files, set **Recommended Next** to `/result, /research`

---

## Anti-Patterns

- **Already decided**: "AudioWorklet으로 하려는데" → redirect to `/research`
- **Too broad**: "AI 앱 만들고 싶어" → ask clarifying questions first
- **Prompt-only**: Don't skip internal investigation — always run both
- **No constraints**: Constraints narrow 100 options to 5 — always include them
- **No year**: Trends change fast — always include current year
- **Skipping internal investigation**: Don't rely solely on external AI — always run internal agents too
- **Assuming recency**: Treat comparison articles older than 1 year with skepticism — verify current status
