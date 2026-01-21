# Session Start Prompts

**Template Version:** 1.1

Copy and paste these prompts at the start of new Claude Code sessions.

---

## Standard Start (Recommended)

```
Read the following files to understand the project:

1. CLAUDE.md - Project overview and preferences
2. [PROJECT]_Session.md - Current state and recent changes
3. [PROJECT]_Tasks.md - Active and pending tasks

After reading, summarize:
- Current active task and status
- What was done last session
- Recommended next steps

Then await my instructions.
```

---

## Quick Start (Minimal)

```
Read CLAUDE.md and [PROJECT]_Session.md, summarize current status, then await instructions.
```

---

## Full Context (Comprehensive)

```
Read all context files in order:

1. CLAUDE.md
2. [PROJECT]_Context.md
3. [PROJECT]_Session.md
4. [PROJECT]_Tasks.md

Provide a comprehensive status report including:
- Project overview
- Current state
- All active/pending tasks
- Files pending any action
- Recommended priorities

Then await instructions.
```

---

## Task-Specific Start

```
Read CLAUDE.md, [PROJECT]_Session.md, and [PROJECT]_Tasks.md.
Focus on TASK-[XXX] and continue from where we left off.
```

---

## Session End Prompt

**ALWAYS use before ending a session:**

```
Update [PROJECT]_Session.md with everything from this session before we end.
Include Session Metrics if tracking is enabled.
```

---

## Session End Prompt (With Metrics)

**Use when metrics tracking is enabled:**

```
Before we end, update [PROJECT]_Session.md:
1. All work completed this session
2. Session Metrics (compaction events, tasks completed, any corrections needed)
3. Context for next session

Confirm when done.
```

---

## Emergency: Quick Context Dump

**Use when session is about to end unexpectedly or compaction imminent:**

```
STOP. Context is about to be lost. Immediately output:

1. What task were we working on?
2. What files did we modify this session?
3. What decisions did we make?
4. What should happen next?
5. Any blockers or issues?

Output this as a formatted update for [PROJECT]_Session.md that I can paste directly.
```

---

## Emergency: Context Recovery

**Use when AI seems to have lost context mid-session:**

```
You seem to have lost context. Please re-read:
1. CLAUDE.md
2. [PROJECT]_Session.md
3. [PROJECT]_Tasks.md

Then tell me what you now understand about:
- The current task
- Recent work done
- What should happen next
```

---

## Mid-Session Checkpoint

**Use every 30-60 minutes or after completing significant work:**

```
Checkpoint: Update [PROJECT]_Session.md with progress so far.
Include: completed items, files changed, current state, metrics (if tracking).
We'll continue after the update.
```

---

## Verification Prompt

**Use to confirm AI has loaded context correctly:**

```
Before we proceed, confirm you have read the context files by answering:
1. What is the current active task?
2. When was Session.md last updated?
3. What was the last thing completed?
4. What files were modified last session?

If you cannot answer these, please read the files first.
```

---

## Planning Session Start

**Use when starting a planning/design session:**

```
Read all context files:
1. CLAUDE.md
2. [PROJECT]_Context.md
3. [PROJECT]_Session.md
4. [PROJECT]_Tasks.md
5. [PROJECT]_Plan.md (if exists)
6. [PROJECT]_Strategy.md (if exists)

Summarize current project state and pending decisions.
We'll be doing planning work today.
```

---

## Performance Review Start

**Use when doing periodic CxMS effectiveness review (every 30-60 days):**

```
We're doing a CxMS Performance Review. Read:
1. CLAUDE.md
2. [PROJECT]_Session.md (especially Session Metrics section)
3. [PROJECT]_Tasks.md

Compile metrics from the tracking period and help me create/update:
[PROJECT]_Performance_Review.md

Include: quantitative metrics, qualitative assessment, recommendations.
```

---

## Quick Reference

| Situation | Prompt to Use |
|-----------|---------------|
| Normal session | Standard Start |
| Quick check-in | Quick Start |
| Major milestone | Full Context |
| Continuing specific work | Task-Specific |
| Before closing | Session End |
| Before closing (with metrics) | Session End (With Metrics) |
| Unexpected end | Emergency: Quick Context Dump |
| AI lost context | Emergency: Context Recovery |
| Long session | Mid-Session Checkpoint |
| Verify AI loaded context | Verification Prompt |
| Planning/design work | Planning Session Start |
| CxMS effectiveness review | Performance Review Start |

---

## Session Lifecycle Reminder

```
SESSION START
     │
     ▼
┌─────────────────────────┐
│  1. Use Start Prompt    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  2. Verify AI Summary   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  3. Work                │
│  (Checkpoint if long)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  4. Session End Prompt  │  ← CRITICAL
└───────────┬─────────────┘
            │
            ▼
     SESSION END
```
