# CxMS Hooks Configuration Guide

**Version:** 1.0.0
**Requires:** Claude Code with hooks support

## Overview

CxMS hooks automate session lifecycle management using Claude Code's hook system. Instead of relying on directives that agents may ignore, hooks provide **structural enforcement** — they fire automatically at key lifecycle events.

## Hook Architecture

| Hook | Event | Script | Purpose |
|------|-------|--------|---------|
| Context Monitor | `PostToolUse` | `cxms-context-check.mjs` | Monitors context %, warns at thresholds |
| Pre-Compact | `PreCompact` | `cxms-pre-compact.mjs` | Saves session state before context wipe |
| Session End | `SessionEnd` | `cxms-session-end.mjs` | Timestamps session, runs telemetry, warns about uncommitted files |
| Compact Recovery | `SessionStart` | inline | Recovers state after compaction |

## Installation

### 1. Copy hook scripts to your project

Copy the three scripts from `tools/` to your project's `tools/` directory:

```
tools/cxms-context-check.mjs
tools/cxms-pre-compact.mjs
tools/cxms-session-end.mjs
```

### 2. Configure hooks in `.claude/settings.json`

Create or update `.claude/settings.json` in your project root:

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node tools/cxms-pre-compact.mjs",
            "timeout": 30,
            "statusMessage": "Saving session state before compaction..."
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node tools/cxms-context-check.mjs",
            "async": true,
            "timeout": 10
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node tools/cxms-session-end.mjs",
            "timeout": 30,
            "statusMessage": "Saving session state..."
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const fs=require('fs');const f='.claude/compaction-recovery.md';if(fs.existsSync(f)){console.log(fs.readFileSync(f,'utf-8'))}else{console.log('[CxMS] No recovery file found.')}\"",
            "statusMessage": "Recovering context after compaction..."
          }
        ]
      }
    ]
  }
}
```

### 3. Restart Claude Code

Hooks take effect on the next session start.

## How Each Hook Works

### Context Monitor (`PostToolUse`, async)

Fires after every tool call. Reads `.claude/context-status.json` (written by the statusline) and checks against thresholds:

| ctx_pct | Buffer | Action |
|---------|--------|--------|
| 65% | 20% | WARN: Notify user |
| 75% | 10% | CHECKPOINT: Write checkpoint to Session.md |
| 80% | 5% | STOP: Full session save needed |
| 83% | 2% | EMERGENCY: Compaction imminent |

Deduplicates warnings — only fires once per threshold crossing.

### Pre-Compact (`PreCompact`, sync)

Fires before Claude Code auto-compacts context (at ~85%). Saves:
- TL;DR section from Session.md
- Latest checkpoint
- Active tasks from Tasks.md
- Uncommitted file list (git diff)

Writes to `.claude/compaction-recovery.md` and logs to `.claude/compaction-log.json`.

### Session End (`SessionEnd`, sync)

Fires when the session ends (Ctrl+C, /exit, /clear, logout). Does:
- Inserts `**Session ended:**` timestamp into Session.md (idempotent — replaces if exists)
- Runs telemetry (`cxms-report.mjs --auto --quiet`) if the script exists
- Logs event to `.claude/session-log.json`
- Warns about uncommitted changes

### Compact Recovery (`SessionStart` with `compact` matcher)

Fires after compaction restores context. Reads `.claude/compaction-recovery.md` and outputs it to stdout so the agent gets session state back.

## Prerequisites

### Statusline

The context monitor hook requires the statusline to write `.claude/context-status.json`.

**Important:** Claude Code runs statusline commands through bash on **all platforms** (including Windows via Git Bash). The PowerShell script is deprecated.

Add to your `~/.claude/settings.json` (or project `.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  }
}
```

Copy `tools/statusline-command.sh` to `~/.claude/` and make it executable:

```bash
cp tools/statusline-command.sh ~/.claude/statusline-command.sh
chmod +x ~/.claude/statusline-command.sh
```

### Plain Language Summary

These hooks solve CxMS's biggest problem: agents ignoring directives. Instead of writing "check context at 65%" in CLAUDE.md and hoping the agent complies, a shell script fires automatically after every tool call and injects a warning directly into the conversation. The agent doesn't have to remember anything — the system remembers for it.

The PreCompact hook is the most valuable. Before these hooks, when context hit 85% and auto-compacted, everything above the summary was lost. Now, the hook auto-saves session state to a file *before* that happens, and the SessionStart hook reads it back after compaction. The agent gets its memory back without any human intervention.

The SessionEnd hook closes the loop — when you exit, it timestamps your session file, submits telemetry, and warns you about uncommitted changes. No more forgetting to save state before closing.
