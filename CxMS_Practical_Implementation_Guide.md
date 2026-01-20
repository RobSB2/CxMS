# CxMS - Practical Implementation Guide

**Version:** 1.0
**Date:** January 20, 2026
**Purpose:** Formalized, reusable system for managing AI assistant context across sessions

---

## Overview

This guide documents a proven context management system based on actual production use with Claude Code. It replaces the theoretical 400-page documentation with a practical, implementable approach.

**Core Principle:** AI context is temporary; files are permanent. Everything the AI needs to know must exist in files it can read.

---

## The Document Stack (5 Files)

Every project using this system needs these five files:

| File | Type | Update Frequency | Purpose |
|------|------|------------------|---------|
| `CLAUDE.md` | Static | Rarely | Project overview, tech stack, AI instructions |
| `[PROJECT]_Context.md` | Static | When docs change | Documentation index, reading order |
| `[PROJECT]_Session.md` | Dynamic | **Every session** | Current state, recent changes, next steps |
| `[PROJECT]_Tasks.md` | Dynamic | As tasks change | Task tracker with status and dependencies |
| `[PROJECT]_Prompt_History.md` | Append-only | Each prompt | Audit trail of all prompts and actions |

---

## File Templates

### 1. CLAUDE.md (Static - Project Overview)

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Output Preferences
[Your preferences for AI output - e.g., suppress code unless asked]

## Overview
[2-3 sentence project description]

## Project Structure
| Directory | Purpose | Database |
|-----------|---------|----------|
| `folder/` | Description | DB name |

## Tech Stack
- **Backend**: [Languages, frameworks, versions]
- **Frontend**: [CSS frameworks, JS libraries]
- **Database**: [Type and version]

## Key Files
- `path/to/config.php` - [Purpose]
- `path/to/db.php` - [Purpose]

## Development Preferences
[Your preferences - e.g., which database to use, where to put new code]

## Session Context Preservation

**IMPORTANT:** Before session compaction or when ending a work session, update `[PROJECT]_Session.md` with:
- Current task status and pending work
- Files modified/created this session
- Important decisions made
- Context needed for the next session

**At the start of each session:**
1. Read `CLAUDE.md` for project overview
2. Read `[PROJECT]_Session.md` for current state
3. Read `[PROJECT]_Tasks.md` for active tasks
```

---

### 2. [PROJECT]_Context.md (Static - Documentation Index)

```markdown
# [Project Name] - Context Document

**Created:** [Date]
**Purpose:** Central reference for all project documentation

---

## Quick Start for AI Assistants

**IMPORTANT:** Before starting any work, read these files in order:

1. **CLAUDE.md** - Project overview, tech stack, preferences
2. **[PROJECT]_Session.md** - Current state (DYNAMIC - check first)
3. **[PROJECT]_Tasks.md** - Active and pending tasks

**BEFORE SESSION END:** Update `[PROJECT]_Session.md` with current work!

---

## Documentation Index

### Core Documentation
| File | Purpose | Read When |
|------|---------|-----------|
| `CLAUDE.md` | Project overview | Always first |
| `[PROJECT]_Session.md` | Current state | Every session |
| `[PROJECT]_Tasks.md` | Task tracker | When doing tasks |
| `[PROJECT]_Prompt_History.md` | Prompt audit trail | Reviewing history |

### Technical Documentation
| File | Purpose | Read When |
|------|---------|-----------|
| [Add project-specific docs here]

---

## Key Technical Patterns

### Pattern 1: [Name]
```code
[Code example]
```

### Pattern 2: [Name]
```code
[Code example]
```

---

## Files to Ignore
- `vendor/`, `node_modules/` - Dependencies
- `*_backup_*`, `*_bak_*` - Backup files
```

---

### 3. [PROJECT]_Session.md (Dynamic - Current State)

```markdown
# [Project Name] - Session Context

**Purpose:** Preserves context between sessions. Update before session end.
**Last Updated:** [Date]

---

## Current Work Status

### Active Task
[What you're currently working on - reference task ID if using tracker]

### Completed This Session
1. ✅ [Completed item 1]
2. ✅ [Completed item 2]

### Pending
- [ ] [Pending item 1]
- [ ] [Pending item 2]

### Blockers/Questions
- [Any blockers or questions needing answers]

---

## Recent Changes (This Session)

### Files Modified
| File | Change Description |
|------|-------------------|
| `path/to/file.php` | Description of change |

### Files Created
| File | Purpose |
|------|---------|
| `path/to/newfile.md` | Purpose |

---

## Context for Next Session

**What was I doing?**
- [Summary of current work]

**What should I do next?**
- [Recommended next steps]

**Important context to remember:**
- [Key information that shouldn't be forgotten]

**Key files for reference:**
| File | Purpose |
|------|---------|
| `file.md` | Why it's relevant |

---

## Update Template (Copy When Updating)

```
## Current Work Status

### Active Task
[Task]

### Completed This Session
1. ✅

### Pending
- [ ]

### Blockers/Questions
-

---

## Recent Changes (This Session)

### Files Modified
| File | Change Description |
|------|-------------------|
| `` |  |

### Files Created
| File | Purpose |
|------|---------|
| `` |  |

---

## Context for Next Session

**What was I doing?**
-

**What should I do next?**
-

**Important context to remember:**
-
```
```

---

### 4. [PROJECT]_Tasks.md (Dynamic - Task Tracker)

```markdown
# [Project Name] - Task Tracker

**Created:** [Date]
**Purpose:** Track development tasks, status, and dependencies

---

## Active Tasks

### TASK-001: [Task Name]
**Status:** 🟡 In Progress
**Priority:** High | Medium | Low
**Started:** [Date]
**Target:** [Date or TBD]

**Description:**
[What this task accomplishes]

**Checklist:**
- [x] Completed step
- [ ] Pending step
- [ ] Pending step

**Related Files:** [List key files]
**Blocked By:** [Task ID or "None"]

---

## Pending Tasks

### TASK-002: [Task Name]
**Status:** 🟠 Pending
**Priority:** [Priority]
**Blocked By:** [What's blocking this]

**Description:**
[Brief description]

---

## Completed Tasks

### TASK-000: [Task Name]
**Status:** 🟢 Complete
**Completed:** [Date]

**Summary:** [What was accomplished]

---

## Status Legend

| Icon | Status | Description |
|------|--------|-------------|
| 🟢 | Complete | Finished and verified |
| 🟡 | In Progress | Currently being worked on |
| 🟠 | Pending | Ready to start |
| 🔴 | Blocked | Cannot proceed |
| ⚪ | Not Started | In backlog |

---

## Change Log

| Date | Task | Change |
|------|------|--------|
| [Date] | TASK-001 | [What changed] |
```

---

### 5. [PROJECT]_Prompt_History.md (Append-Only - Audit Trail)

```markdown
# [Project Name] - Prompt History

**Purpose:** Complete record of prompts and resulting actions
**Format:** Append new entries at the bottom

---

## Phase 1: [Phase Name]

### Prompt 1.1 - [Date]
**Prompt:**
> [Exact prompt text]

**Action Taken:**
- [What was done]

**Files Modified/Created:**
- `file.md` - [Purpose]

---

### Prompt 1.2 - [Date]
**Prompt:**
> [Exact prompt text]

**Action Taken:**
- [What was done]

---

## Phase 2: [Phase Name]

[Continue pattern...]
```

---

## Session Lifecycle

### Session Start
1. AI reads `CLAUDE.md` (project overview)
2. AI reads `[PROJECT]_Session.md` (current state)
3. AI reads `[PROJECT]_Tasks.md` (active tasks)
4. AI summarizes status, awaits instructions

**Start Prompt Template:**
```
Read CLAUDE.md, [PROJECT]_Session.md, and [PROJECT]_Tasks.md to understand the project, then summarize current status and await instructions.
```

### During Session
- Update `[PROJECT]_Tasks.md` as tasks progress
- Make notes of significant decisions
- Track files being modified

### Session End (CRITICAL)
1. Update `[PROJECT]_Session.md` with:
   - What was accomplished
   - Files modified/created
   - Current state
   - Next steps
2. Append to `[PROJECT]_Prompt_History.md`

**End Prompt Template:**
```
Update [PROJECT]_Session.md with this session's work before we end.
```

---

## Implementation Checklist

### New Project Setup
- [ ] Create `CLAUDE.md` with project overview
- [ ] Create `[PROJECT]_Context.md` with documentation index
- [ ] Create `[PROJECT]_Session.md` with initial state
- [ ] Create `[PROJECT]_Tasks.md` with initial tasks
- [ ] Create `[PROJECT]_Prompt_History.md` (can be empty initially)
- [ ] Add session preservation instructions to `CLAUDE.md`

### Each Session
- [ ] Start: Read context files
- [ ] Work: Track progress
- [ ] End: Update session document

---

## Key Patterns from Production Use

### 1. Document Before Act
Create plans and document decisions before executing code changes.

### 2. Preserve Context Aggressively
Update session documents before any compaction or session end. Lost context = wasted time.

### 3. Follow Reading Order
Always: `CLAUDE.md` → `Session.md` → `Tasks.md` → Specific docs as needed.

### 4. Track Everything
The prompt history isn't bureaucracy - it's how you remember what worked and why.

### 5. Keep Static Docs Static
Don't update `CLAUDE.md` every session. It's for stable project info.

### 6. Separate Tasks from State
`Tasks.md` = what needs to be done (organized by task)
`Session.md` = what happened (organized by time)

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                  SESSION LIFECYCLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  START                                                      │
│    │                                                        │
│    ▼                                                        │
│  ┌─────────────────┐                                       │
│  │ Read CLAUDE.md  │ ← Project overview                    │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Read Session.md │ ← Current state                       │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Read Tasks.md   │ ← Active tasks                        │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│       [ WORK ]                                              │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │Update Session.md│ ← CRITICAL!                           │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│         END                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

REMEMBER: Update Session.md BEFORE compaction or session end!
```

---

## What This System Replaces

This practical 5-file system replaces:
- 400+ pages of theoretical documentation
- Complex microservices architecture designs
- Speculative business plans
- Unverified patent claims

**What it preserves:**
- The core insight (documentation as external memory)
- The session lifecycle pattern
- The documentation layers concept
- Practical, proven patterns from real use

---

## Adapting for Your Projects

### Small Project (Solo, Short-term)
- `CLAUDE.md` - Minimal, just tech stack and preferences
- `[PROJECT]_Session.md` - Combined context + tasks
- Skip separate Tasks.md and Prompt History

### Medium Project (Team, Multi-week)
- Full 5-file stack
- Add technical documentation as needed
- Consider `.claude/rules/` for modular instructions

### Large Project (Enterprise, Long-term)
- Full 5-file stack per major component
- Add architecture documentation
- Add deployment tracking
- Consider task management integration

---

**Document End**

*This guide has been validated through actual production use with Claude Code (January 2026).*
