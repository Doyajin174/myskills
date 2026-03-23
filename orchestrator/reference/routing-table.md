# Routing Table — Skill Entry Conditions, Exit Criteria, Allowed Transitions

## Pipeline Skills

| Skill | Skill Tool Name | Entry Condition | Exit Criteria | Allowed Next |
|-------|----------------|----------------|---------------|-------------|
| /brainstorming | `brainstorming` | 모호한 아이디어, 구체적 목표 없음. "~하면 좋겠다", "뭔가 만들고 싶다" | 구체적 목표 1개 이상 도출됨 | /question, /guide, /writing-plans |
| /question | `question-prompt-generator` | 목표는 있으나 접근법/기술 미정. "어떻게 만들지?", "뭘 써야해?" | 기술 옵션 2개+ 식별 + 내부조사 완료 | /result, /research |
| /research | `research-prompt-generator` | 특정 기술 1-2개 선택됨, 심층 조사 필요. "이 기술 자세히 알아봐" | 구현 세부사항 + 프롬프트 생성 완료 | /result, /spec, /question, /problem |
| /result | `result-synthesizer` | 내부 조사 결과 + 외부 AI 응답 존재. "종합해줘", "결과 정리" | 합성 리포트 생성, 접근법 결정됨 | /spec, /research (더 조사 필요 시), /guide (SIMPLE 시) |
| /spec | `spec-generator` | 접근법 결정됨, 구현 스펙 확정 필요. "만들 거 정리", "스펙" | 스펙 문서 생성 (`docs/specs/`) | /guide, /research (미결정 사항 多), /problem, /validation |
| /guide | `guide` | 구현 준비 완료 (스펙 또는 명확한 요청 존재) | 코드 구현 + 검증 완료 | /validation, /problem |
| /validation | `validation-prompt-generator` | 구현 완료, 품질 검증 필요. "리뷰해줘", "괜찮아?" | 품질 평가 리포트 생성 | /finishing-a-development-branch (ship), /problem (버그), /guide (재작업), /research (설계 결함) |
| /problem | `problem-prompt-generator` | 버그, 에러, 예상과 다른 동작. "안돼", "에러", "버그" | 원인 분석 + 수정 완료 | /validation (재검증), /research (설계 결함), /guide (수정 구현) |

## Direct Route Shortcuts

These bypass the normal pipeline when the situation is clear:

| Situation | Direct Route | Reason |
|-----------|-------------|--------|
| 단순 구현 (single file, obvious) | → /guide | 리서치/스펙 불필요 |
| 명확한 버그 + 에러 메시지 | → /problem | 탐색 불필요 |
| 사용자가 스킬 직접 지명 | → 해당 스킬 | 사용자 의도 존중 |
| "다음" / "계속" | → state file의 Next Candidates | 파이프라인 재개 |

## Classification Signals

### /brainstorming signals
- "~하면 좋겠다", "아이디어", "뭔가", "어떤 게 좋을까"
- No specific module, file, or feature mentioned
- Exploring possibilities, not executing

### /question signals
- "어떻게 만들지", "뭘 써야해", "옵션", "방법", "기술 스택"
- Has a goal but no chosen technology/approach
- Wants landscape exploration

### /research signals
- Specific technology named: "Stripe 조사", "WebSocket vs SSE 비교"
- "자세히", "심층", "깊이 파봐"
- Already has 1-2 candidates, needs depth

### /result signals
- "종합", "합쳐", "크로스체크", "외부 결과"
- Has gathered responses from external AI
- Needs synthesis of multiple sources

### /spec signals
- "스펙", "명세", "확정", "만들 거 정리"
- Research done, decisions need formalization
- "뭘 만들지 정리하자"

### /guide signals
- Clear, specific, actionable: "결제 API 만들어", "버튼 추가해", "이 컴포넌트 리팩토링"
- Technology and approach already decided
- "구현", "만들어", "해줘" + specific target

### /validation signals
- "리뷰", "검증", "괜찮아?", "잘 만들었어?", "프로덕션 수준?"
- Implementation already exists
- Wants quality assessment

### /problem signals
- "안돼", "에러", "버그", "깨졌", "크래시", "느려"
- Error messages or stack traces present
- Something was working and now isn't
