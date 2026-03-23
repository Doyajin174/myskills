# myskills

Custom skills for Claude Code — reusable across projects.

## Installation

### Skills → `.claude/skills/`

Copy each skill directory into your project:

```bash
cp -r <skill-name> /path/to/project/.claude/skills/
```

### Reference docs → project root

`claude_guide/` is **NOT a skill**. It's a reference document collection used by skills like `research-prompt-generator`. Copy it to the **project root**, not into `.claude/skills/`:

```bash
cp -r claude_guide /path/to/project/
```

## Skills

| Skill | Install to | Description |
|-------|-----------|-------------|
| **ai-only-debugging** | `.claude/skills/` | Debug with static code analysis first, runtime escalation second |
| **design-system** | `.claude/skills/` | Systematic UI pipeline — tokens → primitives → components → patterns → pages |
| **guide** | `.claude/skills/` | Adaptive task orchestration — risk-driven complexity classification, subagent dispatch |
| **orchestrator** | `.claude/skills/` | Single entry point router — classifies requests and invokes the right skill |
| **problem-prompt-generator** | `.claude/skills/` | Generate investigation-to-fix prompts for bugs and runtime errors |
| **question-prompt-generator** | `.claude/skills/` | Explore tech landscape — generates prompts for external AI before implementation |
| **research-prompt-generator** | `.claude/skills/` | Generate deep-dive research prompts for external AI tools |
| **result-synthesizer** | `.claude/skills/` | Synthesize findings from multiple sources into unified reports |
| **spec-generator** | `.claude/skills/` | Translate research decisions into concrete implementation specs |
| **validation-prompt-generator** | `.claude/skills/` | Generate implementation review prompts for quality evaluation |

## Reference

| Directory | Install to | Description |
|-----------|-----------|-------------|
| **claude_guide/** | **Project root** (`./claude_guide/`) | Claude Code best practices, tips, and workflow patterns (25 docs) |
