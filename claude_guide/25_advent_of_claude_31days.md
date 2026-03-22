# Advent of Claude: 31 Days of Claude Code

Source: https://adocomplete.com/advent-of-claude-2025/
Author: Ado Kukic
Published: January 1, 2026

---

# Advent of Claude: 31 Days of Claude Code

A comprehensive guide to Claude Code's most powerful features, from quick shortcuts to advanced agent patterns.

Guide

January 1, 2026 12 min read

### Contents

Throughout December, I shared one Claude Code tip per day on X/Twitter and LinkedIn. What started as a simple advent calendar became a map of the features that have fundamentally changed how I write software. This post compiles all 31 tips into a comprehensive guide, reorganized from beginner essentials to advanced patterns, and adds additional context that can't be covered in 280 characters.

Whether you're just getting started or looking to level up with Claude Code, there's something here for you.

---

## Getting Started

Before diving into features, set up Claude Code to understand your project.

### /init — Let Claude Onboard Itself Onto Your Project

Everybody needs onboarding docs. With `/init`, Claude writes its own.

Claude reads your codebase and generates a `CLAUDE.md` file with:

*   Build and test commands
*   Key directories and their purposes
*   Code conventions and patterns
*   Important architectural decisions

This is the first thing I run in any new project.

For larger projects, you can also create a `.claude/rules/` directory for modular, topic-specific instructions. Each `.md` file in this directory is automatically loaded as project memory alongside your `CLAUDE.md`. You can even use YAML frontmatter to apply rules conditionally based on file paths:

```
---
paths: src/api/**/*.ts
---
# API Development Rules
- All API endpoints must include input validation
```

Think of `CLAUDE.md` as your general project guide, and `.claude/rules/` as focused supplements for testing, security, API design, or anything else that deserves its own file.

### Memory Updates

Want to save something to Claude's memory without manually editing `CLAUDE.md`? In the past, you were able to start your prompt with a `#` and whatever came after, Claude would append to the end of your `Claude.md` file. As of Claude Code 2.0.70, this is no longer the case, and now you can just tell Claude to update the `Claude.md` file for you.

Just tell Claude to remember it:

> "Update Claude.md: always use bun instead of npm in this project"

Keep coding without breaking your flow.

### @ Mentions — Add Context Instantly

`@` mentions are the fastest way to give Claude context:

*   `@src/auth.ts` — Add files to context instantly
*   `@src/components/` — Reference entire directories
*   `@mcp:github` — Enable/disable MCP servers

File suggestions are ~3x faster in git repositories and support fuzzy matching. `@` is the fastest path from "I need context" to "Claude has context."

---

## Essential Shortcuts

These are the commands you'll use constantly. Commit them to muscle memory.

### The ! Prefix — Run Bash Instantly

Don't waste tokens asking "can you run git status?"

Just type `!` followed by your bash command:

```
! git status
! npm test
! ls -la src/
```

The `!` prefix executes bash instantly and injects the output into context. No model processing. No delay. No wasted tokens. No need for multiple terminal windows.

This seems small until you realize you're using it fifty times a day.

### Double Esc to Rewind

Want to try a "what if we…" approach without committing to it?

Go wild. If it gets weird, press `Esc` twice to jump back to a clean checkpoint.

You can rewind the conversation, the code changes, or both. One thing to note here is that Bash commands run cannot be undone.

### Ctrl + R — Reverse Search

Your past prompts are searchable:

| Key | Action |
|-----|--------|
| `Ctrl+R` | Start reverse search |
| `Ctrl+R` (again) | Cycle through matches |
| `Enter` | Run it |
| `Tab` | Edit first |

Don't retype. Recall. This works seamlessly with slash commands too.

### Prompt Stashing

It's like `git stash`, but for your prompt.

`Ctrl+S` saves your draft. Send something else. Your draft auto-restores when you're ready.

No more copying to a scratchpad. No more losing your train of thought mid-conversation.

### Prompt Suggestions

Claude can predict what you'll ask next.

Finish a task, and sometimes you'll see a grayed-out follow-up suggestion appear:

| Key | Action |
|-----|--------|
| `Tab` | Accept and edit |
| `Enter` | Accept and run immediately |

Tab used to autocomplete your code. Now it autocompletes your workflow. Toggle this feature via `/config`.

---

## Session Management

Claude Code is a persistent development environment and optimizing it to your workflow will allow you to do so much more.

### Continue Where You Left Off

Accidentally closed your terminal? Laptop died mid-task? No problem.

```
claude --continue    # Picks up your last conversation instantly
claude --resume      # Shows a picker to choose any past session
```

Context preserved. Momentum restored. Your work is never lost. You can also customize how long sessions are preserved via the `cleanupPeriodDays` setting. By default it is 30 days, but you can set it as long as you want, or even 0 if you don't want to preserve your Claude Code sessions.

### Named Sessions

Your git branches have names. Your Claude sessions should too.

```
/rename api-migration       # Names your current session
/resume api-migration       # Resumes by name
claude --resume api-migration  # Works from the command line too
```

The `/resume` screen groups forked sessions and supports keyboard shortcuts: `P` for preview, `R` for rename.

### Claude Code Remote

Start a task on the web, finish it in your terminal:

```
# On claude.ai/code, start a Claude Code session
# It runs in the background while you're away

# Later, from your terminal:
claude --teleport session_abc123
```

This pulls and resumes the session locally. Claude at home and on the go. Also works via the Claude mobile app for iOS and Android, as well as the Claude Desktop app.

### /export — Get Receipts

Sometimes you need a record of what happened.

`/export` dumps your entire conversation to markdown:

*   Every prompt you sent
*   Every response Claude gave
*   Every tool call and its output

Perfect for documentation, training, or proving to your past self that yes, you did already try that approach.

---

## Productivity Features

These features remove friction and help you move faster.

### Vim Mode

Tired of reaching for the mouse to edit your prompts?

Type `/vim` and unlock full vim-style editing:

| Command | Action |
|---------|--------|
| `h j k l` | Navigate |
| `ciw` | Change word |
| `dd` | Delete line |
| `w b` | Jump by word |
| `A` | Append at end of line |

Edit prompts at the speed of thought. Your muscle memory from decades of vim use finally pays off in an AI tool. And it's never been easier to exit vim with Claude Code, just type `/vim` again.

### /statusline — Customize Your View

Claude Code has a customizable status bar at the bottom of your terminal.

`/statusline` lets you configure what appears there:

*   Git branch and status
*   Current model
*   Token usage
*   Context window percentage
*   Custom scripts

Information at a glance means fewer interruptions to check on things manually.

### /context — X-Ray Vision for Tokens

Ever wonder what's eating your context window?

Type `/context` to see exactly what's consuming your tokens:

*   System prompt size
*   MCP server prompts
*   Memory files (CLAUDE.md)
*   Loaded skills and agents
*   Conversation history

When your context starts filling up, this is how you figure out where it's going.

### /stats — Your Usage Dashboard

```
2023: "Check out my GitHub contribution graph"
2025: "Check out my Claude Code stats"
```

Type `/stats` to see your usage patterns, favorite models, usage streaks, and more.

Orange is the new green.

### /usage — Know Your Limits

"Am I about to hit my limit?"

```
/usage        → Check your current usage with visual progress bars
/extra-usage  → Purchase additional capacity
```

Know your limits. Then exceed them.

---

## Thinking & Planning

Control how Claude approaches problems.

### Ultrathink

Trigger extended thinking on demand with a single keyword:

```
> ultrathink: design a caching layer for our API
```

When you include `ultrathink` in your prompt, Claude allocates up to 32k tokens for internal reasoning before responding. For complex architectural decisions or tricky debugging sessions, this can be the difference between a surface-level answer and genuine insight.

_In the past you were able to specify think, think harder, and ultrathink to allocate different amounts of tokens for thinking, but we've since simplified this into a single thinking budget. The ultrathink keyword only works when MAX_THINKING_TOKENS is not set. When MAX_THINKING_TOKENS is configured, it takes priority and controls the thinking budget for all requests._

### Plan Mode

Clear the fog of war first.

Press `Shift+Tab` twice to enter Plan mode. Claude can:

*   Read and search your codebase
*   Analyze architecture
*   Explore dependencies
*   Draft implementation plans

But it won't edit anything until you approve the plan. Think twice. Execute once.

I default to plan mode 90% of the time. The latest version lets you provide feedback when rejecting plans, making iteration faster.

### Extended Thinking (API)

When using the Claude API directly, you can enable extended thinking to see Claude's step-by-step reasoning:

```
thinking: { type: "enabled", budget_tokens: 5000 }
```

Claude shows its reasoning in thinking blocks before responding. Useful for debugging complex logic or understanding Claude's decisions.

---

## Permissions & Safety

Power without control is just chaos. These features let you set boundaries.

### Sandbox Mode

```
"Can I run npm install?" [Allow]
"Can I run npm test?" [Allow]
"Can I cat this file?" [Allow]
"Can I pet that dawg?" [Allow]
×100
```

`/sandbox` lets you define boundaries once. Claude works freely inside them.

You get speed with actual security. The latest version supports wildcard syntax like `mcp__server__*` for allowing entire MCP servers.

### YOLO Mode

Tired of Claude Code asking permission for everything?

```
claude --dangerously-skip-permissions
```

This flag says yes to everything. It has "danger" in the name for a reason—use it wisely, ideally in isolated environments or for trusted operations.

### Hooks

Hooks are shell commands that run at predetermined lifecycle events:

*   `PreToolUse` / `PostToolUse`: Before and after tool execution
*   `PermissionRequest`: Automatically approve or deny permission requests
*   `Notification`: React to Claude's notifications
*   `SubagentStart` / `SubagentStop`: Monitor agent spawning

Configure them via `/hooks` or in `.claude/settings.json`.

Use hooks to block dangerous commands, send notifications, log actions, or integrate with external systems. It's deterministic control over probabilistic AI.

---

## Automation & CI/CD

Claude Code works beyond interactive sessions.

### Headless Mode

You can use Claude Code as a powerful CLI tool for scripts and automation:

```
claude -p "Fix the lint errors"
claude -p "List all the functions" | grep "async"
git diff | claude -p "Explain these changes"
echo "Review this PR" | claude -p --json
```

AI in your pipeline. The `-p` flag runs Claude non-interactively and outputs directly to stdout.

### Commands — Reusable Prompts

Save any prompt as a reusable command:

Create a markdown file, and it becomes a slash command that can additionally accept arguments:

```
/daily-standup              → Run your morning routine prompt
/explain $ARGUMENTS         → /explain src/auth.ts
```

Stop repeating yourself. Your best prompts deserve to be reusable.

---

## Browser Integration

Claude Code can see and interact with your browser.

### Claude Code + Chrome

Claude can now directly interact with Chrome:

*   Navigate pages
*   Click buttons and fill forms
*   Read console errors
*   Inspect the DOM
*   Take screenshots

"Fix the bug and verify it works" is now one prompt. Install the Chrome extension from [claude.ai/chrome](https://claude.ai/chrome).

---

## Advanced: Agents & Extensibility

This is where Claude Code becomes truly powerful.

### Subagents

Santa doesn't wrap every gift himself. He has elves.

Subagents are Claude's elves. Each one:

*   Gets its own 200k context window
*   Performs specialized tasks
*   Runs in parallel with others
*   Merges output back to the main agent

Delegate like Santa. Subagents can run in the background while you continue working, and they have full access to MCP tools.

### Agent Skills

Skills are folders of instructions, scripts, and resources that teach Claude specialized tasks.

They're packaged once and usable everywhere. And since [Agent Skills](https://agentskills.io) are now an open standard, they work across any tool that supports them.

Think of skills as giving Claude expertise on demand. Whether that's your company's specific deployment process, a testing methodology, or a documentation standard.

### Plugins

Remember when sharing your Claude Code setup meant sending 47 files across 12 directories?

That era is over.

```
/plugin install my-setup
```

Plugins bundle commands, agents, skills, hooks, and MCP servers into one package. Discover new workflows via the marketplace, which includes search filtering for easier discovery.

### Language Server Protocol (LSP) Integration

Language Server Protocol (LSP) support gives Claude IDE-level code intelligence:

LSP integration provides:

*   **Instant diagnostics**: Claude sees errors and warnings immediately after each edit
*   **Code navigation**: go to definition, find references, and hover information
*   **Language awareness**: type information and documentation for code symbols

Claude Code now understands your code the way your IDE does.

### Claude Agent SDK

The same agent loop, tools, and context management that power Claude Code are now available as an SDK. Build agents that work like Claude Code in as little as 10 lines of code:

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const msg of query({
  prompt: "Generate markdown API docs for all public functions in src/",
  options: {
    allowedTools: ["Read", "Write", "Glob"],
    permissionMode: "acceptEdits"
  }
})) {
  if (msg.type === 'result') console.log("Docs generated:", msg.result);
}
```

This is just the beginning.

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `!command` | Execute bash immediately |
| `Esc Esc` | Rewind conversation/code |
| `Ctrl+R` | Reverse search history |
| `Ctrl+S` | Stash current prompt |
| `Shift+Tab` (×2) | Toggle plan mode |
| `Alt+P` / `Option+P` | Switch model |
| `Ctrl+O` | Toggle verbose mode |
| `Tab` / `Enter` | Accept prompt suggestion |

### Essential Commands

| Command | Purpose |
|---------|---------|
| `/init` | Generate CLAUDE.md for your project |
| `/context` | View token consumption |
| `/stats` | View your usage statistics |
| `/usage` | Check rate limits |
| `/vim` | Enable vim mode |
| `/config` | Open configuration |
| `/hooks` | Configure lifecycle hooks |
| `/sandbox` | Set permission boundaries |
| `/export` | Export conversation to markdown |
| `/resume` | Resume a past session |
| `/rename` | Name current session |
| `/theme` | Open theme picker |
| `/terminal-setup` | Configure terminal integration |

### CLI Flags

| Flag | Purpose |
|------|---------|
| `-p "prompt"` | Headless/print mode |
| `--continue` | Resume last session |
| `--resume` | Pick a session to resume |
| `--resume name` | Resume session by name |
| `--teleport id` | Resume a web session |
| `--dangerously-skip-permissions` | YOLO mode |

---

## Closing Thoughts

When I started this advent calendar, I thought I was just sharing tips. But looking back at these 31 days, I see something more: a philosophy of human-AI collaboration.

The best features in Claude Code are about giving you control. Plan mode. Agent Skills. Hooks. Sandbox boundaries. Session management. These are tools for working _with_ AI, not surrendering to it.

The developers who get the most out of Claude Code aren't the ones who type "do everything for me." They're the ones who've learned when to use Plan mode, how to structure their prompts, when to invoke ultrathink, and how to set up hooks that catch mistakes before they happen.

AI is a lever. These features help you find the right grip.

Here's to 2026.

---

_Have a favorite Claude Code feature I missed? Found an error in this guide or have a suggestion? Let me know on [Twitter](https://twitter.com/adocomplete) or open an issue on the [Claude Code repository](https://github.com/anthropics/claude-code)._

Written by Ado Kukic — Building software for 20+ years and helping others do the same. Previously led developer relations at Auth0, MongoDB, DigitalOcean, and Sourcegraph. Currently at Anthropic.

- Twitter: https://twitter.com/adocomplete
- GitHub: https://github.com/adocomplete
- YouTube: https://youtube.com/@ado
