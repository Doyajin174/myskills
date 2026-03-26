# 버그 조사: Validation 감사 에이전트(Audit Agent) 오탐률 50%

> 시니어 프롬프트 엔지니어로서 AI 에이전트 기반 코드 리뷰 시스템의 오탐(false positive) 문제를 진단하세요.
> LLM 기반 서브에이전트의 프롬프트 설계, 코드 감사 자동화, precision-recall 트레이드오프에 깊은 경험이 있습니다.
> 표면적 수정이 아닌 근본 원인 분석에 집중하세요.

## 시스템 컨텍스트
Claude Code 커스텀 스킬 파이프라인의 validation 스킬(`validation-prompt-generator`)이 코드 리뷰 시 3개의 내부 감사 에이전트(SECURITY, ARCHITECTURE, COMPLETENESS)를 병렬 디스패치합니다. 각 에이전트는 Explore 타입 서브에이전트로 실행됩니다.

## Expected vs Actual
- **Expected:** 감사 에이전트가 실제 이슈만 보고 (precision ≥ 80%)
- **Actual:** 보고 이슈의 ~50%가 false positive (프로젝트에 무관한 generic 비판, 증거 없는 주관적 판단, 이슈 없을 때 억지 보고)
- **Frequency:** 항상 (구조적 결함)

## 증거

### 오탐 유발 프롬프트 요소 (내부 조사 결과)

**1. 과잉 보고 강제:**
Anti-Patterns 섹션: `"Rubber stamp: 'Looks good' without evidence — always find at least one improvement"`
→ 코드에 진짜 이슈가 없어도 최소 1개 보고 의무 = 정의상 false positive

**2. 컨텍스트 없는 평가:**
Agent 2 폴백: `"evaluate against general architecture best practices for the tech stack"`
→ spec/report 없을 때 "일반 모범 사례"로 평가 → 프로젝트 현실과 무관한 generic 비판

**3. 증거 기준 부재:**
Agent 1만 `file:line` 요구. Agent 2는 `"Return: structural issues with improvement suggestions"`, Agent 3는 `"Return: completeness percentage + gap list"` → 구체적 코드 인용 없이 vague한 이슈 보고 가능

**4. 프로젝트 컨벤션 무시:**
3개 에이전트 프롬프트 어디에도 CLAUDE.md 읽기 지시 없음 → 프로젝트 규칙 모른 채 외부 기준 적용

## 최근 변경사항
해당 없음 — 초기 설계부터 존재하는 구조적 문제

## 이미 시도한 것
아직 수정 시도 없음. 이번이 첫 진단.

## 제약조건
- 3개 에이전트 체계(SECURITY, ARCHITECTURE, COMPLETENESS) 유지
- 진짜 이슈 탐지 능력(recall)을 훼손하면 안 됨
- SKILL.md 단일 파일만 수정

## 조사 질문
1. "always find at least one improvement" 지시를 제거하면서도 rubber stamp를 방지하는 대안은?
2. "general architecture best practices" 폴백을 프로젝트-aware하게 바꾸는 최선의 방법은?
3. 에이전트 결과에 evidence threshold(file:line + 코드 인용)를 강제하면 recall이 떨어질 위험은? 아키텍처 이슈처럼 단일 라인에 귀속시키기 어려운 이슈는 어떻게 처리?
4. 3개 에이전트에 severity 기준(CRITICAL/IMPORTANT/MINOR)을 주입할 때 가장 효과적인 형태는?
5. precision을 올리면서 recall을 유지하는 precision-recall 균형점은?

## 예상 출력
- 근본 원인 분석 + 증거
- false positive 유형별 수정 권장사항
- precision-recall 트레이드오프 분석
- 수정 후 검증 방법

## 길이 제한
2500단어 이내.
