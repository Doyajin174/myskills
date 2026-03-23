---
name: code-migration
description: >
  Orchestrate system A → system B replacement using scan results, leaf-first dependency order,
  Build-Check Loop, and module-batch git checkpoints. Handles partial failures gracefully.
  Use when swapping billing systems, replacing libraries, or removing entire feature modules.
  MUST trigger on: "마이그레이션", "교체", "갈아끼우기", "시스템 교체", "swap", "migration",
  "replace system", "remove system", "시스템 제거", "완전 교체".
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent
---

# Code Migration — Build-Check Loop × Leaf-First Replacement

**Announce at start:** "I'm using the /migration skill to orchestrate the system replacement."

Replace system A with system B using scanner results as input. Leaf-first dependency order ensures each step is safe.

**Pipeline position:**
```
/scanner → scan-report.md (reference map + dependency graph)
    ↓
/code-migration ← YOU ARE HERE
    1. Read scan report
    2. Plan migration order (leaf-first)
    3. Execute per-module batch (edit → tsc → fix loop)
    4. Post-migration verification (knip + ESLint guard)
    5. Generate migration report
    ↓
/validation → ship / fix
```

**Core principle:** LLMs predict execution outcomes poorly (~30% error rate) but excel when given compiler output as feedback (Google arXiv 2504.09691). Every edit is followed by `tsc --noEmit`. The compiler is the oracle.

---

## STEP 0: Read Scan Report

Read the scan report from `/scanner`:
```
Scan for: docs/reports/*-scan-report.md
```

Extract:
- **Reference Map** — all confirmed references with file:line:category
- **Dependency Graph** — leaf-first ordering
- **Dead Code** — files to delete (not migrate)
- **Manual Verification Checklist** — items requiring human review
- **Confidence Score** — overall scan completeness

**If no scan report exists:** Route to `/scanner` first: "스캔 리포트가 없습니다. 먼저 /scanner로 레퍼런스를 찾아야 합니다."

**Verify scan report freshness:** Check if files listed in the report still exist. If >10% are missing/moved, re-run scanner.

---

## STEP 1: Plan Migration Order

### 1a. Determine migration strategy

| Input | Strategy |
|-------|----------|
| System A removed, System B already exists | **Remove-only** — delete A references, B is already wired |
| System A → System B replacement | **Swap** — replace A calls with B equivalents |
| System A removed, no replacement | **Purge** — delete all A code |

### 1b. Build execution plan from dependency graph

From the scan report's leaf-first ordering:
```
Tier 1 (leaves):    [files that import A but nothing imports them for A]
Tier 2 (middle):    [files that both import and export A-related code]
Tier 3 (core):      [A's definition files — delete last]
```

### 1c. Group into module batches

Group files by directory/module, 3-8 files per batch:
```
Batch 1: app/api/billing/*.ts (4 files) — Tier 1
Batch 2: components/billing/*.tsx (6 files) — Tier 1
Batch 3: lib/billing-utils.ts, lib/plans.ts (2 files) — Tier 2
Batch 4: lib/tiers.ts, prisma/schema.prisma (2 files) — Tier 3
```

### 1d. Pre-flight check

Before starting, verify:
```bash
git status  # clean working tree required
npx tsc --noEmit 2>&1  # must pass BEFORE migration starts
```

**If tsc fails before migration:** Fix existing errors first, or note them as pre-existing.

**Create migration branch** if not already on one:
```bash
git checkout -b migrate/{topic} 2>/dev/null || true
```

---

## STEP 2: Execute Migration — Build-Check Loop

For each batch in order (Tier 1 → Tier 2 → Tier 3):

```
┌─── BATCH LOOP ───────────────────────────────┐
│                                               │
│  1. Edit all files in batch                   │
│     - Remove/replace system A references      │
│     - Update imports to system B              │
│     - Fix type annotations                    │
│                                               │
│  2. Build check                               │
│     npx tsc --noEmit 2>&1                     │
│                                               │
│  3. If errors:                                │
│     ├─ Read error messages                    │
│     ├─ Fix the specific errors                │
│     ├─ Retry (max 3 attempts)                 │
│     └─ If 3 failures:                         │
│        git stash push -m "failed: [batch]"    │
│        Log failure, skip to next batch        │
│                                               │
│  4. If clean:                                 │
│     git add [batch files]                     │
│     git commit -m "migrate: [module]"         │
│                                               │
└───────────────────────────────────────────────┘
```

### Editing rules

- **Never use regex/sed for code modification.** Always use Edit tool or rewrite the logical block.
- **One concern per edit.** Don't mix import cleanup with logic changes.
- **Preserve formatting.** Match existing code style.
- **Update tests.** If a test file references system A, update it in the same batch.

### Error handling rules

- Read the FULL tsc error output before fixing. Don't fix the first error and hope the rest resolve.
- If errors cascade (>20 errors from one change), you likely changed a core type too early. **Stop, revert, re-plan.**
- If an error is in a file NOT in the current batch, that file has an undiscovered dependency. Add it to the batch or move to the next tier.

### Context management

After each batch:
- Summarize: "[batch]: N files migrated, N errors fixed, committed as [hash]"
- Discard file contents from context (they're committed)
- Retain: error patterns, decisions made, remaining batches

---

## STEP 3: Delete Dead Code

After all batches complete, delete files identified as dead by the scanner:

```
For each dead file from scan report:
  1. Verify it has zero remaining imports (Grep)
  2. Delete the file
  3. Run tsc --noEmit
  4. If tsc fails → file was NOT dead. Restore and add to manual checklist.
```

Delete dead code in leaf-first order. Commit as a single batch:
```bash
git add -A && git commit -m "chore: remove dead code from [system A]"
```

---

## STEP 4: Post-Migration Verification

### 4a. Reference count check

Run ripgrep for ALL original patterns:
```
Grep(pattern, output_mode="count")
```

**Target: 0 matches** in source code. Matches in:
- Git history → OK (expected)
- Migration report → OK
- Comments explaining removal → OK, but consider removing

### 4b. knip cleanup

```bash
npx knip --reporter compact 2>&1
```

Check for newly orphaned code created by the migration (exports that lost their only consumer).

### 4c. Full build verification

```bash
npx tsc --noEmit 2>&1
```

Must pass with zero errors.

### 4d. ESLint guard (regression prevention)

Output the ESLint rule to add:
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [
        { "name": "lib/tiers", "message": "System A removed. Use [System B] instead." },
        { "name": "lib/entitlements", "message": "System A removed. Use [System B] instead." }
      ]
    }]
  }
}
```

Apply to `.eslintrc` or `eslint.config.js`. This prevents anyone from re-importing the removed system.

### 4e. Tombstoning (optional safety net)

If confidence score < 90% OR manual verification checklist has >5 items:

Instead of deleting core entry points, replace them with runtime traps:
```typescript
export function getUserTier(): never {
  throw new Error('DEPRECATED: getUserTier() removed. Use [System B] instead. ' + new Error().stack);
}
```

Deploy to staging. If no errors after 1 week, delete the tombstones.

---

## STEP 5: Migration Report

Save to `docs/reports/{topic}-migration-report.md`:

```markdown
# [Topic] — Migration Report

> Migrated on [date]
> From: [System A] → To: [System B]
> Scan report: [link]

## Summary
| Metric | Count |
|--------|-------|
| Batches planned | [N] |
| Batches succeeded | [N] |
| Batches failed/skipped | [N] |
| Files modified | [N] |
| Files deleted (dead code) | [N] |
| Commits created | [N] |
| Remaining references | [N] (target: 0) |

## Batch Results
| # | Module | Files | Status | Commit | Notes |
|---|--------|-------|--------|--------|-------|
| 1 | app/api/billing | 4 | ✅ | abc1234 | Clean |
| 2 | components/billing | 6 | ✅ | def5678 | 2 type fixes |
| 3 | lib/utils | 2 | ⚠️ skipped | — | Cascade error, needs manual |

## Failed/Skipped Batches
[Details on what failed and why]

## Post-Migration Verification
- Reference count: [N] remaining (target: 0)
- knip: [N] new orphans found
- tsc --noEmit: ✅ PASS / ❌ FAIL
- ESLint guard: ✅ applied / ❌ not applied

## Manual Action Required
- [ ] [items from scanner's manual checklist]
- [ ] [items from failed batches]
- [ ] Review tombstoned entry points after staging test

## Confidence: [X]%
[Post-migration confidence = scanner confidence × migration success rate]
```

---

## Quality Checklist

### Must-pass
- [ ] Scan report read and dependency graph extracted
- [ ] Migration executed in leaf-first order
- [ ] Each batch followed by tsc --noEmit
- [ ] Failed batches stashed (not left broken)
- [ ] Each successful batch committed
- [ ] Post-migration: reference count checked
- [ ] Migration report saved to docs/reports/

### Should-pass
- [ ] Dead code deleted after active migration
- [ ] knip run for orphan detection
- [ ] ESLint guard rule output/applied
- [ ] Pre-existing tsc errors noted (not introduced by migration)
- [ ] Tombstoning applied (if confidence < 90%)

---

## Anti-Patterns

- **Big-bang migration**: Editing 50 files then running tsc once. Use module batches.
- **Alphabetical order**: Files must be processed leaf-first, not alphabetically.
- **Regex for code edits**: `sed 's/OldType/NewType/g'` breaks nested brackets and strings. Use Edit tool.
- **Ignoring cascade errors**: >20 tsc errors from one change means you're editing too high in the dependency tree. Revert.
- **Skipping dead code deletion**: Leaving dead system A code creates confusion. Delete after migration.
- **No ESLint guard**: Without `no-restricted-imports`, someone will re-import system A next week.
- **Trusting "zero references"**: Only proof is tsc passing AFTER physically deleting system A source files.
- **Committing broken state**: Never commit if tsc fails. Stash and skip.
- **No pre-flight check**: Starting migration on a dirty working tree or broken build is a recipe for unrecoverable state.

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `migration` to **Completed**, update **Artifacts** with migration report path, set **Recommended Next** to `/validation, /problem`
