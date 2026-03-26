# CLAUDE.md

## Project

Claude Code 커스텀 스킬 모음. 16개 파이프라인 스킬 + 참조 문서(claude_guide).

## Structure

```
.claude/skills/    — 모든 스킬 (SKILL.md 기반)
claude_guide/      — 참조 문서 25개 (guide 스킬이 읽음, 스킬 아님)
```

## Entry Point

`/orchestrator` — 모든 요청의 시작점. 파이프라인 계획 수립 후 스킬 체인 실행.

## Pipeline

```
orchestrator → guide → question → result → research → spec → implementer → validation → finishing
```

## Key Rules

- `claude_guide/`는 프로젝트 루트에 위치해야 함 (.claude/skills/ 아님)
- `guide` 스킬은 파이프라인 초반에 1회만 호출하여 enriched prompt 일괄 생성
- `orchestrator`의 state.md로 파이프라인 상태 추적
