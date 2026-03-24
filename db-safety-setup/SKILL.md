---
name: db-safety-setup
description: >
  Set up safe DB migration pipeline for Prisma projects. Adds shadow DB,
  CI migration checks, deploy pipeline, and documentation automatically.
  Use when: "DB 세팅", "마이그레이션 세팅", "DB 안전", "db safety",
  "migration setup", "DB 파이프라인", "prisma migrate 전환".
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# DB Safety Setup — One-Click Migration Pipeline

**Announce at start:** "I'm using the /db-safety-setup skill to configure safe DB migration for this project."

Prisma 프로젝트에 안전한 DB migration 체계를 자동으로 구축. `prisma db push` 의존에서 `prisma migrate dev/deploy` 기반으로 전환.

---

## STEP 0: Pre-Check

프로젝트 루트에서 실행 확인:

1. `prisma/schema.prisma` 존재하는지 → 없으면 STOP: "Prisma 프로젝트가 아닙니다."
2. `package.json` 존재하는지 → 없으면 STOP: "프로젝트 루트에서 실행하세요."
3. 현재 상태 파악:
   - `prisma/migrations/` 디렉토리 존재 여부
   - `docker-compose.yml` 존재 여부
   - `.github/workflows/` 존재 여부
   - `CLAUDE.md` 존재 여부
   - Supabase 사용 여부 (`supabase/` 디렉토리)

결과를 사용자에게 보고:
```
📁 프로젝트: [경로]
📊 현재 상태:
  - Prisma: ✅
  - Supabase: ✅/❌
  - 기존 migrations: [N]개 / 없음
  - Shadow DB: 설정됨 / 미설정
  - CI workflows: [N]개 / 없음
  - CLAUDE.md: 있음 / 없음

설정을 시작할까요?
```

**사용자 확인 후 진행.**

---

## STEP 1: Shadow DB 설정

### 1a. schema.prisma — shadowDatabaseUrl

`prisma/schema.prisma` 읽기. `datasource db` 블록에 `shadowDatabaseUrl`이 없으면 추가:

```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

이미 있으면 skip.

### 1b. docker-compose.yml — shadow DB 서비스

파일이 없으면 생성. 있으면 `shadow-db` 서비스가 있는지 확인 → 없으면 추가 안내.

```yaml
services:
  shadow-db:
    image: postgres:15
    ports:
      - "5433:5432"
    environment:
      POSTGRES_PASSWORD: shadow
      POSTGRES_DB: shadow
    volumes:
      - shadow-db-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  shadow-db-data:
```

### 1c. .env.local — SHADOW_DATABASE_URL

`.env.local`에 이미 있는지 확인 → 없으면 추가:
```
SHADOW_DATABASE_URL="postgresql://postgres:shadow@localhost:5433/shadow"
```

**`.env.local`은 절대 git에 커밋하지 않는다.** `.gitignore`에 있는지 확인.

---

## STEP 2: CI/CD 파이프라인

### 2a. PR Migration Check

`.github/workflows/migration-check.yml` 생성:
- PR에서 `prisma/schema.prisma` 또는 `prisma/migrations/` 변경 시 트리거
- `prisma migrate diff --exit-code` 실행
- schema 변경이 있는데 migration 파일이 없으면 → PR fail

### 2b. Deploy Pipeline

`.github/workflows/deploy-staging.yml` 생성:
- staging 브랜치 push 시 트리거
- 순서: pg_dump 버전 자동 감지/설치 → pg_dump backup → prisma migrate deploy → prisma generate
- pg_dump와 서버 버전 불일치 시 해당 버전 postgresql-client 자동 설치
- migration 실패 시 배포 중단

**브랜치명:** 프로젝트의 기본 배포 브랜치를 감지 (staging / main / deploy 등). 확실하지 않으면 사용자에게 질문.

---

## STEP 3: 로컬 리셋 스크립트 업데이트 (해당 시)

`scripts/db-local-reset.ts` (또는 유사 스크립트)가 있으면:
- `prisma db push` → `prisma migrate deploy`로 변경
- fallback: migrate deploy 실패 시 db push로 대체 (첫 설정 시)

없으면 skip.

---

## STEP 4: CLAUDE.md 문서화

`CLAUDE.md`가 있으면 `## DB Migration Workflow` 섹션 추가:

```markdown
## DB Migration Workflow

### Schema 변경 시 (로컬 개발)
1. `schema.prisma` 수정
2. `npx prisma migrate dev --create-only --name 변경명` — SQL 파일 생성
3. 생성된 migration SQL 리뷰 (DROP 구문 확인!)
4. `npx prisma migrate dev` — 로컬 DB에 적용
5. migration 파일 + schema 변경을 **함께 커밋**

### 스테이징/프로덕션 배포
- CI가 자동으로 `prisma migrate deploy` 실행
- migration 파일 없으면 PR fail

### 금지 사항
- 스테이징/프로덕션에서 `prisma db push` 사용 금지
- migration SQL 리뷰 없이 적용 금지
```

이미 있으면 skip.

---

## STEP 5: 결과 보고 + 수동 작업 안내

```
✅ DB Migration Safety 세팅 완료!

📝 변경된 파일:
- [파일 목록]

📋 수동으로 해야 할 것:

1. Shadow DB 시작:
   docker compose up -d shadow-db

2. GitHub Secrets 추가 (repo Settings → Secrets):
   STAGING_DATABASE_URL=postgresql://...

3. Baseline migration (스테이징/프로덕션 DB에 1회):
   npx prisma migrate resolve --applied 0_baseline

4. 이후 스키마 변경 시:
   npx prisma migrate dev --name 변경명
   (prisma db push 대신 사용)
```

---

## Quality Checklist

### Must-pass
- [ ] schema.prisma에 shadowDatabaseUrl 존재
- [ ] docker-compose.yml에 shadow-db 서비스 존재
- [ ] .github/workflows/migration-check.yml 존재
- [ ] .github/workflows/deploy-staging.yml 존재
- [ ] .env.local에 SHADOW_DATABASE_URL 존재
- [ ] 수동 작업 안내 출력됨

### Should-pass
- [ ] CLAUDE.md에 DB Migration Workflow 섹션 존재
- [ ] 로컬 리셋 스크립트가 migrate deploy 사용
- [ ] .gitignore에 .env.local 포함 확인

---

## Anti-Patterns

- **프로덕션 DB에 직접 실행**: 이 스킬은 로컬 설정만 함. 프로덕션은 CI가 처리.
- **기존 파일 덮어쓰기**: 이미 설정된 항목은 skip. 멱등성 보장.
- **secrets를 코드에 넣기**: DATABASE_URL 등은 .env.local과 GitHub Secrets에만.
- **migration 파일 없이 db push**: 이 스킬의 존재 이유가 이걸 방지하는 것.

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `db-safety-setup` to **Completed**, update **Artifacts** with created files, set **Recommended Next** to `/validation`
