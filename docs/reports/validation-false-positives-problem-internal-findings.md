# Problem Investigation: Validation 감사 에이전트 오탐률 50%

## Mismatch Summary
- **Expected:** 감사 에이전트가 실제 이슈만 보고 (precision ≥ 80%)
- **Actual:** 보고 이슈의 ~50%가 false positive
- **Type:** Logic bug — 프롬프트 설계 결함

## Internal Investigation Results

### Trace Findings

SKILL.md의 STEP 2B (Agent 1~3 프롬프트) + Anti-Patterns 섹션에서 9개 오탐 유발 요소 식별:

| # | 위치 | 문제 요소 | 오탐 메커니즘 |
|---|------|----------|-------------|
| 1 | Anti-Patterns L350 | `"always find at least one improvement"` | 과잉 보고 강제 — 이슈 없어도 1개 필수 |
| 2 | Agent 2 L187-189 | `"general architecture best practices"` 폴백 | 프로젝트 무관한 generic 비판 |
| 3 | Agent 2 L186 | `"Return: structural issues with improvement suggestions"` | evidence 형식 미지정 (file:line 없음) |
| 4 | Agent 3 L199 | `"Return: completeness percentage + gap list"` | evidence 형식 미지정 |
| 5 | Agent 1 L171 | `"Grep for common vulnerabilities (eval, innerHTML...)"` | 패턴매칭만으로 안전한 사용도 오탐 |
| 6 | Agent 3 L198 | `"Find all TODO/FIXME/HACK comments"` | 의도적 마커를 결함 취급 |
| 7 | Agent 2 L181 | `"coupling, cohesion, and maintainability"` | 기준 없는 주관적 평가 |
| 8 | After agents L212 | `"note the gap"` (빈 결과 시) | 출력 압박 — 빈 결과 = 문제 |
| 9 | Agent 1~3 전체 | CLAUDE.md 읽기 지시 없음 | 프로젝트 컨벤션 무시한 평가 |

### Root Cause Hypotheses

| # | Hypothesis | Evidence For | Evidence Against | Confidence |
|---|-----------|-------------|-----------------|------------|
| 1 | **Mandate to Over-Report** — "always find at least one improvement"이 이슈 없을 때도 보고 강제 | Anti-Patterns L350 명시적 지시. 코드가 깨끗해도 최소 1개 필수 = 정의상 false positive | L356-357에서 evidence 기반 평가 요구 (부분 상쇄) | **HIGH** |
| 2 | **Context-Free Evaluation** — spec/report 없을 때 "general best practices" 폴백이 프로젝트 무관 비판 유발 | Agent 2 L187-189, Agent 3 L200-202. 에이전트 프롬프트에 CLAUDE.md 읽기 지시 전무 | Agent 2가 docs/reports/ 참조 시도는 함 | **HIGH** |
| 3 | **No Evidence Threshold** — Agent 2/3이 file:line + 코드 인용 없이 vague한 이슈 보고 가능 | Agent 1만 file:line 요구 (L175). Agent 2/3은 형식 미지정. After-agents 단계에 필터링 없음 | Agent 1은 올바르게 설계됨 (참고 모델) | **MEDIUM** |

**상호작용 모델:**
```
H1 (반드시 찾아야 함) + H2 (프로젝트 맥락 없음) + H3 (증거 불필요)
= 에이전트가 vague + generic + quota-driven 결과 생산 = false positives
```

### Blast Radius
- 수정 대상: `.claude/skills/validation-prompt-generator/SKILL.md` 단일 파일
- 영향 범위: STEP 2B (Agent 프롬프트 3개), Anti-Patterns 섹션, After-agents 처리 로직
- 다른 스킬 영향: 없음 (validation 스킬 내부 변경)

## Recommended Fix

9개 수정 포인트:

### 1. Anti-Patterns: "always find" 제거 (H1 — 최고 우선)
```
BEFORE: "Rubber stamp": "Looks good" without evidence — always find at least one improvement
AFTER:  "Rubber stamp": 증거 없이 "Looks good" — 이슈 없으면 "No issues in [dimension]"과
        통과 근거를 명시. 빈 결과는 증거 기반이면 허용
```

### 2. Agent 2 폴백: generic → project-aware (H2)
```
BEFORE: evaluate against general architecture best practices for the tech stack
AFTER:  Read CLAUDE.md for project conventions. Flag only issues that violate
        stated patterns or cause runtime failures. Do not recommend patterns
        the project has not adopted.
```

### 3. Agent 2/3 return 형식: evidence 필수 (H3)
```
Agent 2: 각 이슈에 file:line + 코드 인용 + 구체적 영향(뭐가 깨지는지) 필수.
         file:line 없는 이슈는 폐기.
Agent 3: 각 gap에 spec 섹션 참조 + 구현 파일 필수.
         spec/task에서 근거 못 찾는 gap은 폐기.
```

### 4. Agent 1: exclusion 규칙 추가
```
추가: "Ignore: test files, documentation, safe wrappers, environment variable
       references. Only report if pattern is exploitable in context."
```

### 5. Agent 3: TODO 처리 변경
```
BEFORE: Find all TODO/FIXME/HACK comments
AFTER:  Note TODO/FIXME/HACK counts as informational context only —
        do NOT report as issues unless they indicate incomplete critical functionality.
```

### 6. Severity 기준 정의 추가
```
CRITICAL: 런타임 실패, 보안 취약점, 데이터 손실 위험
IMPORTANT: 성능 저하, 유지보수 어려움, spec 미준수
MINOR: 개선 가능하나 현재 동작에 영향 없음
```

### 7. Agent 프롬프트에 CLAUDE.md 읽기 추가
```
모든 에이전트: "Read CLAUDE.md first. Evaluate against project conventions,
               not generic standards."
```

### 8. After-agents 필터링 로직 추가
```
BEFORE: If any agent returned empty results: note the gap
AFTER:  If any agent returned empty results: this is valid if the agent confirmed
        no issues exist. Do not treat empty results as a gap.
        Filter: discard findings without file:line evidence.
```

### 9. Agent 2: "improvement suggestions" → "defects" 프레이밍
```
BEFORE: Return: structural issues with improvement suggestions
AFTER:  Return: structural defects with concrete impact.
        Improvements without defect evidence → omit.
```

## Routing Decision

근본 원인 명확. 단일 파일 수정이나 9개 포인트 = MEDIUM 범위.

→ **Hand off to /implementer.** "진단 완료. /implementer가 이 보고서 기반으로 SKILL.md를 수정합니다."
