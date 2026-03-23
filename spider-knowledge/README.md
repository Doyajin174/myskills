# Spider Knowledge Hub

> 프로젝트 문서 허브 및 지식 관리 스킬

## Quick Start

```
@knowledge - 문서 허브 활성화
@docs      - 문서 검색
@playbook  - 실행 가이드 확인
```

## Documentation Hub

**Single Source of Truth**: `griffin-lm/docs/INDEX.md`

| Category | Path | 용도 |
|----------|------|------|
| **playbook/** | 실행 가이드 | 훈련 방법, 커리큘럼, 설정 |
| **data/** | 데이터셋 | HF 매핑, 추천 데이터 |
| **architecture/** | 아키텍처 | 모델 구조, 설계 |
| **operations/** | 운영 | 메모리 최적화, TPU 설정 |
| **references/** | 외부 참고 | 논문, 가이드 |
| **incidents/** | 장애 기록 | 문제/해결 히스토리 |
| **legacy_root_docs/** | 레거시 | 과거 문서 보관 |

## Auto-Triggers

Activates when:
- "문서 어디" / "docs" 언급
- "어떻게 하지" / "how to" 질문
- 새 참고자료 추가 필요
- 장애/문제 기록 필요

## File Naming Convention

```
references/YYYY-MM-DD_topic-name.md
incidents/YYYY-MM-DD-issue-name.md
```

## Related Skills

- `spider-essential` - TPU/NaN/mLSTM 기술 스킬
- `ml-antipattern-validator` - ML 안티패턴 검증
- `safe-edit` - 안전한 파일 수정

---

*Spider AI/ML Project Knowledge Management*
