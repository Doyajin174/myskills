# Problem Investigation: /problem 스킬 런타임 원인 구조적 한계 (#11)

## Mismatch Summary
- **Expected:** /problem이 런타임 상태 버그(세션, DB, 캐시)도 정확히 진단
- **Actual:** 가설만 세우고 런타임 데이터로 검증하지 않은 채 코드 수정으로 직행
- **Type:** Logic bug (설계 누락) — STEP 4 → STEP 5 사이에 가설 검증 단계 부재

## Internal Investigation Results

### Trace Findings — 구조적 갭 5개

| # | 갭 | 위치 | 문제 |
|---|-----|------|------|
| 1 | **가설→수정 직행** | STEP 4 (L269) → STEP 5 (L302) | 가설 수립 후 검증 없이 바로 코드 수정. "가설이 맞는지" 확인하는 단계 부재 |
| 2 | **ENVIRONMENT-SUSPECT 미연결** | L109 vs STEP 2B | L109에서 "런타임 상태 가설을 먼저 검증"이라고 하지만, HOW가 없음. 태그만 있고 실행 메커니즘 없음 |
| 3 | **에이전트 런타임 불가** | Agent 1 (L199-213) | "Check session/auth artifacts"는 코드 grep이지 실제 DB 쿼리/세션 검사가 아님. Explore 에이전트는 파일만 읽을 수 있음 |
| 4 | **Level 1-6 고정 순서** | L187-194 | ENVIRONMENT-SUSPECT여도 Level 1(타입 분석)부터 시작. 런타임 버그에 정적 분석은 낭비 |
| 5 | **STEP 5.1은 사후 검증** | L319-327 | "수정이 됐는지" 확인하지 "가설이 맞았는지" 확인하지 않음 |

### Root Cause Hypotheses — 3가지 설계안

| # | 설계안 | Confidence | 추천 |
|---|--------|-----------|------|
| 1 | **STEP 4.5 삽입: Hypothesis Verification Gate** | **HIGH** | **추천** |
| 2 | ENVIRONMENT-SUSPECT 강화 (Level 1-4 스킵) | MEDIUM | 보완적 |
| 3 | Dual-track 병렬 에이전트 | LOW | 과잉 |

### 추천 설계: STEP 4.5 — Hypothesis Verification Gate

**왜 이것인가:**
- 순수 추가 (기존 코드 0줄 수정) → regression 위험 제로
- 모든 버그 유형 커버 (ENVIRONMENT-SUSPECT뿐 아니라 전체)
- AI가 런타임 데이터 직접 접근 불가 → 사용자에게 구체적 명령어 제시하는 구조
- 롤백 용이 (블록 1개 삭제)
- ai-only-debugging 철학과 충돌 없음

**삽입 위치:** STEP 4 (Assessment Report) 와 STEP 5 (Fix Application) 사이

**구성:**
1. 상위 가설의 검증 명령어 생성 (DB 쿼리, 세션 검사, 로그 명령, curl)
2. "맞으면 이 결과" vs "틀리면 이 결과" 예시
3. 사용자에게 실행 요청 → 결과 보고 대기
4. 확인됨 → STEP 5 진행 / 반증됨 → 다음 가설로 루프
5. **Fast-track bypass:** 가설 confidence가 HIGH이고 모든 evidence가 정적 분석 기반이면 게이트 스킵

**추가 와이어링:**
- ENVIRONMENT-SUSPECT 시 STEP 4.5 필수 (bypass 불가)
- Agent 2 프롬프트에 "실제 테스트 명령어 생성" 강화
- STEP 5에 가드: "ENVIRONMENT-SUSPECT이고 가설 미검증이면 STEP 4.5로 복귀"

## Recommended Fix

**구현 범위:** SKILL.md 단일 파일, ~45줄 추가 + 3곳 소규모 수정

| # | 수정 | 유형 |
|---|------|------|
| 1 | STEP 4.5 신설 (Hypothesis Verification Gate) | 추가 (~45줄) |
| 2 | Agent 2 프롬프트에 "구체적 검증 명령어 생성" 추가 | 확장 (~5줄) |
| 3 | STEP 5에 ENVIRONMENT-SUSPECT 가드 추가 | 확장 (~3줄) |
| 4 | ENVIRONMENT-SUSPECT 섹션에 "→ STEP 4.5 필수" 와이어링 | 확장 (~2줄) |

## Routing Decision

→ **Hand off to /implementer.** 진단 완료. /implementer가 STEP 4.5 + 와이어링을 SKILL.md에 추가합니다.
