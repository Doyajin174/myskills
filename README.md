# myskills

Custom skills for Claude Code — reusable across projects.

## Installation

### Skills → `.claude/skills/`

Copy each skill directory into your project:

```bash
cp -r <skill-name> /path/to/project/.claude/skills/
```

### Reference docs → project root

`claude_guide/` is **NOT a skill**. It's a reference document collection used by the `guide` skill for prompt enrichment. Copy it to the **project root**, not into `.claude/skills/`:

```bash
cp -r claude_guide /path/to/project/
```

## Architecture

```
orchestrator (총괄 라우터)
    ↓ 파이프라인 계획 수립
guide (프롬프트 컴파일러)
    ↓ claude_guide 25개 문서 읽기 → 스킬별 enriched prompt 일괄 생성
    ↓
question → result → research → result → spec
    ↓
implementer (코드 실행)  |  scanner (레퍼런스 탐색)  |  code-migration (시스템 교체)
    ↓
validation → finishing
```

## Pipeline Skills (17)

### Core Pipeline

| Skill | Description |
|-------|-------------|
| **orchestrator** | 총괄 라우터 — 요청 분류, 파이프라인 계획, state.md 관리 |
| **guide** | 일괄 프롬프트 컴파일러 — claude_guide 읽고 스킬별 enriched prompt 생성 (1회만 호출) |
| **implementer** | 코드 실행 엔진 — enriched prompt 받아서 서브에이전트 디스패치, Build-Check Loop |

### Investigation & Research

| Skill | Description |
|-------|-------------|
| **question-prompt-generator** | 기술 탐색 — 외부 AI 프롬프트 + 내부 조사 병렬 실행 |
| **research-prompt-generator** | 심층 조사 — 특정 기술 deep-dive 프롬프트 생성 |
| **result-synthesizer** | 결과 종합 — 내부 + 외부 소스 크로스 검증 |

### Planning & Specification

| Skill | Description |
|-------|-------------|
| **spec-generator** | 구현 명세 — 리서치 결론을 구체적 스펙으로 확정 |
| **brainstorming** | 아이디어 발전 — 소크라틱 질문으로 아이디어 정제 |
| **writing-plans** | 구현 계획 — 엔지니어용 상세 태스크 생성 |

### Quality & Debugging

| Skill | Description |
|-------|-------------|
| **validation-prompt-generator** | 구현 검증 — 외부 AI 리뷰 프롬프트 + 내부 감사 |
| **problem-prompt-generator** | 버그 조사 — 기대값 vs 실제값 불일치 진단 |
| **ai-only-debugging** | AI 전용 디버깅 — 정적 분석 우선, 런타임 에스컬레이션 |

### Code Analysis & Migration

| Skill | Description |
|-------|-------------|
| **exhaustive-code-scanner** | 전수 스캔 — 4-layer 파이프라인(rg→ast-grep→tsc→knip)으로 레퍼런스 탐색 |
| **code-migration** | 시스템 교체 — Build-Check Loop + Leaf-First + git 체크포인트 |

### Design & Completion

| Skill | Description |
|-------|-------------|
| **design-system** | UI 디자인 시스템 — 토큰 → 프리미티브 → 컴포넌트 → 패턴 → 페이지 |
| **finishing-a-development-branch** | 브랜치 완료 — 머지/PR/정리 옵션 제시 |

## Reference

| Directory | Install to | Description |
|-----------|-----------|-------------|
| **claude_guide/** | **Project root** (`./claude_guide/`) | Claude Code best practices (25 docs + INDEX.md). guide 스킬이 전부 읽고 배분. 개별 스킬은 degraded mode에서 INDEX.md만 참조. |

## Pipeline Flow Example

```
사용자: "결제 시스템 구현해줘"

1. /orchestrator → 파이프라인 계획: [guide, question, result, research, spec, implementer]
2. /guide → claude_guide 25개 읽기 → enriched prompt 6개 일괄 생성
3. /question → enriched prompt으로 기술 탐색
4. /result → 내부+외부 결과 종합
5. /research → 선택된 기술 심층 조사
6. /spec → 구현 명세 확정
7. /implementer → enriched prompt + spec 기반 코드 구현
8. /validation → 품질 검증
9. /finishing → PR/머지
```
