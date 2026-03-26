# 버그 조사: LLM 프롬프트 로직 — Orchestrator의 Bootstrap Gate가 스킵되는 문제

> 멀티스텝 LLM 스킬 시스템의 로직 버그를 디버깅하는 시니어 프롬프트 엔지니어로 행동하세요.
> LLM 지시문 설계, 자연어 프롬프트의 제어 흐름, Claude의 instruction-following 행동에 깊은 경험이 있습니다.
> bootstrap gate를 LLM이 왜 따르지 않는지 근본 원인 분석에 집중하세요.

## 시스템 컨텍스트
Claude Code 커스텀 스킬 시스템. 16개 파이프라인 스킬을 `/orchestrator` 스킬이 조율. orchestrator는 SKILL.md(마크다운 프롬프트)로 Claude에게 사용자 요청을 분류하고 전문 스킬로 라우팅하도록 지시. `/guide` 스킬은 "enriched prompt"(프로젝트 컨텍스트 + 모범 사례)를 컴파일하여 하위 스킬의 품질을 높임.

## 기대 동작 vs 실제 동작
- **기대:** non-trivial 요청 시, orchestrator가 /guide를 먼저 호출(bootstrap). guide가 enriched prompt 생성. 다음 턴에 orchestrator가 분류된 target skill을 enriched context와 함께 호출.
- **실제:** orchestrator가 /guide를 건너뛰고 분류된 target skill을 직접 호출. `bootstrap_completed`는 false 유지, `enriched_prompt_paths`는 항상 비어있음.
- **빈도:** 항상 — bootstrap이 프로덕션에서 작동한 적 없음.

## 증거

### 모순 1: 비선형 흐름
STEP 1.5(Bootstrap Gate)가 "STEP 2로 분류 먼저 실행"이라고 지시. STEP 2 완료 후 LLM이 STEP 1.5 94-103줄로 돌아와야 하는데, "여기로 돌아오세요" 명시가 없음. LLM은 선형으로 진행: STEP 2 -> STEP 3 -> STEP 4.

### 모순 2: 보고 템플릿
STEP 3 템플릿: "다음 스킬: /[skill-name]" — LLM이 분류된 스킬명으로 채움. "다음 스킬: /code-migration" 보고 후 자연스럽게 STEP 4에서 /code-migration 호출, /guide 아님.

### 모순 3: Rule 7 (3-action 제약)
Critical Rule 7: "정확히 3개 액션: (1) state 읽기 (2) 분류+보고+확인 (3) state 쓰기+호출. 이 3개 외에는 위반." Bootstrap은 action (3)을 /guide로 redirect해야 하는데 Rule 7에서 인정하지 않음.

### 모순 4: TRIVIAL 3중 불일치
- routing-table.md: TRIVIAL -> /guide
- SKILL.md STEP 1.5: TRIVIAL -> /implementer (bootstrap 생략)
- SKILL.md STEP 3 L197: "/implementer" 보고하면서 "/guide" 호출

### 모순 5: 미정의 경로
단일 스킬 비TRIVIAL(예: "PR 리뷰해줘" -> /validation만)이 명시적 처리 없음. TRIVIAL과 multi-skill 경로만 정의되어 있고, single-non-trivial은 fall-through.

## 최근 변경사항
Bootstrap Gate(STEP 1.5)가 이미 작동 중인 orchestrator에 추가됨. 원래 설계에는 bootstrap 없이 분류+라우팅만 존재. STEPs 2-4를 재구조화하지 않고 bootstrap을 위에 레이어링.

## 이미 시도한 것
- "확실하지 않으면 bootstrap 포함" 안전 fallback 추가 — LLM이 여전히 스킵
- reference 문서에 상세한 pending_target_skill 상태표 추가 — LLM이 실행 시 참조 안 함

## 제약
- Orchestrator는 순수 라우터: Read, Write, Glob, Skill 도구만 사용
- 단일 SKILL.md 파일이어야 함 (실행 가능 코드 없음)
- 2-turn bootstrap 패턴(턴1: /guide, 턴2: target skill)은 의도된 설계
- Enriched prompt는 가치 있음 — bootstrap 제거는 옵션이 아님

## 내부 조사 결과
복합적 3가지 근본 원인 발견:
1. Recency bias: STEP 3/4 지시가 STEP 1.5를 override (HIGH 확신)
2. 비선형 흐름: 1.5->2->다시 1.5 패턴을 따르지 않음 (MEDIUM-HIGH)
3. Rule 7 구조적 배제: 3-action 모델에 bootstrap 공간 없음 (MEDIUM)

## 조사 질문
1. LLM이 "X로 분류하되 Y를 호출"을 자연어 프롬프트에서 안정적으로 수행하게 하는 알려진 패턴이 있는가?
2. Bootstrap 결정을 분류 후(STEP 2.5)로 이동하여 선형 흐름을 만들어야 하는가?
3. Rule 7을 2-turn bootstrap에 맞게 어떻게 수정해야 "단순 라우터" 제약을 약화시키지 않는가?
4. TRIVIAL 라우팅 불일치: /guide와 /implementer 중 어디로 가야 하는가?
5. 단일 스킬 비TRIVIAL 요청도 bootstrap을 받아야 하는가, 선택적인가?

## 기대 출력
- 3가지 가설이 맞는지 평가
- Bootstrap을 안정적으로 만드는 프롬프트 구조 제안
- STEP 1.5, Rule 7, STEP 3, STEP 4에 대한 구체적 재작성 제안
- TRIVIAL 라우팅에 대한 설계 결정
