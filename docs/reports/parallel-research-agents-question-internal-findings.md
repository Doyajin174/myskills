# Question Investigation: 인터넷 리서치 에이전트 병렬 실행 (#10)

## 핵심 발견

### 1. `internet-researcher`는 존재하지 않는 서브에이전트 타입
- Claude Code 내장 타입: `general-purpose`, `Explore`, `Plan`
- `internet-researcher`를 사용하면 인식 불가 → general-purpose로 폴백
- 현재 /research, /question 스킬의 SCOUT/CRITIC 에이전트가 이 미정의 타입 사용 중 (5곳)

### 2. 서브에이전트의 WebSearch/WebFetch 접근
- 서브에이전트는 기본적으로 메인 대화의 모든 도구를 상속 (WebSearch/WebFetch 포함)
- 단, 서브에이전트는 Claude Code 시스템 프롬프트를 받지 않으므로, **프롬프트에 명시적으로 WebSearch 사용 지시 필요**
- 플러그인 에이전트에서는 WebSearch 접근에 알려진 버그 존재

### 3. MCP 검색 서버 비교
| 서버 | 강점 | 무료 티어 | 적합 용도 |
|------|------|----------|----------|
| Brave Search | 독립 인덱스, 프라이버시 | 2,000 쿼리/월 | 일반 검색 |
| Tavily | AI 최적화, 자동 추출 | 1,000 쿼리/월 | 기술 문서 |
| Exa | 시맨틱/코드 검색 | 오픈소스 | 코드, 학술 |
| Perplexity Sonar | LLM 합성 답변 | $1/M 토큰 | 복잡한 질문 |

### 4. 내장 WebSearch vs MCP 차이
- WebSearch: 제목+URL만 반환 → WebFetch로 내용 추가 확인 필요
- WebFetch: Haiku로 요약된 내용 반환 (원본 아님)
- MCP 서버: 풍부한 결과, 전체 내용, 시맨틱 검색 가능

## 접근법 옵션

### Option A: subagent_type 수정 (최소 변경)
- `internet-researcher` → `general-purpose`로 변경
- 에이전트 프롬프트에 "Use WebSearch to find..." 명시 추가
- **장점:** 변경 최소, 즉시 적용 가능
- **단점:** 내장 WebSearch의 제한적 결과 품질

### Option B: 커스텀 에이전트 정의 (중간)
- `.claude/agents/internet-researcher.md` 파일 생성
- frontmatter에 `tools: WebSearch, WebFetch, Read` 명시
- 전용 시스템 프롬프트로 웹 검색 전문화
- **장점:** 재사용 가능, 도구 접근 명확, 이름 유지
- **단점:** 새 파일 추가 필요

### Option C: MCP 서버 통합 (최대 효과)
- Brave Search 또는 Tavily MCP 서버 설정
- 에이전트 frontmatter에 `mcpServers` 스코핑
- **장점:** 최고 품질 검색 결과
- **단점:** API 키 필요, 외부 의존성 추가, 설정 복잡

## 추천

**Option B를 추천합니다.** 이유:
1. Option A는 너무 약함 — general-purpose에 WebSearch 지시만으로는 검색 품질 불확실
2. Option C는 외부 의존성이 생김 — API 키 관리, 비용, 설정 복잡도
3. Option B는 Claude Code의 커스텀 에이전트 시스템을 정확히 활용하면서 도구 접근을 명시적으로 보장

## 다음 단계
- `/research`로 Option B의 구체적 구현 방법 deep-dive
- 또는 사용자가 Option 선택 후 `/spec`으로 직행
