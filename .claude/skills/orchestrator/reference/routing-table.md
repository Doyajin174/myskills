# Routing Table — Skill Entry Conditions, Exit Criteria, Allowed Transitions

## Pipeline Skills

| Skill | Skill Tool Name | Entry Condition | Exit Criteria | Allowed Next |
|-------|----------------|----------------|---------------|-------------|
| /brainstorming | `brainstorming` | 모호한 아이디어, 구체적 목표 없음. "~하면 좋겠다", "뭔가 만들고 싶다" | 구체적 목표 1개 이상 도출됨 | /question, /guide, /writing-plans |
| /question | `question-prompt-generator` | 목표는 있으나 접근법/기술 미정. "어떻게 만들지?", "뭘 써야해?" | 기술 옵션 2개+ 식별 + 내부조사 완료 | /result, /research |
| /research | `research-prompt-generator` | 특정 기술 1-2개 선택됨, 심층 조사 필요. "이 기술 자세히 알아봐" | 구현 세부사항 + 프롬프트 생성 완료 | /result, /spec, /question, /problem |
| /result | `result-synthesizer` | 내부 조사 결과 + 외부 AI 응답 존재. "종합해줘", "결과 정리" | 합성 리포트 생성, 접근법 결정됨 | /spec, /research (더 조사 필요 시), /guide (SIMPLE 시) |
| /spec | `spec-generator` | 접근법 결정됨, 구현 스펙 확정 필요. "만들 거 정리", "스펙" | 스펙 문서 생성 (`docs/specs/`) | /guide, /research (미결정 사항 多), /problem, /validation |
| /guide | `guide` | 새 파이프라인 시작 시 자동 호출 (bootstrap gate). claude_guide 읽기 → enriched prompt 파일 일괄 생성 | enriched prompt 파일 생성 + state 업데이트 완료 | (orchestrator가 pending_target_skill로 라우팅) |
| /implementer | `implementer` | enriched prompt 존재 + 구현 준비 완료. 코드 작성, 수정, 빌드 체크 필요. "구현해줘", "만들어줘" | 코드 구현 + 검증 완료 | /validation, /problem |
| /validation | `validation-prompt-generator` | 구현 완료, 품질 검증 필요. "리뷰해줘", "괜찮아?" | 품질 평가 리포트 생성 | /finishing (ship), /problem (버그), /guide (재작업), /research (설계 결함) |
| /problem | `problem-prompt-generator` | 버그, 에러, 예상과 다른 동작. "안돼", "에러", "버그" | 원인 분석 + 수정 완료 | /validation (재검증), /research (설계 결함), /guide (수정 구현) |
| /writing-plans | `writing-plans` | 설계 완료, 엔지니어용 상세 구현 계획 필요. "구현 계획 짜줘", "플랜 만들어" | 구현 계획 문서 생성 | /guide |
| /finishing | `finishing-a-development-branch` | 구현 완료 + 테스트 통과. "머지", "PR 만들어", "정리" | 브랜치 정리/머지/PR 완료 | (pipeline 종료) |
| /scanner | `exhaustive-code-scanner` | 특정 시스템/심볼의 모든 레퍼런스 탐색 필요. "스캔", "다 찾아", "어디서 쓰이나", "임팩트" | scan-report.md 생성 (레퍼런스 맵 + 의존성 그래프 + 신뢰도) | /code-migration, /guide |
| /code-migration | `code-migration` | scan-report 존재 + 시스템 A→B 교체 실행. "마이그레이션", "교체", "갈아끼우기" | 마이그레이션 완료 + migration-report.md | /validation, /problem |
| /db-safety-setup | `db-safety-setup` | DB migration 안전 체계 구축 필요. "DB 세팅", "마이그레이션 세팅", "DB 안전", "prisma migrate 전환" | shadow DB + CI 체크 + 배포 파이프라인 구축 완료 | /validation |

## Direct Route Shortcuts

These bypass the normal pipeline when the situation is clear:

| Situation | Direct Route | Reason |
|-----------|-------------|--------|
| TRIVIAL 구현 (1 file, <20 LOC, no deps/DB/arch) | → /implementer | Bootstrap 불필요, 직접 실행 |
| 명확한 버그 + 에러 메시지 | → /problem | 탐색 불필요 |
| 사용자가 스킬 직접 지명 | → 해당 스킬 | 사용자 의도 존중 |
| "다음" / "계속" | → state file의 Recommended Next | 파이프라인 재개 |

## Classification Signals

### /brainstorming signals
- **핵심 구분: 목표 자체가 불명확 — 뭘 만들지 모름**
- "~하면 좋겠다", "아이디어", "뭔가", "어떤 게 좋을까"
- No specific module, file, or feature mentioned
- Exploring possibilities, not executing
- 예: "앱 성능을 올려야 하는데 뭘 먼저 할까?", "내 앱이 뭔가 부족한데 뭔지 모르겠다"

### /question signals
- **핵심 구분: 목표는 명확, 접근법만 불명확 — 뭘 만들지는 알지만 어떻게를 모름**
- "어떻게 만들지", "뭘 써야해", "옵션", "방법", "기술 스택"
- Has a goal but no chosen technology/approach
- Wants landscape exploration
- 예: "실시간 알림 기능 만들려는데 뭘 써야 해?", "로그인은 어떻게 구현하지?"

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

### /implementer signals
- **핵심 구분: 구현 준비 완료 — 뭘 어떻게 만들지 다 정해졌고 코드만 짜면 됨**
- Clear, specific, actionable: "결제 API 만들어", "버튼 추가해", "이 컴포넌트 리팩토링"
- Technology and approach already decided
- "구현", "만들어", "해줘" + specific target

(/guide는 사용자가 직접 호출하지 않음 — orchestrator bootstrap gate에 의해 자동 호출)

### /validation signals
- "리뷰", "검증", "괜찮아?", "잘 만들었어?", "프로덕션 수준?"
- Implementation already exists
- Wants quality assessment

### /problem signals
- "안돼", "에러", "버그", "깨졌", "크래시", "느려"
- Error messages or stack traces present
- Something was working and now isn't

### /design-system vs /implementer (UI 작업 분류)

**판단 기준:** "시스템의 어휘를 바꾸는가 vs 기존 어휘로 문장을 쓰는가"

/design-system으로 가는 경우:
- 토큰 값 추가/변경/삭제 (예: 새 색상 `--warning-bg` 추가)
- 컴포넌트 구조/API/variant 변경 (예: 버튼에 compact variant 추가)
- 새 재사용 패턴 생성 (예: 모달-to-인라인 전환 패턴을 공통화)
- 2개+ 화면에 영향 또는 재사용 예정
- 토큰 정의 파일(:root, variables.css) 직접 수정

/implementer로 가는 경우 (토큰 가드레일 적용):
- 기존 컴포넌트 재배치/재조합
- 기존 토큰으로 색상/스페이싱 변경 (예: --bg-1 → --bg-2)
- 레이아웃 전환 (팝업→인라인, 그리드→리스트)
- 1개 화면 한정 일회성 수정
- 버튼 위치 이동, 정렬 변경 등 로컬 조정

---

## Out of Scope (라우팅 금지)

이 요청들은 어떤 스킬에도 라우팅하지 않는다. Rule 8, 9에 따라 처리:

| Category | Signal | Action |
|----------|--------|--------|
| **메타/자기참조** | "이 프롬프트를", "orchestrator를", "라우팅 정책" | 거부: "라우팅 범위 밖입니다. /validation을 직접 호출해주세요." |
| **비개발 요청** | "날씨", "번역", 일반 대화 | 거부: "개발 워크플로우 전용입니다." |
| **목적 없는 탐색** | "코드 읽어봐", "설명해줘" (구체적 목적 없이) | 재질문: "어떤 목적으로 봐야 할까요?" → 해당 스킬로 |
