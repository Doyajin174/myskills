---
name: ai-only-debugging
description: >
  Use when debugging any bug — rendering, data pipeline, layout, API, state, async.
  AI leads with static code analysis, type tracing, git history, and test reproduction.
  Runtime observation is a structured escalation, not the starting point.
  Includes layout debugging protocol with arithmetic verification.
allowed-tools: Read, Glob, Grep, Edit, Write
license: MIT
metadata:
  author: portable
  version: "3.0"
  origin: AI-optimized debugging — static analysis first, runtime escalation second
---

# AI-First Debugging v3 — Code Analysis First, Runtime Escalation Second

## Philosophy

> **Human-optimized:** DevTools, console.log, screenshots, "what do you see?"
> **AI-optimized:** static tracing, type analysis, git history, test reproduction, arithmetic verification

AI can read every file, trace code paths, compute arithmetic, and cross-reference types at scale. Lead with these strengths. Escalate to runtime only when the bug class requires observation.

## Core Rule

> **Default: Debug by reading code, types, tests, and history.**
> **Never start with:** asking for console output, opening DevTools, requesting screenshots.
> **Escalate to runtime when:** static analysis has identified *what to observe*, not as a fishing expedition.

## Debugging Priority Stack

Follow this order. Each level is attempted before escalating to the next.

```
Level 1: TYPE ANALYSIS        — Check TypeScript errors, type narrowing, interface mismatches
Level 2: GIT HISTORY          — git blame / git log / git bisect to find when it broke
Level 3: CODE TRACING         — Trace value flow backwards from symptom to source
Level 4: TEST REPRODUCTION    — Write a failing test that reproduces the bug
Level 5: INSTRUMENTATION      — Add aiDbgLog points at gaps in the pipeline
Level 6: RUNTIME ESCALATION   — Request specific runtime data (with justification)
```

**Level 6 Escalation Conditions** (runtime is justified when):
- Race condition / timing-dependent behavior
- Third-party API returning unexpected data
- Environment-specific bug (Node version, OS, browser quirk)
- SSR/CSR hydration mismatch
- Database transaction isolation / lock contention
- Flaky test that passes locally, fails in CI

When escalating: specify *exactly* what to observe and where. "Run this test with AI_DEBUG=true and check the [CART-TOTAL] output" — not "can you check what's happening?"

---

## Part 1: Data Pipeline Debugging

### Step 1: Check Types First

Before tracing values, check if TypeScript already knows the answer:
- Are there compiler errors or warnings in the affected files?
- Does type narrowing reveal an impossible state?
- Are function signatures mismatched between caller and callee?
- Are optional properties accessed without null checks?

**EXIT:** If a type error explains the bug, fix it. No further tracing needed.

### Step 2: Check Git History

Is this a regression?
```
git log --oneline -20 -- path/to/affected/file.ts
git blame path/to/affected/file.ts  (around the buggy line)
```

If a recent change is suspicious, diff it against the working version. The diff IS the bug.

For hard-to-locate regressions: `git bisect` narrows to the exact commit.

**EXIT:** If the regression commit is found, the fix is usually reverting or correcting that change.

### Step 3: Identify the Pipeline

Map the data transformation chain:
```
Input (raw data / props / API response)
  → Transform 1 (calculation / mapping)
    → Transform 2 (scaling / conversion)
      → Output (rendered element / exported artifact)
```

### Step 4: Trace Backwards from Symptom

1. Start at the output (what's wrong on screen or in the response)
2. Trace backwards: what function produces this value?
3. What are that function's inputs? Where do they come from?
4. Continue until you reach the raw source data

At each step: **Can I determine the exact value transformation from code alone?**

### Step 5: Fill Gaps with aiDbgLog

If a transformation step is unclear from code:

```typescript
aiDbgLog('FEATURE-STAGE', {
  inputValue: someInput,
  calculatedResult: result,
  relevantConfig: config,
})
```

Tag convention: `FEATURE-STAGE` (e.g., `CART-CHECKOUT`, `IMAGE-RESIZE`, `PRICE-CALC`)

### Step 6: Compare Pipelines (when applicable)

When two code paths produce different results (preview vs production, SSR vs CSR, mobile vs desktop):
1. List both pipelines side by side
2. Compare the math/logic at each stage
3. The divergence point is the bug

### Step 7: Reproduce with a Failing Test

Before fixing, write a test that captures the bug:
```
test('cart total includes discount', () => {
  const result = calculateTotal(items, discount);
  expect(result).toBe(expectedValue);  // This should FAIL with the current bug
});
```

This serves as: (a) confirmation you understand the bug, (b) regression guard after fix.

---

## Part 2: Layout Debugging — Arithmetic Code Analysis

### Layout Step 1: Identify the Page Route

Locate the exact file from the user's description:
- Next.js App Router: `app/<route>/page.tsx`, trace `layout.tsx` chain
- Next.js Pages Router: `pages/<route>.tsx`, trace `_app.tsx` → `_document.tsx`
- Remix: `app/routes/<route>.tsx`, trace `root.tsx`
- Plain React: trace from `App.tsx` → Router → page

### Layout Step 2: Build the Layout Chain Table

Read every component from `<html>` to the problem area. For each node, extract:

| Property | What to Extract |
|----------|----------------|
| **width** | w-full, w-screen, w-[Npx], max-w-*, min-w-* |
| **height** | h-screen, h-[100dvh], h-full, min-h-0 |
| **overflow** | overflow-hidden, overflow-x-hidden, overflow-auto |
| **flex/grid** | flex, flex-col, flex-1, flex-shrink-0, grid-cols-*, minmax() |
| **position** | relative, absolute, fixed, sticky |
| **spacing** | p-*, m-*, px-*, gap-* |

```
LAYOUT CHAIN: /dashboard → page.tsx
──────────────────────────────────────
Node 1: <html>         width: 100%    overflow: visible
Node 2: <body>         min-h-screen   overflow: visible
Node 3: div.flex       h-screen       overflow: NOT SET (visible)
Node 4: aside.w-[260px] flex-shrink-0  FIXED — WARNING
Node 5: main.flex-1    min-w-0        overflow-y-auto  OK
──────────────────────────────────────
```

### Layout Step 3: Arithmetic Overflow Check

Test at **7 breakpoints** (mobile through desktop):

```
OVERFLOW CHECK:
  @ 375px (mobile):   Container: 375px  ...
  @ 390px (mobile):   Container: 390px  ...
  @ 768px (tablet):   Container: 768px  ...
  @ 1024px (laptop):  Container: 1024px ...
  @ 1280px (desktop): Container: 1280px ...
  @ 1440px (wide):    Container: 1440px ...
  @ 1920px (full HD): Container: 1920px ...
```

Always include: gap × (N-1) + padding × 2 in width calculations.

### Layout Step 4: Check Anti-Patterns

**A. Silent Clip** — `overflow-hidden` + child exceeds container → content invisibly cut
**B. Flex Rigidity** — `flex-shrink-0` + fixed width → never shrinks, pushes siblings off
**C. Viewport Escape** — `100vw` + scrollbar (17px on Windows) → horizontal scroll
**D. Accumulating Gaps** — gap + padding add "invisible" width not in calculations
**E. Nested min-width Escalation** — child `min-w-[400px]` overrides parent `min-w-0`
**F. Height Chain Break** — ancestor without explicit height breaks `h-full` chain
**G. Grid Track Overflow** — `minmax()` minimum exceeds available space
**H. Intrinsic Size** — img/video without explicit sizing uses natural dimensions
**I. Sticky/Fixed Containment** — `transform` or `contain` on ancestor breaks fixed positioning

### Layout Step 5: Fix Rules

1. **Fix ROOT CAUSE, not symptom.** Don't add `overflow-hidden` to mask overflow.
2. **Prefer responsive units** (%, flex-1, min-w-0) over fixed (px).
3. **Verify at all 7 breakpoints** after fix.
4. **Never add overflow-hidden to body/root layout.**

### Layout Step 6: Post-Fix Verification

Redo arithmetic at all breakpoints. Confirm margin > 0 at every size.

---

## The aiDbgLog System

Lightweight instrumentation gated behind environment variable.

```typescript
const AI_DEBUG_KEY = 'AI_DEBUG'
export const AI_DEBUG = typeof process !== 'undefined'
  ? process.env[AI_DEBUG_KEY] === 'true' : false

export function aiDbgLog(tag: string, data: Record<string, unknown>): void {
  if (!AI_DEBUG) return
  console.log(`[AI-DBG][${tag}]`, JSON.stringify(data))
}
```

| Framework | Env Variable |
|-----------|-------------|
| Next.js | `NEXT_PUBLIC_AI_DEBUG=true` |
| Vite | `VITE_AI_DEBUG=true` |
| Node.js | `AI_DEBUG=true` |

**If the project has existing observability** (OpenTelemetry, structured logging), read those first before adding aiDbgLog. Don't reinvent what already exists.

**Cleanup rule:** After bug is resolved, remove all aiDbgLog points added during debugging. They are temporary instrumentation, not permanent code.

---

## Large Codebase Strategy

When the project exceeds what fits in context (~100K+ lines):

1. **Start narrow:** Read the file containing the symptom, not the whole codebase
2. **Expand by imports:** Follow only the import chain relevant to the bug
3. **Use Grep strategically:** Search for function names, variable names, error messages
4. **Check tests first:** Test files often reveal expected behavior faster than source
5. **Read config/types:** `tsconfig.json`, type definition files, and config often explain constraints

**Don't:** Read all files hoping to understand the whole system.
**Do:** Build understanding incrementally, following the bug's value chain.

---

## Behavioral Guardrails

### Default Behavior (Levels 1-5)

| Instead of... | Do this |
|--------------|---------|
| "Can you paste the console output?" | Read the code that produces the value |
| "Can you send a screenshot?" | Build Layout Chain Table from code |
| "Let me check Chrome DevTools" | Trace the style/layout in code |
| "What does the API return?" | Read the API handler and types |

### Self-Check Before Escalating to Runtime

Before requesting ANY runtime information, confirm:
- [ ] Checked TypeScript errors in affected files?
- [ ] Checked git history for recent changes?
- [ ] Traced the value chain backwards from symptom?
- [ ] Written a failing test to reproduce?
- [ ] Added aiDbgLog at unclear transformation points?

If all 5 are done and the bug remains unclear → **escalation is justified.**
State what you've tried and what specific runtime data you need.

---

## Backend Debugging Appendix

The same philosophy applies to backend bugs with these adaptations:

| Frontend concept | Backend equivalent |
|-----------------|-------------------|
| Layout Chain Table | Request Flow Table (middleware → handler → service → repo → DB) |
| CSS arithmetic | Query plan analysis, N+1 detection |
| aiDbgLog | Structured logging / OTel spans |
| Breakpoint checks | Load scenarios (1 user, 10, 100, 1000) |

**Backend-specific escalation triggers:**
- Database transaction isolation / deadlock
- Race condition between concurrent requests
- External service timeout / retry behavior
- Queue/message ordering issues
- CI-only failures (environment difference)

---

## Integration with Other Skills

**Complements:**
- `systematic-debugging` — this skill provides the HOW; systematic-debugging provides the WHEN/WHERE
- `root-cause-tracing` — backward tracing done through code, not runtime
- `verification-before-completion` — final verification uses tests/build (runtime OK at this stage)

**Overrides:**
- Any debugging approach that starts with "open the browser" or "check the console"
