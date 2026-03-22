---
name: buildup-prompt-generator
description: Generate systematic investigation-to-fix prompts using claude_guide best practices. MUST trigger when the user says "claude_guide 폴더 내에 문서들 읽고 영어 프롬프트를 작성해서 나한테 줘" or any variation including "claude_guide 읽고 프롬프트", "영어 프롬프트 작성해서 한국어 번역본도", "프롬프트 짜줘", "buildup", "빌드업", "조사부터", "체계적으로". Also triggers on requests for structured bilingual (EN+KO) prompts for technical problems, bugs, performance issues, or pipeline fixes.
---

# Build-Up Prompt Generator

Generate structured, executable prompts that follow the **Build-Up Method**: a systematic cycle of `Investigate → Diagnose → Fix → Verify → Document` for each problem, ordered by dependency (foundation first).

## When to Use

- User says "claude_guide 폴더 내에 문서들 읽고 영어 프롬프트를 작성해서 나한테 줘 줄때 한국어 번역본도 같이 줘"
- User says "빌드업", "조사부터 시작", "프롬프트 짜줘", "체계적으로 해결"
- User identified a problem and wants a structured prompt document
- Multiple related problems exist and need prioritization

## MANDATORY First Step: Read claude_guide

**Before doing ANYTHING else**, read the relevant best practice documents from `claude_guide/`:

```
claude_guide/04_best_practices.md        — Claude Code best practices
claude_guide/19_rosmur_best_practices.md — Comprehensive workflow patterns
claude_guide/21_mastering_vibe_best_practices.md — Planning & execution patterns
```

Extract relevant patterns for the specific problem domain and incorporate them into the generated prompt. This ensures the output prompt follows proven engineering practices.

## Process

### 1. Gather Context

Before writing the prompt, collect:

```
- What is the system? (brief architecture)
- What are the symptoms? (error messages, metrics, user complaints)
- What monitoring data exists? (logs, metrics, dashboards)
- What has already been tried?
- What are the constraints? (don't change X, must stay on Y)
```

Use monitoring logs (`logs/*.jsonl`, error logs, metrics) as primary evidence source. Read relevant code files to understand current implementation.

### 2. Identify Problems

List all problems found. For each:
- Assign severity (critical / important / minor)
- Identify dependencies between problems (does fixing A help B?)
- Order by dependency: foundation problems first

### 3. Generate Build-Up Structure

For EACH problem, create a 5-step cycle:

```markdown
## Problem N: [Name]

### Step 1: INVESTIGATE
Specific files to read, logs to check, instrumentation to add.
List exact commands and code locations.

### Step 2: DIAGNOSE
Questions to answer with evidence.
"Based on investigation, answer: ..."

### Step 3: FIX
Possible fixes (conditional on diagnosis).
"If X → do Y. If Z → do W."

### Step 4: VERIFY
Exact metrics to check, monitoring duration, target values.
"Monitor logs/*.jsonl for 5+ minutes. STT avg should be < 2s."

### Step 5: DOCUMENT
Record root cause, fix applied, before/after metrics.
```

### 4. Add Execution Framework

Include:
- **Execution order** with dependency arrows
- **Before/after comparison table** with specific targets
- **Constraints** (what NOT to change)
- **Rules** (one problem at a time, evidence-based, verify before next)

### 5. Output Format

Always generate TWO files:
- `docs/{topic}-prompt.md` — English version
- `docs/{topic}-prompt-ko.md` — Korean translation

Both files must be complete and self-contained (not referencing each other).

## Template Structure

```markdown
# [Project]: [Goal Description]

## Context
- System architecture (brief)
- Current state with metrics
- Key insight (why this order)

## Methodology: Build-Up Approach
- 5-step cycle explanation
- Rules (one at a time, evidence-based, verify)

## Problem 1: [Foundation Problem]
### Step 1: INVESTIGATE
### Step 2: DIAGNOSE
### Step 3: FIX
### Step 4: VERIFY
### Step 5: DOCUMENT

## Problem 2: [Next Layer]
... (same structure)

## Execution Order
(dependency diagram)

## Verification Framework
| Metric | Before | Target |

## Constraints
```

## Quality Checklist

- [ ] Each INVESTIGATE step has specific file paths and commands
- [ ] Each DIAGNOSE step asks answerable questions with evidence criteria
- [ ] Each FIX step is conditional ("if X → do Y") not prescriptive
- [ ] Each VERIFY step has numeric targets and monitoring duration
- [ ] Problems ordered by dependency (foundation first)
- [ ] Constraints clearly stated (what not to change)
- [ ] Both English and Korean versions generated
- [ ] Monitoring data cited as evidence source
- [ ] Auto-restart mechanism noted (no manual restart)

## Anti-Patterns to Avoid

- **Prescriptive fixes without investigation**: Don't write "change X to Y" in the fix step. Write "IF diagnosis shows X, THEN change to Y."
- **Skipping verification**: Every fix MUST have a verify step with numeric targets.
- **Fixing multiple things at once**: One problem per cycle. Complete before moving to next.
- **Guessing root causes**: Diagnoses must cite log evidence or instrumentation data.
- **Vague investigation**: "Look at the code" is bad. "Read server/local.py:143-155, check the on_mic_chunk callback" is good.
