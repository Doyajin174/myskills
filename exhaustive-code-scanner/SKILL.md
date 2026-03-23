---
name: exhaustive-code-scanner
description: >
  Find ALL references to a code system (enums, types, functions, modules) in a TypeScript/JS codebase
  with near-100% completeness using a 4-layer pipeline (ripgrep → ast-grep → tsc → knip).
  Use when removing a system, auditing usage, checking impact, or preparing for migration.
  MUST trigger on: "스캔", "레퍼런스 찾아", "어디서 쓰이나", "임팩트 분석", "dead code",
  "다 찾아", "사용처", "참조", "scan", "find all references", "impact analysis", "usage audit".
allowed-tools: Read, Glob, Grep, Bash, Write, Agent
---

# Exhaustive Code Scanner — 4-Layer Reference Discovery

**Announce at start:** "I'm using the /scanner skill to find all references exhaustively."

Find every reference to a target system using a multi-layer pipeline. Each layer catches what the previous one missed.

**Pipeline position:**
```
User: "이 시스템 쓰는 데가 어디야?"
    ↓
/scanner ← YOU ARE HERE
    1. Pre-filter dead code (knip)
    2. Broad text scan (ripgrep)
    3. Structural filter (ast-grep)
    4. Compiler verification (tsc)
    5. Classify + dependency graph
    6. Confidence score + manual checklist
    ↓
Output: scan-report.md → /code-migration or /implementer
```

---

## STEP 0: Parse Input

Extract the target system to scan:

| Input | Example |
|-------|---------|
| **Symbols** | enum MembershipTier, model UserMembership, function getUserTier() |
| **Modules** | lib/tiers.ts, lib/entitlements.ts, lib/tier-limits.ts |
| **Patterns** | `MembershipTier`, `UserMembership`, `TIER_`, `isMasterUser` |

Build a **pattern list** from the input:
```
Primary patterns: exact symbol names (e.g., "MembershipTier")
Secondary patterns: related names, abbreviations, partial matches
Module patterns: import paths (e.g., "lib/tiers", "@/lib/tiers")
```

If the user provides vague input ("포인트 시스템 다 찾아"), ask ONE clarifying question to get specific symbol names.
**STOP and do not proceed until you have explicit symbol names.** Do not rationalize "I have enough context." Scanning without specific patterns produces garbage results.

---

## STEP 0.5: Pre-Flight Dependency Check

Verify required tools before scanning:
```bash
npx @ast-grep/cli --version 2>/dev/null || echo "⚠️ ast-grep NOT available"
npx tsc --version 2>/dev/null || echo "⚠️ tsc NOT available"
npx knip --version 2>/dev/null || echo "⚠️ knip NOT available"
```

- All available → proceed normally
- ast-grep missing → degrade to rg + tsc only (confidence ceiling: 85%)
- tsc missing → ABORT ("tsc is required for verification. Install TypeScript first.")
- knip missing → skip STEP 1, note in confidence

**ripgrep fallback:** If Grep tool fails during scan, fall back to:
```bash
grep -rn "pattern" --include="*.ts" --include="*.tsx" --include="*.json" .
```
If both rg and grep fail → ABORT ("No text search tool available.")

---

## STEP 1: Pre-Scan — Dead Code Tagging (knip)

Run knip FIRST to identify dead code candidates. **Tag only — do NOT exclude yet.**

```bash
npx knip --reporter compact 2>&1
```

From knip output, extract:
- Unused exports → tag as `dead-code-candidate` (NOT "confirmed dead")
- Unused files → tag as `dead-file-candidate`
- Unused dependencies → note for cleanup

**Output:** Dead code candidate list. These are **tagged, not excluded.** Final exclusion happens after migration completes (knip can have false positives with dynamic imports, barrel files, and framework plugins).

**Cross-validate:** For each knip-flagged unused export, run `Grep(symbol)` to confirm zero references. If grep finds references knip missed → remove the dead-code tag.

**If knip fails (network/cache):** Skip this layer. Proceed with rg. Note "knip skipped" in confidence score.

---

## STEP 2: 4-Layer Scan Pipeline

Run layers sequentially. Each layer refines the previous.

### Layer 1: ripgrep (Broad Text Recall)

For each pattern, run:
```
Grep(pattern, output_mode="content", type="ts")   — TypeScript files
Grep(pattern, output_mode="content", glob="*.json") — Config files
Grep(pattern, output_mode="content", glob="*.md")   — Documentation
Grep(pattern, output_mode="content", glob="*.sql")  — SQL/migrations
Grep(pattern, output_mode="content", glob="*.env*")  — Environment files
```

Collect ALL matches. This layer has false positives (comments, strings, similar names) — that's OK. The goal is **maximum recall**.

### Layer 2: ast-grep (Structural Filter)

For each primary pattern, run structural queries to filter false positives:

```bash
npx @ast-grep/cli run --pattern 'import { $$$NAMES } from "$MODULE"' --lang typescript
npx @ast-grep/cli run --pattern '$PATTERN' --lang typescript
```

Key patterns to check:
- `import { TargetSymbol } from '...'` — direct imports
- `import { TargetSymbol as $ALIAS } from '...'` — aliased imports
- `export { TargetSymbol } from '...'` — re-exports
- `TargetSymbol.$PROP` — property access
- `type $NAME = TargetSymbol` — type aliases
- `$VAR: TargetSymbol` — type annotations

**If ast-grep fails (not cached):** Fall back to ripgrep-only results. Note "ast-grep skipped" in confidence score.

### Layer 3: tsc Verification

Run the TypeScript compiler to verify project integrity:
```bash
npx tsc --noEmit 2>&1
npx tsc --noEmit --listFilesOnly 2>&1
```

Check:
- Are all target files included in the TS program?
- Are there existing type errors related to target symbols?
- Which files import the target modules (from `--listFilesOnly` cross-reference)?

### Layer 4: Cross-Reference Validation

Compare results across layers:
- In rg but NOT in ast-grep → likely false positive (comment/string) OR dynamic reference
- In ast-grep but NOT in tsc program → file excluded from compilation
- In tsc errors after target removal → confirmed active dependency

---

## STEP 3: Classify References

Categorize each confirmed reference:

| Category | Description | Example |
|----------|------------|---------|
| **import** | Direct import statement | `import { Tier } from 'lib/tiers'` |
| **re-export** | Re-exported from barrel | `export { Tier } from './tiers'` |
| **type** | Used as type annotation | `tier: MembershipTier` |
| **usage** | Called/accessed in logic | `if (tier === 'MASTER')` |
| **test** | In test files | `describe('MembershipTier', ...)` |
| **config** | In config/env/JSON | `"defaultTier": "JUN"` |
| **string-ref** | String that matches pattern | `console.log('MembershipTier updated')` |

Build **dependency graph** from import relationships:
1. **Leaf files** — import target but nothing imports them for this purpose
2. **Intermediate files** — both import and are imported
3. **Core files** — define/export the target system (root of the graph)

Order: leaf → intermediate → core (this is the migration order).

---

## STEP 4: Confidence Score + Manual Checklist

### Confidence Score (Grade + Ceiling)

Assign a grade based on which layers completed successfully:

| Grade | Condition | Ceiling |
|-------|-----------|---------|
| **High** | tsc + ast-grep + knip all passed | 95% |
| **Medium** | ast-grep passed but tsc had issues OR knip skipped | 85% |
| **Low** | ripgrep only (ast-grep and/or tsc unavailable) | 70% |

**Ceiling reductions (apply on top of grade):**
- Dynamic import patterns found → -5%
- DB/API string coupling detected → -5%
- Cross-repo consumers suspected → -15%
- Tool degraded (ast-grep skipped) → ceiling capped at 85%
- Tool degraded (knip skipped) → ceiling capped at 92%

**Cap at 95%.** Never claim 100% — dynamic references are always possible.

**Report as:** "Confidence: **High (92%)**" — grade first, then number. The grade is the signal; the number is supplementary.

### Manual Verification Checklist

Generate a checklist of things the scanner CANNOT verify:
```markdown
## Manual Verification Required
- [ ] Dynamic imports: [list files with import() calls]
- [ ] String interpolation: [list template literal usages]
- [ ] DB column references: [list Prisma schema fields, SQL queries]
- [ ] API endpoint strings: [list route handlers referencing target]
- [ ] Environment variables: [list .env entries]
- [ ] External consumers: [list known external repos/services]
```

---

## STEP 5: Escalation — ai-only-debugging Pipeline Tracing

**Trigger conditions:**
- rg finds a reference but ast-grep/tsc cannot confirm it
- Re-export chain is 3+ levels deep
- Type inference creates indirect references (e.g., generic type parameters)

**Escalation method:**
Apply ai-only-debugging's "pipeline comparison" pattern:
1. Start at the symbol's definition
2. Follow every export → import chain step by step
3. At each step, verify: is this a real dependency or just a naming coincidence?
4. Document the trace: `DefinitionFile:line → ExportFile:line → ImportFile:line → UsageFile:line`

**Output:** Append traced references to the reference map with category "traced" and HIGH confidence.

---

## STEP 6: Output Report

Save to `docs/reports/{topic}-scan-report.md`:

```markdown
# [Topic] — Exhaustive Scan Report

> Scanned on [date]
> Target: [symbol list]
> Confidence: [X]%

## Summary
- Total references: [N]
- By category: import [N], usage [N], type [N], re-export [N], test [N], config [N], string-ref [N]
- Dead code (excluded): [N] files, [N] exports
- Manual verification items: [N]

## Reference Map
| # | File | Line | Symbol | Category | Layer Found | Confidence |
|---|------|------|--------|----------|-------------|------------|

## Replacement Mapping (for /code-migration)
| Old Symbol | New Symbol | Mutation Policy |
|------------|-----------|----------------|
| [e.g., MembershipTier] | [e.g., Plan] | auto / manual / forbidden |

**Mutation Policy:**
- `auto` — safe for LLM to edit (import swaps, type renames)
- `manual` — requires human review (business logic changes)
- `forbidden` — do not touch (generated code, vendor, migrations)

## Barrier Flags (cannot be auto-migrated)
| File | Line | Pattern | Reason |
|------|------|---------|--------|
| [file] | [line] | dynamic import / string registry / reflection | [why] |

## Dependency Graph (leaf-first order)
### Tier 1 — Leaf files (migrate first)
### Tier 2 — Intermediate files
### Tier 3 — Core files (migrate last)

## Dead Code Candidates (knip — tagged, not excluded)
| File | Export | Status |
|------|--------|--------|

## Manual Verification Required
- [ ] [checklist items]

## Confidence Score: [X]%
| Factor | Score | Notes |
|--------|-------|-------|

## Scan Metadata
- Layers executed: [rg ✅, ast-grep ✅/⚠️, tsc ✅, knip ✅/⚠️]
- Escalation used: [yes/no]
- Total patterns searched: [N]
```

---

## Quality Checklist

### Must-pass
- [ ] All primary patterns searched across source + test + config + docs
- [ ] ast-grep OR tsc validated structural references (not rg-only)
- [ ] Dependency graph has leaf-first ordering
- [ ] Confidence score calculated with 4 factors
- [ ] Manual verification checklist generated
- [ ] Report saved to docs/reports/

### Should-pass
- [ ] Dead code pre-filtered with knip
- [ ] Re-export chains traced (if present)
- [ ] String-ref patterns checked in non-code files (JSON, SQL, env)
- [ ] Escalation to ai-only-debugging attempted (if ambiguous refs exist)

---

## Anti-Patterns

- **rg-only confidence**: ripgrep alone is ~70-80% complete. Never skip ast-grep/tsc layers.
- **Ignoring dead code**: Scanning dead code wastes migration effort. Always run knip first.
- **Trusting "zero results"**: Empty grep ≠ no references. Check re-exports, type inference, barrel files.
- **Comment/string false positives**: A match in a comment is not a dependency. ast-grep filters these.
- **Skipping non-code files**: DB migrations, JSON configs, .env files contain real references.
- **Claiming 100%**: Dynamic references exist. Cap confidence at 95%.
- **Scanning without a pattern list**: "Find everything related to billing" is too vague. Require specific symbols.

---

## Pipeline State Update

If `.claude/pipeline-state.md` exists, update it before concluding:

1. YAML frontmatter: set `delegated_to:` to empty, update `updated:` to today
2. Markdown body: add `scanner` to **Completed**, update **Artifacts** with scan report path, set **Recommended Next** to `/code-migration, /implementer`
