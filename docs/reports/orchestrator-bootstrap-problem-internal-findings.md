# Problem Investigation: Orchestrator Bootstrap Gate Skips /guide

## Mismatch Summary
- **Expected:** orchestrator -> /guide (enriched prompt 생성) -> target skill
- **Actual:** orchestrator -> target skill 직접 호출 (guide 스킵)
- **Type:** Logic bug (prompt engineering - SKILL.md instruction conflicts)
- **Affected issues:** #8, #6

## Internal Investigation Results

### Trace Findings: 5 Logic Paths Through STEP 1.5

| Path | Condition | Expected Behavior | Status |
|------|-----------|-------------------|--------|
| A | bootstrap_completed=true + pending_target_skill exists | Read-and-clear, route to pending skill with enriched prompt | Defined |
| B | bootstrap_completed=true + pending_target_skill empty | Normal STEP 2 classification | Defined |
| C | bootstrap_completed=false + TRIVIAL | Skip bootstrap, /implementer direct | Defined (but contradicted) |
| D | bootstrap_completed=false + multi-skill | /guide first, then target skill | Defined (but not followed) |
| **E** | **bootstrap_completed=false + single-skill non-trivial** | **???** | **UNDEFINED - THE GAP** |

Path E is the critical gap. Requests like "PR 리뷰해줘" (single /validation) or "스캔해줘" (single /scanner) fall into this undefined path and the LLM defaults to direct invocation.

### Root Cause Hypotheses (Internal + 3 External AIs Confirmed)

| # | Hypothesis | Final Confidence | Notes |
|---|-----------|-----------------|-------|
| 1 | **Execution-near specificity dominance** — STEP 3/4의 즉시 실행 지시가 STEP 1.5의 조건부 지시를 override | **HIGH** (3/3 외부 AI 확인) | AI #3: "recency bias"보다 "execution-near specificity dominance"가 더 정확한 표현 |
| 2 | **Non-linear flow** — 1.5->2->back to 1.5 패턴에 return marker 없음 | **CRITICAL** (3/3 외부 AI 확인, 2개가 주 원인으로 지목) | AI #1: LLM에 call stack 없음. AI #3: prose로 program counter 표현 불가 |
| 3 | **Rule 7 structural exclusion** — "exactly 3 actions"이 bootstrap 행동 슬롯을 아예 제거 | **HIGH** (3/3 외부 AI 확인) | AI #3: "행동 모델 자체가 bootstrap을 수용하지 못하는 상태" |
| 4 | **Positive exemplar 부재** — bootstrap 경로의 end-to-end 예시 없음 | **MEDIUM** (AI #2 발견, AI #3 암시적 동의) | LLM은 시각화할 수 있는 경로로 default함 |

**근본 원인 (AI #3 정의):**
> "Bootstrap을 기존 선형 라우터 위에 덧붙였는데, 분류 결과와 현재 턴 실행 대상을 분리하지 않았고, 비선형 되돌아가기 흐름을 prose로만 표현했다."

### 8 Contradictions Found

| # | Type | Location | Issue | Severity |
|---|------|----------|-------|----------|
| 1 | **Direct contradiction** | routing-table.md L28 vs SKILL.md L95 | TRIVIAL -> /guide vs /implementer | CRITICAL |
| 2 | **Typo/logic error** | SKILL.md L193-197 | Reports "/implementer" but invokes "/guide" | CRITICAL |
| 3 | **Undefined path** | SKILL.md L92-114 | Single-skill non-trivial not handled | CRITICAL |
| 4 | **Template mismatch** | L187 vs L98-103 | STEP 3 template doesn't account for bootstrap redirect | HIGH |
| 5 | **Rule conflict** | L24-28 (Rule 7) vs L98-103 | 3-action model vs multi-step bootstrap | HIGH |
| 6 | **Rule conflict** | L21 (Rule 4) vs L98-103 | Auto-chain prohibition vs /guide->/target chain | HIGH |
| 7 | **Vague criteria** | L111-114 | Multi-skill judgment too subjective | HIGH |
| 8 | **Flow ambiguity** | L93 vs overall structure | Non-linear STEP 2 invocation from within STEP 1.5 | MEDIUM |

### Blast Radius

Affected skills when bootstrap is skipped:
- **All downstream skills** lose enriched prompts (claude_guide context)
- **/validation** — 감사 에이전트 프롬프트 품질 저하 -> 오탐률 증가 (이슈 #5 연관)
- **/code-migration** — 프로젝트 규칙 미반영 (이슈 #7 연관)
- **/implementer** — degraded mode 동작
- **pipeline-state.md** — `enriched_prompt_paths`가 항상 비어있게 됨

## External AI Synthesis (3 sources)

### Design Decisions (Unanimous 3/3)

| Decision | Rationale |
|----------|-----------|
| TRIVIAL -> /implementer (통일) | enriched prompt 불필요, 비용 대비 가치 낮음 |
| Non-trivial single-skill -> bootstrap | 복잡도는 스킬 수가 아니라 인지 부하로 판단 |
| multi vs single 구분 제거 | non-trivial이면 무조건 bootstrap |
| STEP 1.5 삭제 -> STEP 2.5 신설 | 분류 후 선형 게이트. "Do not return to earlier steps." |
| classified_skill + next_action 분리 | "Classification chooses eventual destination. Invocation chooses current turn's destination." |
| Rule 7 -> 3-Phase Protocol | "exactly 3 actions" 유지하되 action(3)의 대상이 next_action임을 명시 |
| XML 구조화된 보고 | 복잡한 프롬프트에서 모호성 감소 (Anthropic 공식 권장) |
| Positive exemplar 추가 | bootstrap 경로의 완전한 예시를 state-template.md에 포함 |

### Key Insight (AI #3)
> "The orchestrator is fundamentally a 2-turn state machine, but the prompt is still written as a 1-turn linear router."

## Final Modification Plan

```
1. STEP 1.5 삭제
2. STEP 2.5 신설: 테이블 기반 Bootstrap Decision Gate (분류 후, 선형)
   - 핵심 문구: "Do not return to earlier steps. Continue forward."
3. STEP 3 보고 템플릿: classified_skill + next_action 분리 (XML 구조)
4. STEP 4: "Invoke only next_action" 명시
5. Rule 7: "3-Phase Routing Protocol" (bootstrap은 action 3에 해당)
6. Rule 4: bootstrap 예외 추가
7. routing-table.md TRIVIAL행: /implementer로 통일
8. STEP 3 L197 typo 수정
9. state-template.md에 bootstrap 경로 positive exemplar 추가
```
