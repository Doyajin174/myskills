#!/usr/bin/env node

/**
 * DB Migration Safety Setup
 *
 * 프로젝트에 안전한 DB migration 체계를 자동으로 구축합니다.
 *
 * 사용법:
 *   node /path/to/myskills/scripts/init-db-safety.js
 *
 * 하는 일:
 *   1. prisma/schema.prisma에 shadowDatabaseUrl 추가
 *   2. docker-compose.yml에 shadow DB 서비스 추가
 *   3. .github/workflows/migration-check.yml 생성 (PR에서 migration 누락 방지)
 *   4. .github/workflows/deploy-staging.yml 생성 (배포 시 자동 migration)
 *   5. .env.local에 SHADOW_DATABASE_URL 추가
 *   6. CLAUDE.md에 DB Migration Workflow 섹션 추가
 *   7. 수동 작업 안내 출력
 */

const fs = require('fs')
const path = require('path')

const CWD = process.cwd()

function log(emoji, msg) {
  console.log(`  ${emoji} ${msg}`)
}

function fileExists(filePath) {
  return fs.existsSync(path.join(CWD, filePath))
}

function readFile(filePath) {
  return fs.readFileSync(path.join(CWD, filePath), 'utf-8')
}

function writeFile(filePath, content) {
  const fullPath = path.join(CWD, filePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

function appendFile(filePath, content) {
  fs.appendFileSync(path.join(CWD, filePath), content)
}

// ============================================================
// Step 1: schema.prisma — shadowDatabaseUrl
// ============================================================
function setupShadowDb() {
  if (!fileExists('prisma/schema.prisma')) {
    log('⚠️', 'prisma/schema.prisma not found — skipping shadow DB setup')
    return false
  }

  const schema = readFile('prisma/schema.prisma')

  if (schema.includes('shadowDatabaseUrl')) {
    log('✅', 'schema.prisma already has shadowDatabaseUrl — skipping')
    return true
  }

  const updated = schema.replace(
    /url\s*=\s*env\("DATABASE_URL"\)/,
    'url               = env("DATABASE_URL")\n  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")'
  )

  if (updated === schema) {
    log('⚠️', 'Could not find DATABASE_URL line in schema.prisma — add shadowDatabaseUrl manually')
    return false
  }

  writeFile('prisma/schema.prisma', updated)
  log('✅', 'schema.prisma — shadowDatabaseUrl 추가')
  return true
}

// ============================================================
// Step 2: docker-compose.yml — shadow DB service
// ============================================================
function setupDockerCompose() {
  if (fileExists('docker-compose.yml')) {
    const existing = readFile('docker-compose.yml')
    if (existing.includes('shadow-db')) {
      log('✅', 'docker-compose.yml already has shadow-db — skipping')
      return
    }
    log('⚠️', 'docker-compose.yml exists but has no shadow-db — add manually:')
    console.log(`
    shadow-db:
      image: postgres:15
      ports: ["5433:5432"]
      environment:
        POSTGRES_PASSWORD: shadow
        POSTGRES_DB: shadow
`)
    return
  }

  writeFile('docker-compose.yml', `# Shadow DB for Prisma Migrate
# Used only for \`prisma migrate dev\` (local development).
# NOT needed for CI or production (migrate deploy doesn't use shadow DB).
#
# Usage: docker compose up -d shadow-db

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
`)
  log('✅', 'docker-compose.yml — shadow DB 서비스 생성')
}

// ============================================================
// Step 3: GitHub Actions — migration-check.yml
// ============================================================
function setupMigrationCheck() {
  const filePath = '.github/workflows/migration-check.yml'

  if (fileExists(filePath)) {
    log('✅', 'migration-check.yml already exists — skipping')
    return
  }

  writeFile(filePath, `name: Migration Check

on:
  pull_request:
    paths:
      - 'prisma/schema.prisma'
      - 'prisma/migrations/**'

jobs:
  check-migration-sync:
    name: Schema ↔ Migration Sync
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Check schema-migration sync
        run: |
          npx prisma migrate diff \\
            --from-migrations ./prisma/migrations \\
            --to-schema-datamodel ./prisma/schema.prisma \\
            --exit-code
        # exit-code 2 = schema changed but no migration file → FAIL
`)
  log('✅', 'migration-check.yml — PR migration diff 체크 생성')
}

// ============================================================
// Step 4: GitHub Actions — deploy-staging.yml
// ============================================================
function setupDeployStaging() {
  const filePath = '.github/workflows/deploy-staging.yml'

  if (fileExists(filePath)) {
    log('✅', 'deploy-staging.yml already exists — skipping')
    return
  }

  writeFile(filePath, `name: Deploy Staging

on:
  push:
    branches: [staging]

jobs:
  migrate-and-deploy:
    name: DB Migration → Deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      # 1. Check pg_dump vs server version compatibility
      - name: Check PostgreSQL version compatibility
        run: |
          SERVER_VER=\$(psql "\$DATABASE_URL" -t -c "SHOW server_version;" | tr -d ' ' | cut -d. -f1)
          CLIENT_VER=\$(pg_dump --version | grep -oP '\\d+' | head -1)
          echo "Server: PostgreSQL \$SERVER_VER"
          echo "Client: pg_dump \$CLIENT_VER"
          if [ "\$CLIENT_VER" -lt "\$SERVER_VER" ]; then
            echo "Installing postgresql-client-\$SERVER_VER"
            sudo apt-get install -y curl ca-certificates
            sudo install -d /usr/share/postgresql-common/pgdg
            sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
            echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt \$(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
            sudo apt-get update
            sudo apt-get install -y postgresql-client-\$SERVER_VER
          fi
        env:
          DATABASE_URL: \${{ secrets.STAGING_DATABASE_URL }}

      # 2. Backup staging DB before migration
      - name: Backup DB
        run: |
          pg_dump "\$DATABASE_URL" --format=custom -f backup_\$(date +%Y%m%d_%H%M%S).dump
        env:
          DATABASE_URL: \${{ secrets.STAGING_DATABASE_URL }}

      # 3. Apply Prisma migrations
      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: \${{ secrets.STAGING_DATABASE_URL }}

      # 3. Verify migration status
      - name: Check migration status
        run: npx prisma migrate status
        env:
          DATABASE_URL: \${{ secrets.STAGING_DATABASE_URL }}

      # 4. Generate Prisma client
      - name: Generate Prisma client
        run: npx prisma generate
`)
  log('✅', 'deploy-staging.yml — 배포 파이프라인 생성')
}

// ============================================================
// Step 5: .env.local — SHADOW_DATABASE_URL
// ============================================================
function setupEnvLocal() {
  const filePath = '.env.local'

  if (fileExists(filePath)) {
    const content = readFile(filePath)
    if (content.includes('SHADOW_DATABASE_URL')) {
      log('✅', '.env.local already has SHADOW_DATABASE_URL — skipping')
      return
    }
    appendFile(filePath, '\n# Shadow DB for prisma migrate dev (local only)\nSHADOW_DATABASE_URL="postgresql://postgres:shadow@localhost:5433/shadow"\n')
  } else {
    writeFile(filePath, '# Shadow DB for prisma migrate dev (local only)\nSHADOW_DATABASE_URL="postgresql://postgres:shadow@localhost:5433/shadow"\n')
  }
  log('✅', '.env.local — SHADOW_DATABASE_URL 추가')
}

// ============================================================
// Step 6: CLAUDE.md — DB Migration Workflow
// ============================================================
function setupClaudeMd() {
  if (!fileExists('CLAUDE.md')) {
    log('⚠️', 'CLAUDE.md not found — skipping documentation')
    return
  }

  const content = readFile('CLAUDE.md')

  if (content.includes('DB Migration Workflow')) {
    log('✅', 'CLAUDE.md already has DB Migration Workflow — skipping')
    return
  }

  const section = `
## DB Migration Workflow

### Schema 변경 시 (로컬 개발)
1. \`schema.prisma\` 수정
2. \`npx prisma migrate dev --create-only --name 변경명\` — SQL 파일 생성
3. 생성된 migration SQL 리뷰 (DROP 구문 확인!)
4. \`npx prisma migrate dev\` — 로컬 DB에 적용
5. migration 파일 + schema 변경을 **함께 커밋**

### 스테이징/프로덕션 배포
- CI(GitHub Actions)가 자동으로 \`prisma migrate deploy\` 실행
- migration 파일이 없으면 PR에서 CI fail
- 배포 전 pg_dump 백업 자동 실행

### 파괴적 변경 (컬럼 삭제, 이름 변경)
Expand-and-Contract 패턴:
1. Deploy 1: 새 컬럼 추가 + 양쪽 쓰기
2. Deploy 2: 데이터 복사 + 새 컬럼에서 읽기
3. Deploy 3: 옛 컬럼 삭제

### 금지 사항
- **스테이징/프로덕션에서 \`prisma db push\` 사용 금지**
- **migration SQL 리뷰 없이 적용 금지**

### Shadow DB (로컬 전용)
- \`docker compose up -d shadow-db\` — port 5433
- \`.env.local\`에 \`SHADOW_DATABASE_URL\` 설정 필요
`

  writeFile('CLAUDE.md', content + section)
  log('✅', 'CLAUDE.md — DB Migration Workflow 섹션 추가')
}

// ============================================================
// Main
// ============================================================
function main() {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔒 DB Migration Safety Setup')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // Pre-check
  if (!fileExists('prisma/schema.prisma')) {
    console.log('❌ This doesn\'t look like a Prisma project (no prisma/schema.prisma).')
    console.log('   Run this script from your project root.')
    process.exit(1)
  }

  if (!fileExists('package.json')) {
    console.log('❌ No package.json found. Run this from your project root.')
    process.exit(1)
  }

  console.log(`  📁 Project: ${CWD}`)
  console.log('')

  setupShadowDb()
  setupDockerCompose()
  setupMigrationCheck()
  setupDeployStaging()
  setupEnvLocal()
  setupClaudeMd()

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ DB Migration Safety 세팅 완료!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('📋 수동으로 해야 할 것:')
  console.log('')
  console.log('  1. Shadow DB 시작:')
  console.log('     docker compose up -d shadow-db')
  console.log('')
  console.log('  2. GitHub Secrets 추가 (repo Settings → Secrets):')
  console.log('     STAGING_DATABASE_URL=postgresql://...')
  console.log('')
  console.log('  3. Baseline migration (스테이징/프로덕션 DB에 1회):')
  console.log('     npx prisma migrate resolve --applied 0_baseline')
  console.log('')
  console.log('  4. 이후 스키마 변경 시:')
  console.log('     npx prisma migrate dev --name 변경명')
  console.log('     (prisma db push 대신 사용)')
  console.log('')
}

main()
