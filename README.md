# myskills

Custom skills for Claude Code — reusable across projects.

## Skills

| Skill | Description |
|-------|-------------|
| **ai-only-debugging** | Debug with static code analysis first, runtime escalation second. 6-level priority stack from type analysis to runtime. |
| **buildup-prompt-generator** | Generate systematic investigation-to-fix prompts (Investigate → Diagnose → Fix → Verify → Document). Bilingual EN+KO output. |
| **design-system** | Systematic UI pipeline — tokens → primitives → components → patterns → pages. No magic numbers. |
| **guide** | Adaptive task orchestration — risk-driven complexity classification, pipeline selection, subagent dispatch with failure recovery. |
| **research-prompt-generator** | Generate self-contained research prompts for external AI tools (ChatGPT, Gemini, Perplexity). |

## Reference

| Directory | Description |
|-----------|-------------|
| **claude_guide/** | Claude Code best practices, tips, and workflow patterns. Referenced by `buildup-prompt-generator`. |

## Usage

Copy a skill into your project's `.claude/skills/` directory:

```bash
cp -r <skill-name> /path/to/project/.claude/skills/
```

For `buildup-prompt-generator`, also copy `claude_guide/` to your project root:

```bash
cp -r claude_guide /path/to/project/
```
