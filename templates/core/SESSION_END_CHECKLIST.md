# Session End Checklist

**CxMS Version:** 1.7
**Purpose:** Ensure proper session wrap-up and context preservation

---

## What's Automated (Hooks)

If you have CxMS hooks installed (see `templates/core/HOOKS_CONFIG.md`), several steps in this checklist happen automatically:

| Step | Hook | What It Does |
|------|------|-------------|
| Context monitoring | `cxms-context-check.mjs` | Warns at 65/75/80/83% automatically after every tool call |
| Pre-compaction save | `cxms-pre-compact.mjs` | Saves TL;DR, checkpoint, tasks, and uncommitted files before context wipe |
| Session timestamp | `cxms-session-end.mjs` | Writes end timestamp to Session.md when you exit |
| Uncommitted warning | `cxms-session-end.mjs` | Warns you about uncommitted files on exit |
| Telemetry | `cxms-session-end.mjs` | Submits anonymous telemetry if enabled |
| Post-compaction recovery | SessionStart hook | Reads saved state back into context after compaction |

**With hooks installed, your manual checklist is just steps 1-3 below.** Everything else is handled.

---

## When to Use This Checklist

Use this checklist:
- Before ending any AI coding session
- When context reaches 70%+ (hooks warn you automatically)
- Before switching to a different project
- At natural stopping points in long sessions

---

## Quick Checklist

Copy and paste to your AI assistant:

```
Before we end, please complete the session end checklist:

1. Update [PROJECT]_Session.md with:
   - What was accomplished this session
   - Current state of work in progress
   - Any blockers or pending items
   - Context for next session

2. Update [PROJECT]_Tasks.md:
   - Mark completed tasks as done
   - Update task status for in-progress items
   - Add any new tasks discovered

3. Confirm updates are saved

4. Provide a brief summary of the session
```

---

## Detailed Checklist

### 1. Session.md Updates (Required)

| Section | Update |
|---------|--------|
| TL;DR | Reflect current state |
| What Changed This Session | List accomplishments |
| Work In Progress | Current status of ongoing work |
| Context for Next Session | What the next session needs to know |
| Session Metrics | If tracking (compaction events, tasks completed) |

**Session.md Quick Update Prompt:**
```
Update [PROJECT]_Session.md with this session's work:
- We accomplished: [brief list]
- Work in progress: [current state]
- Next session should: [context/next steps]
```

### 2. Tasks.md Updates (Required)

| Action | When |
|--------|------|
| Mark tasks complete | Task fully finished |
| Update status | Task partially done or blocked |
| Add new tasks | Discovered during session |
| Update priority | If priorities changed |

**Tasks.md Quick Update Prompt:**
```
Update [PROJECT]_Tasks.md:
- Complete: [task IDs]
- In Progress: [task IDs with status]
- New tasks: [if any]
```

### 3. Optional Log Updates

Update these if your project uses them:

| Log | Update When |
|-----|-------------|
| Activity_Log.md | Deployments, DB changes, config changes |
| Decision_Log.md | Architectural or design decisions made |
| Issue_Log.md | Bugs found or resolved |
| Prompt_Library.md | Particularly effective prompts used |

### 4. Context-Aware Checkpoints

> **With hooks:** `cxms-context-check.mjs` handles this automatically. It monitors context after every tool call and injects warnings directly into the conversation. You don't need to remember to check.
>
> **Without hooks:** Monitor context manually via `.claude/context-status.json`.

| Context % | Action | Automated? |
|-----------|--------|-----------|
| 65% | Warn user, suggest checkpoint | Yes (hook) |
| 75% | Auto-checkpoint to Session.md | Yes (hook warns; you write checkpoint) |
| 80% | STOP, full save, require confirmation | Yes (hook) |
| 83% | Emergency — compaction imminent | Yes (hook) |

**Checkpoint Format** (add to Session.md):
```markdown
### Checkpoint [TIMESTAMP] - Context at [X]%

**Current Task:** [What we're working on]
**Progress:** [What's done, what remains]
**Key Files:** [file:line references for work in progress]
**Pending Decisions:** [Any unresolved items]
**Resume Prompt:** [Exact prompt to continue from here]
```

### 5. Pre-Compaction Save

> **With hooks:** `cxms-pre-compact.mjs` fires automatically before compaction and saves session state to `.claude/compaction-recovery.md`. After compaction, the SessionStart hook reads it back. No manual intervention needed.
>
> **Without hooks:** If context is compacting unexpectedly (80%+), use this emergency prompt:

```
STOP - Context at critical level. Emergency save:

1. Immediately write checkpoint to [PROJECT]_Session.md
2. List ALL work in progress with file:line references
3. Run `git status` and note uncommitted changes
4. Write exact continuation prompt for next session
5. Tell user: "Session saved. Start new session with: [prompt]"
```

### 6. Cross-Session Notifications (If Applicable)

If your changes affect other AI sessions/projects:

```
Post notification to CROSS_SESSION_NOTIFICATIONS.md:
- What changed
- Which sessions/projects affected
- Required actions for other sessions
```

---

## Session End Prompts

### Standard Session End
```
Let's wrap up this session. Please:
1. Update [PROJECT]_Session.md with our work
2. Update [PROJECT]_Tasks.md with any status changes
3. Confirm the updates
4. Give me a brief session summary
```

### Quick Session End
```
Quick session end: Update Session.md and Tasks.md with current state, confirm when done.
```

### Detailed Session End (for complex sessions)
```
Comprehensive session wrap-up:

1. Update [PROJECT]_Session.md:
   - Full list of what we accomplished
   - Detailed current state of any work in progress
   - Specific context the next session will need
   - Update session metrics

2. Update [PROJECT]_Tasks.md:
   - Mark all completed tasks
   - Update all in-progress task statuses
   - Add any new tasks with descriptions

3. Update logs (if applicable):
   - Activity_Log.md for any deployments/changes
   - Decision_Log.md for any decisions made

4. Provide session summary including:
   - Key accomplishments
   - Any blockers or concerns
   - Recommended next steps
```

---

## Commit Reminder

> **With hooks:** `cxms-session-end.mjs` automatically warns you about uncommitted files when the session ends. You'll see: `[CxMS] WARNING: N uncommitted file(s). Consider committing before closing.`
>
> **Without hooks:** Remember to check manually:

```
Before ending, let's commit our changes:
1. Show me git status
2. Stage and commit with a descriptive message
3. Push if appropriate
```

---

## Verification

After session end updates, verify:

- [ ] Session.md reflects current state
- [ ] Tasks.md is up to date
- [ ] Any code changes are committed
- [ ] Next session can pick up where we left off

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| End session without updating Session.md | Always update before ending |
| Leave tasks in wrong status | Update task status accurately |
| Forget uncommitted code changes | Install hooks — they warn you automatically |
| Assume you'll remember context | Write it down in Session.md |
| Skip updates for "quick" sessions | Every session needs updates |
| Rely on directives for context monitoring | Install hooks — structural enforcement works |

---

## Related Documents

- `SESSION_START_PROMPTS.md` - Session start workflow
- `HOOKS_CONFIG.md` - Hook installation and configuration
- `[PROJECT]_Session.md` - Session state tracking
- `[PROJECT]_Tasks.md` - Task management

---

### Plain Language Summary

This checklist used to be entirely manual — you had to remember to update Session.md, check context levels, save before compaction, and commit your changes. Agents would ignore these steps because they were just directives written in a file.

With CxMS hooks, most of the checklist is now automated. Context monitoring fires after every tool call. Pre-compaction saves happen automatically. Session-end timestamps and uncommitted file warnings fire when you exit. The only manual steps left are the ones that require human judgment: writing what you accomplished, updating task status, and deciding what the next session needs to know.

The checklist still documents everything for users who haven't installed hooks yet, but it clearly marks which steps are automated so you know what you can skip.

---

> *"Do, or do not. There is no 'I'll remember it next session.'"*
>
> — Master Yoda, probably

*CxMS - Preserve your context, every time.*
