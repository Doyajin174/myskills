# I've Organised the Claude Code Commands, Including Some Hidden Ones

*By 灯里/iku on DEV Community*

Greetings from the island nation of Japan.

In an era where we outsource our cognitive heavy lifting to silicon, keeping up with the relentless updates of Claude Code feels remarkably like trying to sip from a firehose while apologising for the splashing. We live in a world where "staying current" has a half-life shorter than a cup of artisanal matcha, and frankly, Anthropic's pace of shipping features—some whispered in the dark corners of Twitter, others tucked away like Easter eggs for the desperate—is enough to make any developer consider a quiet life of organic rice farming.

This article is my personal attempt to organize the digital clutter before I lose the thread entirely; a curated map of the essential commands, the "agentic" chaos of sub-tasks, and the hidden gems that the official documentation forgot to highlight. Think of it as a survival guide for those of us who are tired of being roasted by our own usage reports. By the end of this read, you'll hopefully navigate these AI waters with a bit more grace, or at least learn how to use /rewind to erase the evidence of your 3:00 AM coding hallucinations.

## Introduction

Claude Code has quite a few features not covered in the official documentation, plus commands you'd never use unless someone told you about them.
There's honestly just too much — keeping up with the official docs is a real struggle, and lately I've been drowning in it all.

This article compiles everything from basic commands to recently added features and tips for running Agents, all gathered from hands-on use.
I needed to organize this for myself… I was losing track of everything.

And even so, I'm sure I've missed things — just keeping up with Claude, or rather Anthropic, is a full-time job…

I started out adding screenshots for everything, but there were just too many, so please run any commands you want to try in your own Claude. (Sorry for being lazy.)

> The information in this article is current as of February 2026.
> Claude Code is under active development, so please check the official documentation for the latest information.
> Also, beyond the official docs, the dev team will casually drop "oh yeah, that exists" or ship things without mentioning them in the release notes, so I highly recommend following them on Twitter. Seriously.

## 15 Essential Commands

Here's a list of commonly used commands. Some are absolute basics, I know.

| Command | Description | Usage Example | Tips / Best Practices / Notes |
|---------|-------------|---------------|-------------------------------|
| /rewind | Rewind conversation or code changes | Esc+Esc to show menu. Choose to rewind code only or conversation only | Auto-checkpoints (saved on every prompt) make this great for experimental edits. Saves tokens in long sessions. Beginners should use "rewind code only" liberally for safe experimentation |
| /insights | Generate an HTML report analyzing your usage patterns | /insights saves report to ~/.claude/usage-data/report.html | Recent feature that analyzes your coding habits in almost roast-level detail. The report suggests Skills and Hooks to optimize your workflow. Run monthly. This one is seriously amazing. You can see exactly how to improve based on your development style. |
| /help | Show list of available commands | /help | Essential for beginners. A starting point for discovering hidden features. Fair warning — the amount of info it dumps on you is overwhelming. It really hits you with a wall of text. |
| /context | Display context usage (token consumption visualization) | /context | Prevents token overflow in long conversations. Combine with /compact to keep output short. I tend to throw a lot of context at it, so I'm trying to use it bit by bit to find the sweet spot between the AI and me (the human) |
| /compact | Switch responses to concise mode | /compact or /compact focus on errors | Saves tokens. Specifying error focus improves debugging efficiency |
| /init | Initialize a new project (creates CLAUDE.md, etc.) | /init | Use at project start. Combine with custom templates |
| /usage | Show plan usage and rate limit status | /usage | For subscription plan users. Monitor limits on free plan. Though I don't see many people using the free plan |
| /clear | Clear conversation | /clear | Reset context for new tasks. I use this fairly often with a "let me just clear this real quick" |
| /agents | Sub-agent management | /agents | Parallel processing for complex tasks. The hot topic right now. Burned through my tokens. Still feels like a luxury feature at this point |
| /install-github-app | Install GitHub App (automate PR reviews) | /install-github-app | Integrate into CI/CD workflows. Boost productivity with automated PR comments. I recently set this up and have only tried it on private repos, but it looks promising. Haven't tried it for company use yet — feels like it might strip away some of the human touch |
| /cost | Show token usage statistics | /cost | Track costs per session. /usage is for your overall plan, while this is per-session. Claude tends to be a big eater compared to others because she's smart, so I keep an eye on this |
| /export | Export current conversation to file or clipboard | /export conversation.md | For saving and sharing useful exchanges. Not used often, but good to know |
| /review | Request code review | /review | For when I'm paranoid about whether my code is garbage. Self-review before PRs. I'm anxious by nature so I do this a lot. Lately I've been considering having another model review too, while still having Claude Code review as well |
| /pr_comments | Display PR comments | /pr_comments | Requires GitHub integration. For checking comments. As I wrote in my previous article, GitHub and I are basically inseparable at this point |
| /doctor | Environment diagnostics (detect dependency and config issues) | /doctor | Same as a human health checkup. First stop for troubleshooting |

## Notable Features

### /rewind - Time Travel Debugging

/rewind was recently enhanced to allow rewinding conversation and code separately.
I tend to say unnecessary things that make sessions drag on, so this really helps. Sorry for always being a burden, Claude.

Key features:

- Auto-checkpoints (automatically saved on every prompt)
- Esc+Esc to show the menu
- Choose to rewind code only / conversation only

Use case:

```
# Try an experimental refactoring
→ Didn't work out
→ Esc+Esc → "Rewind code only"
→ Code reverts while conversation history is preserved
```

Tips:

- Use with parallel sessions (multiple terminals) for versioning
- Also effective for saving tokens in long sessions (personally very grateful for this)

Reference:

- Checkpointing Official Documentation

### /insights - Analyze Your Coding Habits

Reads your past month of usage history and compiles it into an HTML report.
Incredibly detailed. I can't share mine due to private reasons and too many accidental reveals, but please just try it once.
"Let's build the ultimate Claude environment together" — you'll feel that warm fuzzy feeling, while also being slightly terrified by how good this thing is.

What it generates:

- Command usage frequency
- Common patterns
- Custom command recommendations
- Skills suggestions

Usage:

```
/insights
# Output to ~/.claude/usage-data/report.html
```

Tips:

- Run monthly to review your workflow
- The report suggests Skills and Hooks
- Analyzes your coding habits in almost roast-level detail

> For a deeper look at how it works, this article is a great reference.
> It's in English and an excellent summary.
> Deep Dive: How Claude Code's /insights Command Works

## Hidden Commands & Handy Features

### Plan Mode (Shift+Tab) - Improve Success Rates on Large Tasks

Instead of jumping straight into writing code, you can have Claude analyze your codebase in read-only mode first, then decide on an implementation approach.
This is considered fairly basic, but I'm including it anyway. "Just plan first" — even the official team says so.
I personally want to make this a habit, and being the cautious worrier I am, I tend to use Plan Mode quite a lot.

How to activate:

- Press Shift+Tab to cycle modes (Normal → Auto-Accept → Plan)
- Or instruct: "Let's plan this first."
- You can also use the /plan command directly

> **Windows note:** Since Claude Code v2.1.3, there's a reported bug where Shift+Tab doesn't show Plan Mode on Windows (Issue #17344). Use the /plan command as a workaround. Or just tell Claude Code "let's plan."

Use case:

```
# Before a major refactoring or architecture change
Switch to Plan Mode with Shift+Tab
→ Analyze codebase in read-only mode
→ Generate implementation strategy report
→ Begin implementation after approval
```

Benefits:

- Dramatically improves first-try success rate
- Reduces wasted token consumption
- Provides clear visibility on complex tasks

### /statusline - Monitor Context Usage in Real-Time

Displays context usage in real-time.
I use this to stay on top of things for compacting. Too much context makes LLMs perform worse, so this is something humans can actively manage.

```
/statusline
```

Use cases:

- Token monitoring
- Combine with /compact to prevent token overflow

### /resume - Resume Sessions

Load a past conversation and continue where you left off.

```
# Resume the latest session
claude --resume

# Select from session picker
/resume

# Resume a specific session by ID/name
claude --resume auth-refactor
```

Handy uses:

- Continue yesterday's work
- Switch between multiple projects

> Want to find a session from a specific date? There's no built-in date search command, but session data is stored under ~/.claude/projects/, so you can ask in natural language: "Find my sessions from December 2024" and it'll search for you. If you use this often, you could create a custom command at ~/.claude/commands/history.md. Searching by specific date might be rare, but "I think I had a conversation around some month…" does happen.

### Launch Option: -p Mode

A high-speed mode that generates code without explanation.
I've been thinking lately that power-user engineers might prefer this.
I'm on the weaker side, so I plan a lot and talk to Claude Code constantly.

```
# Launch in print mode (non-interactive)
claude -p "explain this function"

# Combine with pipes
cat logs.txt | claude -p "explain"
```

Best for:

- Automation from scripts
- Quick questions
- CI/CD pipeline integration

### Keyboard Shortcuts

Memorizing these speeds up your workflow.
I'm a Windows user, so Mac users should substitute Command key etc. as appropriate.
Recently some shortcuts have started conflicting with each other, so consult your own environment setup.

| Shortcut | Function | Notes |
|----------|----------|-------|
| Esc (once) | Stop generation | Stop a runaway response immediately |
| Esc (twice) | Show /rewind menu | Rewind code or conversation |
| Shift+Tab | Cycle modes | Normal → Auto-Accept → Plan |
| Ctrl+G | Open editor | Handy for multi-line input |
| Ctrl+T | Toggle task list | Check progress |
| Ctrl+R | Search command history | Interactive search through past inputs |
| Ctrl+V | Paste image | On Mac too — Ctrl+V, not Cmd+V |
| Alt+P (Win/Linux) | Switch model | Change model while typing a prompt |

Tips:

- Apparently you can combine voice input (Mac: fn+fn) with Esc for hands-free operation. An Anthropic team member mentioned this. Lucky…
- Run /terminal-setup once to enable Shift+Enter for multi-line input

## Agents (Avoiding Total Chaos)

Agents are convenient, but having too many will drown you in information.
There's also the question of how much to delegate to AI — I'm personally still a bit hesitant to hand everything over, so I'm taking it gradually.
Anthropic is aware of this and improvements are ongoing.
We're all figuring out the right balance that's kind to both humans and AI.

### /agents - Sub-Agent Management Basics

You can delegate tasks across multiple sub-agents.

```
/agents
# Menu appears

# Create a custom agent
"Spawn researcher agent for docs"
```

My current best practices:

- Start small: Begin with 2-3 agents (more = information overload, and still a bit scary)
- Keep parallel runs to 3-5: More than that leads to chaos (fun though)
- Write detailed task briefs: Clearly specify WHY/HOW
- Use tmux for session management: Organize multiple agents

For those with deep pockets who want large-scale orchestration, check out Oshio-san's viral article for a general idea of the sub-agent concept (it's a genuinely fun read):

https://zenn.dev/shio_shoppaize/articles/5fee11d03a11a1

### Agent Teams - Autonomous Collaboration Mode (Research Preview)

> **Agent Teams is an experimental feature.** You need to set the environment variable CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS to use it.

In Team mode, a lead agent delegates work to multiple teammates who collaborate autonomously.
I found it kind of funny how they just poof disband when done. Very professional.
No lingering around — "alright team, we're done here."
You can enable it from settings.json.

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Delegate Mode:

- "Delegate Mode" is added to the Shift+Tab cycle
- The lead agent only coordinates (cannot edit code)
- Focuses on task management, team communication, and review

Features:

- Shared task lists across teammates
- Direct messaging for mutual coordination
- Unlike sub-agents, each operates as a fully independent Claude Code instance

### Sub-Agents

Launch dedicated sub-agents from the main agent to delegate specific tasks.
If you pick the wrong model for this, everyone ends up on Opus and costs skyrocket. Made me wish I were rich.
The basic approach is to use Opus as the commander and Sonnet for the others, adjusting based on the task.

```
# Define custom sub-agents via CLI flags
claude --agents '{"reviewer":{"description":"Reviews code","prompt":"You are a code reviewer"}}'
```

Use cases:

- Dedicated test agent
- Dedicated documentation generator
- Dedicated code reviewer

Differences between Sub-Agents and Agent Teams:

| Aspect | Sub-Agents | Agent Teams |
|--------|------------|-------------|
| Independence | Runs within parent session | Fully independent instances |
| Communication | Returns results to parent only | Direct messaging between teammates |
| Stability | Stable release | Research Preview (experimental) |

### /tasks - Task List Management

A task list that persists even when you close a session. Added in v2.1.16 (January 2026).
Tasks don't disappear even if a human accidentally closes the session.
I've been that idiot who was messing around with Claude Code late at night and closed the session. Lifesaver.

```
# Toggle task list display
Ctrl+T

# Create tasks with natural language
"Add authentication feature. Break it down into tasks by dependency"
```

Features:

- Persisted as files in ~/.claude/tasks/
- Carries over across sessions
- Shareable across multiple sessions (via CLAUDE_CODE_TASK_LIST_ID environment variable)
- Preserved even after context compression

Benefits:

- Prevents forgetting things in complex projects
- An evolution of the traditional TODO list

### Chaos Prevention Tips

Some of these are obvious, but I want to write them down for my own sanity.

Best practices for avoiding chaos:

1. Summarize context with /compact

```
/compact Prioritize keeping the error handling patterns
```

2. Document team rules in CLAUDE.md

- Maintain consistency across agents
- Clarify role assignments

3. Use MCP Tool Search for lazy-loading tools

- Save context
- Load only the tools you need

4. Syntax highlighting

- Change themes with /theme
- Improves review readability

## Output Styles

Use /output-style to change Claude Code's output style.
There are various styles. I see a lot of people tweaking this for fun or motivation. Makes sense. I get it.

### Main Styles

| Style | Characteristics | Best For |
|-------|----------------|----------|
| Default | Concise, speed-focused, code only | Maximum work efficiency |
| Explanatory | Explains design decisions and trade-offs while working | Understanding code intent |
| Learning | Explains reasoning behind changes, has user write small code snippets | Learning new technologies |

### Configuration

```
# Change output style
/output-style

# Undocumented feature: set up output modes
@agent-output-mode-setup
# → Generates 4 custom modes in ~/.claude/output-modes/:
#    Concise, Educational, Code Reviewer, Rapid Prototyping
```

### Customization

Open the Settings screen with /config to modify various settings.

Tips:

- Output styles can be applied to Agents too
- Custom output styles can be created

## AskUserQuestion - Interactive Question Feature

When Claude is unsure about a decision, it presents options for you to choose from.
This pops up when I give unclear instructions — I feel a bit guilty but gratefully select an option… though honestly I usually end up picking "other" and typing whatever I want.

Features:

- Improved usability with Agents integration
- Also used for permission confirmations like file deletion
- Useful for turning vague instructions into specific ones

Example:

```
"Implement feature X"
→ Auto-popup when unclear points arise
→ Select by entering a number in CLI
```

## Auto-Accept Mode

Switch to Auto-Accept Mode with Shift+Tab to auto-approve permission confirmations.
I'm still a little nervous about this, and while the clicking is tedious, I generally switch between manual approval and Auto depending on the situation.

Caution:

- Use with security awareness
- Difference from --dangerously-skip-permissions: Auto-Accept can be toggled during a session

## Prompt Optimization Techniques

The way you write prompts changes output quality. I almost felt like I didn't need to include this, but just in case.
Here are some useful patterns.

### Self-Review

```
"Grill me on changes"
```

Gets you a tough code review.
By the way, "grill" is slang for "interrogate" in English, so you might not want to use it too casually.

### Deep Thinking

```
"Ultra think"
```

Gets Claude to think more deeply before responding.
This has been used with ChatGPT and others for a while now.

### Task Decomposition

```
"Step by step"
```

Progresses through complex tasks in stages.
I also use this when studying — shamelessly asking "explain it to me this way."

### Hallucination Prevention

Encourages careful responses in conservative mode.

```
"Be conservative and verify before making changes"
```

That said, hallucinations still happen because LLMs.
And that's fine — it keeps the human side vigilant too, which is healthy. Big heart energy.

## Custom Slash Commands

Handles repetitive tasks with a single command.
Personally, I think this is the tastiest part of Claude Code.
Being free from prompt management? That's what makes me happiest.
Thank you, Anthropic — there are various things to appreciate, but personally, being able to customize everything (Skills included) is just wonderful.

### Basic Setup

Global commands:

```
~/.claude/commands/unit-test.md
```

Project-level:

```
.claude/commands/deploy.md
```

### Good Usage Examples

#### /unit-test - Auto-Generate Tests

```markdown
# unit-test.md
Generate comprehensive unit tests for $ARGUMENTS.
Include edge cases and error handling.
```

#### /fix-bugs - Automated Bug Fixing

```markdown
# fix-bugs.md
Analyze $ARGUMENTS for bugs and fix them.
Explain what was wrong and how you fixed it.
```

#### /deploy - Deployment Workflow

```markdown
# deploy.md
1. Run tests
2. Build production bundle
3. Deploy to $ARGUMENTS environment
4. Verify deployment
```

### Using Arguments

```
# Receive arguments with $ARGUMENTS ($0, $1 also work)
/unit-test src/utils.js
```

### Upgrading to Skills

Upgrading custom commands to Skills lets you:

- Add sub-files (reference documents)
- Build more complex workflows
- Use disable-model-invocation: true so they only run when explicitly invoked by the user

## Session Handover Tips

When context is about to overflow, or when you want to reliably carry over to the next session in a long-term project — there are several approaches.
I'm still figuring out which style works best for me.
Also on the fence about whether to make these into Skills.

### Method 1: Save conversation with /export

```
/export handover.md
# Current conversation is output to file
# In the next session: "Read handover.md and continue"
```

### Method 2: Create a custom command

In international communities, the pattern of creating a "handover" command that structures and saves a session summary is gaining traction.

```markdown
# ~/.claude/commands/handover.md
Create a handover document for the current session:
- Summary of work done
- Decisions made
- Incomplete tasks
- Pitfalls encountered and lessons learned
Save as HANDOVER.md.
```

### Method 3: /teleport to move to a Web session

```
# Send from local to a claude.ai Web session
& task description

# Pull a Web session back to local
/teleport
```

### Comparison with Memory:

| Aspect | Memory (CLAUDE.md) | /export + Custom Command |
|--------|-------------------|--------------------------|
| Behavior | Automatically referenced | Explicitly saved and loaded |
| Format | CLAUDE.md file | Any file |
| Best for | Project-wide rules and context | Specific session handovers |

## Potential Tips Worth Noting

1. Turn repetitive tasks into commands

- Examples: Git commits, running tests, builds

2. Create commands suggested by /insights

- Optimized based on your usage patterns

3. Separate project-level and global commands

- Project-specific → .claude/commands/
- General-purpose → ~/.claude/commands/

Reference:

- Skills Official Documentation

## Hidden Features & Advanced Usage

### Artifacts - Interactive Code Generation

This is a feature of Claude (web and desktop), but it's been extended in Claude Code.
Well, it was originally a Claude Code thing, technically.
I think this area is more about the distinction between engineers and non-engineers.

web-artifacts-builder skill:

- Generates HTML/JS/CSS as files
- Live editing possible
- For interactive tools like "create a budget calculator"

```
"Create a budget calculator with live updates"
→ web-artifacts-builder skill activates
→ HTML/JS/CSS files are generated
```

### Checkpointing

An automatic backup feature used with /rewind.
This is seriously a lifesaver. Save points are a must.

Features:

- Can rewind both code and conversation
- Auto-creates checkpoints
- Functions as a safety net

Reference:

- Checkpointing Official Documentation

### ! for Shell Injection

Lets you fetch live data within skills.
Subtle but appreciated.

```
# Example: Fetch GitHub PR diff live
!gh pr diff

# Example: Check current Git status
!git status
```

Use cases:

- Fetching live data
- Integration with external tools
- Reflecting dynamic information

## Context Management

### Auto-Compact (Automatic Context Compression)

When you use about 95% of the context window, it automatically summarizes and compresses the conversation (auto-compact).
Essential information is preserved while letting you continue the session seamlessly.
The web version has this too. I trigger it fairly often so I always feel like "s-sorry… the conversation got long again…"

```
# Manual compact (you can specify what to preserve)
/compact Keep the error handling patterns

# Check current context usage
/context
```

Tips:

- Since v2.0.64, compacting completes instantly (Claude Code feels pretty fast. The web version seems to work harder at it)
- Manual /compact lets you specify what to preserve via instructions
- Long sessions are managed automatically, so basically just let it handle things

### MAX_THINKING_TOKENS

Expand thinking tokens to improve reasoning capability.
The trade-off with your wallet. Naturally.

```
MAX_THINKING_TOKENS=10000
```

Trade-offs:

- Reasoning capability ↑
- Cost ↑

When to use:

- Complex problems: Set higher
- Simple tasks: Default is sufficient

## Summary

### The 3 Things to Learn First

1. `/help` — Starting point for everything
2. `Esc+Esc` (`/rewind`) — Your safety net
3. `/context` — Token monitoring

### Recommended Commands by Scenario

**Debugging & Fixing:**

- `/doctor` → Environment diagnostics
- `Esc` → Stop runaway responses
- `/rewind` → Undo changes

**Large-Scale Tasks:**

- `Shift+Tab` (Plan Mode) → Strategic planning
- `/agents` → Task delegation
- `/tasks` → Persistent management (`Ctrl+T` to toggle)

**Token Management:**

- `/compact [instructions]` → Manual summary (auto-compact also available)
- `/context` → Check usage
- `/clear` → Reset

**Learning:**

- `/output-style` → Switch to Learning mode
- "Grill me on changes" → Tough review
- "Step by step" → Step-by-step explanation

**Efficiency:**

- Create custom slash commands
- Monthly review with `/insights`

**Team Development:**

- `/export` + custom handover command → Session handover
- Agent Teams → Collaborative work (experimental)
- `CLAUDE.md` → Share rules

### Token Management Checklist

- Check regularly with `/context`
- Let auto-compact handle long sessions (manual: `/compact`)
- Use `/clear` when switching tasks
- Use `/rewind` to remove unnecessary conversation
- Save with `/export` before starting a new session

### Rules for Agents

- Start with 2-3
- Clarify rules in CLAUDE.md
- Maximum 5 running in parallel
- Monitor constantly with `/statusline`
- Use `/compact` when things get chaotic

## Closing Thoughts

Claude Code gets updated so fast that this article's content will eventually become outdated.
Seriously, it's too fast. Things change while you're at work or sleeping — it's almost funny.
Please also check the official documentation.

Running /insights monthly reveals habits and improvement areas you wouldn't notice on your own.
Start there. Seriously, it's that good.

## Reference Links

- Claude Code Official Documentation
- Interactive Mode Official Documentation
- CLI Reference Official Documentation
- Checkpointing Official Documentation
- Agent Teams Official Documentation
- Deep Dive: How Claude Code's /insights Command Works
