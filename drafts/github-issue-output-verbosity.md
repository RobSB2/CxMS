# Feature Request: Output Verbosity Controls for Tool Results and Diffs

## Summary

Add CLI options to control the verbosity of tool output displays, particularly Edit diffs and file read results. Many workflows would benefit from quieter output modes.

## Problem

Claude Code displays full tool outputs by default:

1. **Edit diffs** - Shows every removed line (red) and added line (green)
2. **File reads** - Shows file content with line numbers
3. **Bash outputs** - Shows full command results
4. **Search results** - Shows all matches with context

While useful for review/learning, this becomes noise in trusted workflows:

| Scenario | Current Behavior | Impact |
|----------|------------------|--------|
| Large refactor (200+ lines) | Wall of red/green diff | User scrolls past, misses important info |
| Routine file updates | Full diff every time | Slows down rapid iteration |
| Reading config files | Shows entire file | Buries the actual response |
| Trusted "just do it" mode | Same verbosity as review mode | Unnecessary friction |

**The human operator often doesn't need to see the diff** - they asked for the change, they trust the AI, and they can `git diff` later if needed.

## Proposed Solution

### Option 1: Global verbosity flag

```bash
claude --verbosity quiet    # Minimal output
claude --verbosity normal   # Current behavior (default)
claude --verbosity verbose  # Extra detail (debugging)
```

### Option 2: Per-tool-type controls

```bash
claude --diff=summary       # "Edited file.md (+15/-8 lines)"
claude --diff=none          # "Edited file.md"
claude --read-output=truncate:20  # Show first 20 lines only
```

### Option 3: Session toggle command

```
/quiet          # Suppress tool outputs for this session
/verbose        # Restore full output
/diff off       # Suppress diffs specifically
```

### Option 4: Settings file

```json
// .claude/settings.json
{
  "output": {
    "showDiffs": "summary",      // "full" | "summary" | "none"
    "showFileReads": "truncate", // "full" | "truncate" | "none"
    "maxOutputLines": 50
  }
}
```

## Suggested Verbosity Levels

| Level | Edit Diffs | File Reads | Bash Output |
|-------|------------|------------|-------------|
| `quiet` | "Edited file.md" | "Read file.md (150 lines)" | Exit code only |
| `summary` | "+15/-8 lines in file.md" | First 10 lines + "..." | First 20 lines |
| `normal` | Full diff (current) | Full content (current) | Full output (current) |

## Use Cases

**Trusted rapid iteration:**
> "Update all the session files, commit, and push"
>
> User doesn't need to see 500 lines of diffs across 5 files - just confirmation it's done.

**Large refactors:**
> "Refactor this module to use the new API"
>
> 200-line diff scrolls the important context off screen. A summary would suffice.

**Context management workflows (CxMS):**
> Session files, task files, and logs are updated routinely. Full diffs add no value.

## Context

We've implemented "Communication Efficiency" directives in [CxMS](https://github.com/RobSB2/CxMS) to reduce AI-generated verbosity (E8). This successfully reduces unnecessary preamble, over-confirmation, and verbose status messages.

However, **tool output verbosity is controlled by the CLI, not the AI**. Users cannot currently opt out of seeing full diffs and file contents, even when they trust the AI and want faster iteration.

## Alternatives Considered

- **CLAUDE.md directives**: Tried "suppress showing code in output" - only affects AI's chosen text, not tool result displays
- **Piping to /dev/null**: Loses all output including errors
- **Post-hoc review with git**: Works but doesn't solve the scroll/noise problem during session

## Additional Context

- Windows 11 + PowerShell terminal
- Heavy user of Edit tool (dozens of edits per session)
- Workflow is "trusted mode" - AI has pre-approved operations, minimal review needed
- Related to overall developer experience and session flow

---

**Would love to hear if others want this or if there are existing workarounds I've missed.**
