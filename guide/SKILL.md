---
name: guide
description: >
  Pipeline bootstrap compiler. Reads claude_guide/ reference documents and
  project CLAUDE.md, then generates skill-specific enriched prompt files for
  downstream skills. Called once per pipeline by orchestrator before any other skill.
  Outputs enriched prompt files to .claude/enriched/.
  State routing: orchestrator bootstrap gate triggers this automatically for multi-skill pipelines.
  If implementation needed → /implementer. If bug found → /problem.
allowed-tools: Read, Write, Glob
---

# Guide — Pipeline Prompt Compiler

**Announce at start:** "I'm using the /guide skill to compile enriched prompts for this pipeline."

파이프라인 시작 시 1회 호출. claude_guide/ 문서를 읽고 후속 스킬별 enriched prompt 파일을 생성.

**Pipeline position:**
```
orchestrator → /guide  ← YOU ARE HERE (1회 bootstrap)
                  ↓
                /question → /result → /research → /spec
                                                    ↓
                                                /implementer → /validation → /finishing
```

**Core philosophy:** Read once, enrich many. 각 스킬이 매번 claude_guide를 읽지 않도록 미리 준비.

---

## STEP 0: Parse Arguments

Extract from orchestrator args:
- `pipeline_plan`: 대상 스킬 목록 (예: `[question, research, spec, implementer, validation]`)
- `goal`: 파이프라인 목표 (예: "결제 시스템 구현")
- `project_root`: 프로젝트 루트 경로

IF args are missing or unclear:
  → Read pipeline-state.md에서 Goal과 Pipeline Plan 추출

---

## STEP 1: Read Sources

### 1.1 claude_guide 전체 읽기

`claude_guide/` 디렉토리의 **모든 문서(25개)를 전부 읽는다.** Guide는 전체 지식 베이스를 1회 로딩하여 각 스킬에 맞게 배분하는 유일한 스킬이다.

```
Read: claude_guide/*.md (전부)
```

읽은 내용을 스킬별로 관련성 분류하여 enriched prompt에 배분. Raw dump가 아닌 스킬 역할에 맞게 합성.

### 1.2 프로젝트 컨텍스트 읽기

1. 프로젝트 루트 `CLAUDE.md` 읽기
2. 핵심 정보 추출: tech stack, conventions, constraints, architecture

### 1.3 스킬별 기대 사항 확인

pipeline_plan의 각 스킬 SKILL.md에서:
- "Context Mode Detection" 섹션 확인 → 각 스킬이 enriched prompt에서 무엇을 기대하는지 파악
- 없으면: 스킬의 STEP 0 (Parse Input) 참조

---

## STEP 2: Generate Enriched Prompts

For each skill in pipeline_plan:

1. claude_guide에서 해당 스킬에 관련된 best practices 추출
2. 프로젝트 컨텍스트 + 스킬별 가이드라인 + 파이프라인 목표를 결합
3. `.claude/enriched/{skill_name}.md`로 저장

### Enriched Prompt 파일 형식

```markdown
# Enriched Context for /[skill_name]

## Pipeline Goal
[goal from orchestrator — 1줄]

## Project Context
[CLAUDE.md 핵심 요약: tech stack, conventions, constraints]

## Best Practices for This Skill
[claude_guide에서 추출한 관련 가이드라인 — 스킬 역할에 맞게 선별]

## Your Role in This Pipeline
[이 스킬이 파이프라인에서 담당하는 역할 + 전후 스킬과의 관계]
[예: "You are the 3rd step. /question already explored options. Your job is to deep-dive on the chosen approach."]
```

### 파일 출력 위치

`.claude/enriched/` 디렉토리에 저장:
```
.claude/enriched/question.md
.claude/enriched/research.md
.claude/enriched/spec.md
.claude/enriched/implementer.md
.claude/enriched/validation.md
```

디렉토리가 없으면 생성.

---

## STEP 3: Update State

pipeline-state.md 업데이트:

### YAML frontmatter
```yaml
bootstrap_completed: true
enriched_prompt_paths:
  question: .claude/enriched/question.md
  research: .claude/enriched/research.md
  # ... (생성된 파일만)
```

### Markdown body
- **Completed:** "guide" 추가
- **Recommended Next:** pipeline_plan의 첫 번째 스킬
- **Preserve:** `pending_target_skill` — orchestrator가 이미 설정함. 수정하지 않음

---

## STEP 4: Handoff

```
"Enriched prompts 생성 완료 ([N]개 스킬: [파일 목록]). /orchestrator를 다시 호출하면 다음 단계로 진행됩니다."
```

생성된 파일 목록을 간략히 출력.

---

## Quality Checklist

### Must-pass
- [ ] pipeline_plan의 모든 스킬에 대해 enriched prompt 파일 생성됨
- [ ] 각 파일에 Pipeline Goal, Project Context, Best Practices, Role 섹션 존재
- [ ] claude_guide 전체(25개) 읽기 완료
- [ ] pipeline-state.md에 bootstrap_completed와 경로 기록됨
- [ ] Handoff 메시지에 다음 스킬 명시됨

### Should-pass
- [ ] 스킬별 SKILL.md의 Context Mode Detection 요구사항 반영됨
- [ ] 프로젝트 CLAUDE.md의 conventions이 각 enriched prompt에 포함됨

---

## Anti-Patterns

- **claude_guide/ 읽기 건너뛰기** — 반드시 25개 전부 읽어야 함. Guide의 핵심 역할.
- **코드 작성, 디버깅, 구현** — /implementer의 역할. guide는 읽기 + 쓰기만.
- **복잡도 분류, 서브에이전트 디스패치** — /implementer의 역할.
- **enriched prompt 없이 handoff** — 목적 불달성. 최소 1개는 생성.
- **스킬별 차이 없는 generic prompt** — 각 스킬의 역할과 관련 가이드라인이 달라야 함.

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, set `bootstrap_completed: true`, update `updated:` to today
2. Markdown body: add `guide` to **Completed**, update **Artifacts** with enriched prompt paths, set **Recommended Next** based on pipeline_plan
