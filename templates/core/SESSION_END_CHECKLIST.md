# Session End Checklist

**CxMS Version:** 1.3
**Purpose:** Ensure proper session wrap-up and context preservation

---

## When to Use This Checklist

Use this checklist:
- Before ending any AI coding session
- When context is about to compact (you'll usually get a warning)
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

### 4. Pre-Compaction Emergency Save

If context is compacting unexpectedly:

```
STOP - Context compacting. Emergency save:

1. Immediately update [PROJECT]_Session.md with current state
2. List any uncommitted work or unsaved changes
3. Note exact file and line if mid-edit
4. Confirm save before compaction proceeds
```

### 5. Cross-Session Notifications (If Applicable)

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

If you made code changes this session:

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
| Forget uncommitted code changes | Commit or note in Session.md |
| Assume you'll remember context | Write it down in Session.md |
| Skip updates for "quick" sessions | Every session needs updates |

---

## Related Documents

- `SESSION_START_PROMPTS.md` - Session start workflow
- `[PROJECT]_Session.md` - Session state tracking
- `[PROJECT]_Tasks.md` - Task management

---

*CxMS - Preserve your context, every time.*
