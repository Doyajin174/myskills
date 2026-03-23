---
name: spider-knowledge
description: Project documentation hub and knowledge management. Use when searching for docs, adding references, or recording incidents. (user)
---

# Spider Knowledge Hub Skill

> Byte-Griffin-MoE 프로젝트 문서 관리 및 지식 허브

---

## 🚨 MANDATORY: 문서 위치 규칙

**Single Source of Truth**: `griffin-lm/docs/INDEX.md`

**절대 하지 마라:**
- 루트 `docs/`에 새 문서 추가
- 임의 위치에 `.md` 파일 생성
- 문서 추가 후 INDEX.md 업데이트 안 함

---

## 📂 Documentation Structure

```
griffin-lm/docs/
├── INDEX.md                    ← 문서 허브 (반드시 여기서 시작)
├── playbook/                   ← 실행 가이드 (How-to)
│   ├── CURRICULUM.md           ← 커리큘럼 학습 (8k→16k→32k→64k)
│   ├── PREEMPTION_SAFETY.md    ← 되감김 방지 Bootstrap 패턴
│   ├── probe_insertion_checklist.md ← NaN 디버깅 프로브
│   └── SETUP_INSTRUCTIONS.md   ← 환경 설정
├── data/                       ← 데이터셋 관리
│   ├── DATASET_MAPPING.md      ← HF 데이터셋 매핑
│   └── dataset_recommendations_summary.md
├── architecture/               ← 아키텍처 문서
│   ├── ARCHITECTURE.md         ← arc42 스타일 상세
│   └── byte-griffin-architecture.md ← Byte/Patch 구조
├── operations/                 ← 운영 가이드
│   ├── MEMORY_OPTIMIZATION.md  ← OOM 해결
│   └── tpu-fsdp-canonical-settings.md ← TPU FSDP
├── references/                 ← 외부 참고
│   └── YYYY-MM-DD_topic.md     ← 날짜 형식 필수!
├── incidents/                  ← 장애 보고서
│   └── YYYY-MM-DD-issue.md     ← 날짜 형식 필수!
└── legacy_root_docs/           ← 레거시 (건드리지 마)
```

---

## 🔍 문서 찾기 Quick Reference

| 찾는 것 | 위치 |
|---------|------|
| 커리큘럼 학습 방법 | `playbook/CURRICULUM.md` |
| Preemption 안전 패턴 | `playbook/PREEMPTION_SAFETY.md` |
| NaN 디버깅 | `playbook/probe_insertion_checklist.md` |
| 데이터셋 매핑 | `data/DATASET_MAPPING.md` |
| 메모리 최적화 | `operations/MEMORY_OPTIMIZATION.md` |
| TPU 설정 | `operations/tpu-fsdp-canonical-settings.md` |
| 모델 아키텍처 | `architecture/ARCHITECTURE.md` |
| 장애 기록 | `incidents/YYYY-MM-DD-*.md` |

---

## ➕ 새 문서 추가 규칙

### 외부 참고자료 추가

```bash
# 파일명: YYYY-MM-DD_topic-name.md
echo "# Topic Name" > griffin-lm/docs/references/2025-01-15_jax-checkpoint-guide.md

# INDEX.md에 링크 추가 (References 섹션)
```

### 장애/문제 기록

```bash
# 파일명: YYYY-MM-DD-issue-name.md
echo "# Issue Name" > griffin-lm/docs/incidents/2025-01-15-oom-batch8.md

# INDEX.md Incident Reports 테이블에 추가
```

### 실험 로그 기록

```bash
# 파일에 로그 저장 X → GCS 경로만 기록
# playbook/experiment_log.md에 추가:

echo "| 2025-01-15 | 64k-full | gs://bucket/path | 성공 |" >> griffin-lm/docs/playbook/experiment_log.md
```

---

## 📋 문서 추가 Checklist

새 문서 추가 시:

- [ ] 올바른 카테고리 선택 (playbook/data/architecture/operations/references/incidents)
- [ ] 파일명 형식 준수 (references/incidents는 날짜 필수)
- [ ] INDEX.md에 링크 추가
- [ ] 관련 README.md 업데이트 (필요시)

---

## 🔗 Quick Commands

```bash
# 문서 허브 열기
cat griffin-lm/docs/INDEX.md

# 특정 토픽 검색
grep -r "curriculum" griffin-lm/docs/

# 최신 incidents 확인
ls -lt griffin-lm/docs/incidents/ | head -5

# 참고자료 목록
ls griffin-lm/docs/references/
```

---

## 🚫 Anti-patterns

### ❌ 루트에 문서 추가

```bash
# 잘못된 예
docs/my-new-doc.md  # ← 루트 docs/ 사용 금지!
```

### ✅ griffin-lm/docs/에 추가

```bash
# 올바른 예
griffin-lm/docs/references/2025-01-15_my-new-doc.md
```

### ❌ 날짜 없이 추가

```bash
# 잘못된 예
griffin-lm/docs/references/jax-guide.md  # ← 날짜 없음!
```

### ✅ 날짜 형식 준수

```bash
# 올바른 예
griffin-lm/docs/references/2025-01-15_jax-guide.md
```

---

## 🎯 When to Use This Skill

**Auto-Triggers:**
- "문서 어디" / "docs where"
- "어떻게 하지" / "how to"
- "참고자료 추가" / "add reference"
- "장애 기록" / "record incident"
- "INDEX" 언급

**Manual Triggers:**
- `@knowledge` - Full context
- `@docs` - Document search
- `@playbook` - Execution guides

---

## 📚 Related Skills

| Skill | 용도 |
|-------|------|
| `spider-essential` | TPU/NaN/mLSTM 기술 |
| `ml-antipattern-validator` | ML 안티패턴 검증 |
| `safe-edit` | 안전한 파일 수정 |

---

## 🗂️ Legacy Docs

`griffin-lm/docs/legacy_root_docs/`에는 루트 `docs/`에서 이관된 문서들이 있습니다:

- `plans/` - 초기 설계 계획
- `phases/` - 개발 단계별 기록
- `theory/` - 이론적 배경
- `spider-griffin-moe/` - 마스터플랜

**참고용으로만 사용, 직접 수정하지 마세요.**

---

*Last updated: 2025-12-25*
