---
name: design-system
description: Build UI with a systematic design system pipeline — tokens, primitives, components, patterns, pages. Use when building any web interface, dashboard, or app that needs consistent, maintainable design. Enforces "no magic numbers, no eye-balling, no copy-paste" discipline. Triggers on UI/frontend work, component libraries, design tokens, style systems, or when user says "디자인 시스템", "체계적으로 만들어".
---

# Design System Pipeline v2

Build UI through a reproducible engineering pipeline, not artistic intuition.

**Core principle:** "값을 직접 쓰지 말고 이름을 쓴다" — Never use raw values. Use named tokens.

**TL;DR — 5 Rules:**
1. Tokens not values — every spacing, color, font is a named variable
2. Semantic not primitive — components use `--background`, never `--gray-50`
3. Every component = Variant × State × Size
4. Patterns compose components — no new CSS at pattern/page level
5. Change the system, not the instance — no inline overrides

**Announce at start:** "I'm using the design-system skill to build this with tokens → primitives → components → patterns → pages."

## Step 0 — Project Context Detection

Before applying defaults, check the existing project:

1. Check for existing token definitions (`tailwind.config`, CSS custom property files, theme files)
2. Check for existing component libraries (shadcn/ui, MUI, Chakra, Radix)
3. If found → **adapt the pipeline to extend/integrate**, not replace
4. If not found → proceed with defaults below

**Token values below are defaults.** If the user prompt provides a specific design spec, brand guide, or existing config — override values but keep the structure.

## Pipeline Overview

```
Phase 1: FOUNDATION       Phase 2: ASSEMBLY         Phase 3: GOVERNANCE
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ 1. Design Tokens   │   │ 5. Patterns        │   │ 8. Maintenance     │
│ 2. Primitives      │──→│ 6. Layouts         │──→│    & Extension     │
│ 3. Style Recipes   │   │ 7. Pages           │   │                    │
│ 4. Components      │   │                    │   │                    │
└────────────────────┘   └────────────────────┘   └────────────────────┘
```

## Output Format

Determine the CSS approach before writing any code:
- **If Tailwind is configured**: utility-first, extend config with tokens
- **If React without Tailwind**: CSS Modules with token references
- **If vanilla HTML**: BEM naming with CSS custom properties
- **If styled-components/CSS-in-JS**: token constants exported from theme file

Default if no framework detected: CSS custom properties + BEM naming.

---

## Phase 1: FOUNDATION

### Step 1 — Design Tokens

Tokens are the single source of truth. **Define ALL of these before writing ANY component code.**

#### Spacing (4px base grid)
```css
--space-1: 4px;    --space-2: 8px;    --space-3: 12px;
--space-4: 16px;   --space-5: 20px;   --space-6: 24px;
--space-8: 32px;   --space-10: 40px;  --space-12: 48px;
--space-16: 64px;  --space-20: 80px;  --space-24: 96px;
```

#### Typography (role-based, 1.2 Minor Third scale for app UI)
```css
/* Scale: 1.2 Minor Third — use 1.25 Major Third for marketing/editorial */
--text-display: 2.074rem;   /* hero headlines */
--text-h1: 1.728rem;        /* page titles */
--text-h2: 1.44rem;         /* section headers */
--text-h3: 1.2rem;          /* subsection headers */
--text-body: 1rem;          /* 16px base */
--text-small: 0.833rem;     /* captions, metadata */
--text-xs: 0.694rem;        /* badges, labels */

--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;

--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

--font-sans: system-ui, sans-serif;    /* body — override per project */
--font-display: serif;                  /* headlines — override per project */
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

#### Color (shadcn/Radix convention — semantic naming)
```css
/* Primitive palette — never reference these directly in components */
--gray-50 through --gray-950
--blue-50 through --blue-950 /* etc. */

/* Semantic tokens — the ONLY colors components may use */
--background: var(--gray-50);
--foreground: var(--gray-950);
--surface: var(--white);
--surface-foreground: var(--gray-900);

--primary: var(--blue-600);
--primary-foreground: var(--white);
--secondary: var(--gray-100);
--secondary-foreground: var(--gray-900);

--muted: var(--gray-100);
--muted-foreground: var(--gray-500);
--accent: var(--blue-100);
--accent-foreground: var(--blue-900);

--destructive: var(--red-600);
--destructive-foreground: var(--white);
--success: var(--green-600);
--warning: var(--amber-600);

--border: var(--gray-200);
--input: var(--gray-200);
--ring: var(--blue-500);
```
Dark mode = swap semantic values. Components never change.

#### Radius, Shadow, Border
```css
--radius-sm: 4px;   --radius-md: 8px;   --radius-lg: 12px;   --radius-full: 9999px;

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

--border-thin: 1px;
--border-medium: 2px;
```

#### Z-Index (layering scale)
```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 300;
--z-toast: 400;
--z-tooltip: 500;
```

#### Opacity
```css
--opacity-disabled: 0.5;
--opacity-muted: 0.7;
--opacity-overlay: 0.6;
```

#### Icon Sizing (aligned to spacing grid)
```css
--icon-xs: 12px;   --icon-sm: 16px;   --icon-md: 20px;   --icon-lg: 24px;   --icon-xl: 32px;
--icon-stroke: 1.5px;   /* default stroke width */
```

#### Motion
```css
--duration-instant: 0ms;   /* also used for prefers-reduced-motion */
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);   /* general transitions */
--ease-enter: cubic-bezier(0, 0, 0.2, 1);          /* elements appearing */
--ease-exit: cubic-bezier(0.4, 0, 1, 1);           /* elements leaving */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* playful micro-interactions */
```

#### Breakpoints & Responsive
```css
--bp-sm: 640px;   --bp-md: 768px;   --bp-lg: 1024px;   --bp-xl: 1280px;
```

**Responsive rules (mobile-first):**
- Build mobile layout first, add complexity at larger breakpoints
- HStack → VStack collapse below `--bp-md`
- Sidebar hidden below `--bp-lg`, toggle via hamburger
- Touch targets stay >= 44px at all sizes
- Typography tokens stay fixed — layout absorbs the adaptation

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: var(--duration-instant) !important;
    animation-duration: var(--duration-instant) !important;
  }
}
```

**EXIT CHECK:** No raw hex, px, ms, or z-index values exist outside token definitions.

---

### Step 2 — Primitives

Low-level building blocks that all components inherit from. These prevent duplication at the component level.

```
Box       — base container with padding/radius/shadow tokens
Text      — typography with role-based sizing + color
Heading   — Text variant for headings (h1-h6 mapping)
Surface   — elevated container (card-like background + shadow)
Stack     — flex container with gap tokens (VStack / HStack)
Icon      — sized wrapper using icon tokens
Divider   — border-based separator
```

Every component is built FROM these primitives. If you're writing `display: flex` or `font-size` directly in a component — it should be inherited from Stack or Text instead.

**EXIT CHECK:** Primitives exist and use only tokens. No component duplicates primitive logic.

---

### Step 3 — Style Recipes

Connect tokens + primitives into reusable style patterns. Component-level token aliases live here.

```css
/* Button recipe — component-level aliases referencing semantic tokens */
--button-bg: var(--primary);
--button-fg: var(--primary-foreground);
--button-radius: var(--radius-md);
--button-height-sm: 32px;
--button-height-md: 40px;
--button-height-lg: 48px;

.btn {
  background: var(--button-bg);
  color: var(--button-fg);
  border-radius: var(--button-radius);
  padding: 0 var(--space-4);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  border: var(--border-thin) solid transparent;
  transition: all var(--duration-fast) var(--ease-standard);
  cursor: pointer;
}
.btn:hover { opacity: 0.9; box-shadow: var(--shadow-sm); }
.btn:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.btn:disabled { opacity: var(--opacity-disabled); cursor: not-allowed; }

/* Variants override component-level aliases */
.btn--secondary { --button-bg: var(--secondary); --button-fg: var(--secondary-foreground); }
.btn--ghost { --button-bg: transparent; --button-fg: var(--foreground); }
.btn--destructive { --button-bg: var(--destructive); --button-fg: var(--destructive-foreground); }
```

This aliasing pattern means you can retheme a component by changing its aliases, without touching the CSS rules.

**EXIT CHECK:** No raw hex/px in style recipes. Every recipe uses token references.

---

### Step 4 — Components

Every component MUST define:

| Dimension | Required Values |
|-----------|----------------|
| **Variant** | primary, secondary, ghost, destructive (minimum) |
| **State** | default, hover, active, focus-visible, disabled, loading |
| **Size** | sm, md, lg |

```
Component = Variant × State × Size
```

**Composition for complex components:**
```html
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer><Button variant="primary">Action</Button></Card.Footer>
</Card>
```

**Minimum component set:**
- Button (primary / secondary / ghost / destructive)
- Input (text / select / checkbox / radio)
- Card (Header / Body / Footer)
- Badge (status / count)
- Modal (overlay at `--z-modal`, `--opacity-overlay`)
- Toast / Alert (at `--z-toast`)

**Accessibility per component:**
- [ ] `focus-visible` state defined
- [ ] Color contrast >= 4.5:1 (text) / 3:1 (large text, UI elements)
- [ ] Interactive elements >= 44x44px touch target
- [ ] ARIA labels where semantic HTML is insufficient
- [ ] Icons are decorative (`aria-hidden`) or semantic (`aria-label`)

**EXIT CHECK:** Every component has variant matrix, all states handled, no raw values.

---

## Phase 2: ASSEMBLY

### Step 5 — Patterns

Reusable assemblies of components.

```
Form Pattern          Card List           Navigation
┌─────────────┐      ┌─────────────┐    ┌─────────────────┐
│ Label        │      │ Card        │    │ Logo  Nav  User │
│ Input        │      │ Card        │    └─────────────────┘
│ Helper text  │      │ Card        │
│ [Submit]     │      │ [Load more] │
└─────────────┘      └─────────────┘
```

Rule: Patterns are ONLY composed from existing components + primitives. If you need something new, go back to Step 4.

**EXIT CHECK:** No new CSS classes at pattern level. Patterns compose, not create.

### Step 6 — Layout System

Stack-based. No absolute positioning unless truly necessary.

**3 rules:**
1. **Direction**: VStack or HStack (using Stack primitive)
2. **Gap**: Only token values
3. **Padding**: Container padding = `--space-4` or `--space-6`

```css
.container { max-width: var(--bp-lg); margin: 0 auto; padding: 0 var(--space-4); }
```

**Responsive shifts:**
- 2-col → 1-col below `--bp-md`
- Sidebar collapses below `--bp-lg`
- Grid gaps shrink: `--space-6` → `--space-4` on mobile

**EXIT CHECK:** No magic margin/padding values. All gaps are tokens.

### Step 7 — Page Assembly

Pages compose patterns + layouts. **No new visual invention here.**

```
Page = Layout(
  Header: NavPattern,
  Sidebar: MenuPattern,
  Content: [CardListPattern, FormPattern],
  Footer: FooterPattern,
)
```

Rule: Writing new CSS at page level = something missing from your library. Go back and add it.

**EXIT CHECK:** Zero page-scoped styles. Everything traces back to components/patterns.

---

## Phase 3: GOVERNANCE

### Step 8 — Maintenance Rules

**Rule 1: No Duplication**
Two similar buttons = a missing variant. Add the variant.

**Rule 2: No Exceptions**
"This one needs to be different" = system collapse. It's a new variant or it's wrong.

**Rule 3: Change the System, Not the Instance**
Never override inline. Change the component/recipe definition.

---

## Final Verification Checklist

Before delivering ANY UI work:

- [ ] All spacing uses tokens — no raw px outside definitions
- [ ] All colors use semantic tokens — no primitives in components
- [ ] All typography uses role names — no raw font-size
- [ ] Every component has variant × state × size matrix
- [ ] focus-visible on all interactive elements
- [ ] `prefers-reduced-motion` respected
- [ ] Patterns composed from components only
- [ ] Layouts use stack + gap tokens
- [ ] No inline style overrides
- [ ] Dark mode works by swapping semantic tokens
- [ ] Z-index uses layer tokens, not arbitrary numbers
- [ ] Icons use size tokens and have accessibility attributes

## Code ↔ Design Mapping

| Design Concept | Code Implementation |
|---------------|-------------------|
| Token | CSS custom property or Tailwind config value |
| Primitive | Base element (Box, Text, Stack, Surface) |
| Recipe | Component-level token aliases + style rules |
| Component | Reusable element with variant/state/size API |
| Pattern | Template composing multiple components |
| Layout | Flex/Grid with token-based gap/padding |

## When NOT to Use

- Quick prototype / throwaway demo
- Project with established design system — follow theirs
- Single static page with no reuse

## When to ALWAYS Use

- Dashboard or multi-page app
- Component library or design system
- Any UI that will be maintained or extended
- Team projects where consistency matters
