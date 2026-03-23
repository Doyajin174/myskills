---
name: guide
description: >
  Batch prompt compiler — reads entire claude_guide knowledge base and generates
  enriched prompts for ALL skills in a pipeline plan at once. Called once at pipeline
  start by orchestrator. Does NOT implement, execute code, or dispatch subagents.
  MUST trigger on: orchestrator delegation for prompt enrichment at pipeline start.
allowed-tools: Read, Glob, Grep, Write
---

# Guide — Batch Prompt Compiler

**Announce at start:** "I'm using the /guide skill to compile enriched prompts for the pipeline."

Read the entire claude_guide knowledge base once, then generate tailored enriched prompts for every skill in the pipeline plan. Called **once** at pipeline start — not per-skill.

**Pipeline position:**
```
orchestrator: "결제 시스템 구현해줘"
    ↓ plans: [question, result, research, result, spec, implementer]
    ↓
/guide ← YOU ARE HERE (1회만 호출)
    1. Parse pipeline plan
    2. Read ALL claude_guide/ docs (25개)
    3. Read project context
    4. Classify complexity
    5. Generate enriched prompt per skill
    6. Save all to docs/prompts/cache/
    ↓
orchestrator → question(enriched) → result → research(enriched) → ...
    (guide 재호출 없이 파이프라인 완주)
```

---

## STEP 0: Parse Pipeline Plan

Extract from orchestrator's args:
- **Pipeline plan:** ordered list of skills to be used (e.g., `[question, result, research, spec, implementer]`)
- **Original request:** user's raw request
- **Goal:** what the user wants to achieve (1 sentence)

If pipeline plan is missing, ask orchestrator to provide it.

---

## STEP 1: Read Knowledge Base

Read **ALL** claude_guide/ documents (25개). This is the only skill that reads the full knowledge base.

```
Read: claude_guide/*.md (all 25 documents)
```

Extract and synthesize:
- Claude Code best practices relevant to the project
- Skill authoring conventions
- Workflow patterns
- Tool usage guidelines
- Code quality standards

**Do NOT dump raw content.** Synthesize into actionable knowledge organized by relevance to different skill types.

---

## STEP 2: Read Project Context

Gather project-specific context:

| Source | What to Extract |
|--------|----------------|
| `CLAUDE.md` | Project rules, architecture, constraints |
| `package.json` | Tech stack, dependencies, versions |
| Relevant source files | Current implementation shape (brief) |
| `docs/specs/` | Active specifications |
| `docs/reports/` | Prior research/synthesis reports |

**Summarize** project context in 5-10 sentences. Do not include full file contents.

---

## STEP 3: Classify Complexity

Assess the overall task complexity using risk-driven classification:

| Level | Criteria |
|-------|----------|
| **TRIVIAL** | 1 file, <20 LOC, no deps/DB/arch changes |
| **SIMPLE** | Single module, multiple functions |
| **MEDIUM** | Crosses module boundaries |
| **COMPLEX** | Multiple interfaces/contracts affected |

Include complexity in every enriched prompt so downstream skills can adjust their behavior.

---

## STEP 4: Generate Enriched Prompts

For **each skill** in the pipeline plan, generate a tailored enriched prompt:

### Per-skill enriched prompt structure:

```markdown
---
target_skill: [skill name]
pipeline_id: [goal-slug-date]
task_hash: [sha256(original_request + target_skill)]
complexity: [TRIVIAL/SIMPLE/MEDIUM/COMPLEX]
created: [YYYY-MM-DD]
pipeline_plan: [full ordered list]
current_position: [N of M]
---

## Original Request
[User's request — enriched and clarified]

## Project Context
[Summarized project info relevant to THIS skill's role]

## Relevant Knowledge
[claude_guide knowledge specifically useful for this skill]
- [Best practice 1 relevant to this skill's task]
- [Convention 2 relevant to this skill's task]
- [Pattern 3 relevant to this skill's task]

## Task for This Skill
[What this specific skill should focus on, given the overall pipeline context]

## Complexity & Constraints
- Overall complexity: [level]
- This skill's scope: [what it handles vs what other skills handle]
- Constraints: [from CLAUDE.md and project rules]

## Prior Context (if any)
[References to previous pipeline artifacts — specs, reports, scan results]
```

### Knowledge distribution rules:

| Skill Type | Knowledge Focus |
|------------|----------------|
| question, research | 기술 탐색 패턴, 비교 분석 방법, 트렌드 조사 |
| spec | 스펙 작성 규칙, 수용기준 설계, 의사결정 구조 |
| implementer | 코드 품질, 빌드 체크, git 워크플로우, 테스트 패턴 |
| validation | 리뷰 기준, 보안 체크, 아키텍처 평가 |
| problem | 디버깅 패턴, 정적 분석, 근본 원인 추적 |
| scanner | 레퍼런스 탐색, AST 도구, 의존성 분석 |
| migration | 빌드 체크 루프, leaf-first 순서, 체크포인트 |
| result | 크로스 검증, 합의 도출, 신뢰도 평가 |

**Not every skill needs all 25 docs' knowledge.** Distribute only what's relevant.

---

## STEP 5: Save Enriched Prompts

Save each enriched prompt to:
```
docs/prompts/cache/enriched-for-{skill_name}.md
```

Example for a pipeline `[question, research, spec, implementer]`:
```
docs/prompts/cache/enriched-for-question.md
docs/prompts/cache/enriched-for-research.md
docs/prompts/cache/enriched-for-spec.md
docs/prompts/cache/enriched-for-implementer.md
```

---

## STEP 6: Update Pipeline State

Update `.claude/pipeline-state.md`:

```yaml
enriched_prompts:
  question: docs/prompts/cache/enriched-for-question.md
  research: docs/prompts/cache/enriched-for-research.md
  spec: docs/prompts/cache/enriched-for-spec.md
  implementer: docs/prompts/cache/enriched-for-implementer.md
```

Report to user:
```
Enriched prompts generated for [N] skills:
- question: [1-line summary of focus]
- research: [1-line summary of focus]
- spec: [1-line summary of focus]
- implementer: [1-line summary of focus]

Complexity: [level]
Orchestrator will proceed with the pipeline.
```

---

## Quality Checklist

### Must-pass
- [ ] ALL 25 claude_guide docs read
- [ ] Project context gathered (CLAUDE.md + deps)
- [ ] Complexity classified
- [ ] Enriched prompt generated for EACH skill in pipeline plan
- [ ] Each enriched prompt has YAML frontmatter (target_skill, pipeline_id, task_hash)
- [ ] Each enriched prompt has relevant (not all) claude_guide knowledge
- [ ] Files saved to docs/prompts/cache/
- [ ] Pipeline state updated with enriched_prompts map

### Should-pass
- [ ] Knowledge distribution matches skill type table
- [ ] Prior artifacts referenced (specs, reports) if they exist
- [ ] Complexity rationale included in each enriched prompt

---

## Anti-Patterns

- **Writing code**: guide generates prompts, not code. If you're about to use Edit or Bash → STOP.
- **Dispatching agents**: guide does NOT use Agent tool. That's implementer's job.
- **Selective reading**: Read ALL 25 docs. Don't skip based on title — relevance is determined after reading.
- **Dumping raw docs**: Synthesize, don't copy-paste. Each enriched prompt should contain distilled knowledge.
- **One-size-fits-all**: Each skill gets a DIFFERENT enriched prompt. Don't generate identical content for all.
- **Ignoring pipeline position**: Each enriched prompt should note where the skill sits in the pipeline and what comes before/after.
- **Forgetting degraded mode exists**: Other skills can run without enriched prompts. Guide is an enhancer, not a gatekeeper.

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Add `enriched_prompts:` map to frontmatter
3. Markdown body: add `guide` to **Completed**, update **Artifacts** with cache file paths, set **Recommended Next** to first skill in pipeline plan
