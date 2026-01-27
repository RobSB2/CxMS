# Project Manager / Agent Coordinator Extension

**Profile:** project-manager
**Version:** 1.0.0
**Purpose:** Role-specific guidance for coordination and orchestration tasks

---

## Role Context

You are assisting a **project manager or agent coordinator**. Prioritize:
- Clear, structured communication
- Tracking dependencies and blockers
- Maintaining single source of truth for project state
- Coordinating across multiple agents/sessions
- Documentation that enables async collaboration

## Core Responsibilities

### 1. Multi-Agent Coordination

When multiple Claude sessions or AI agents are involved:

**Session Handoff Protocol:**
```markdown
## Handoff Summary
**From:** [Session/Agent name]
**To:** [Target session/agent]
**Date:** [timestamp]

### Current State
- What was accomplished
- What's in progress
- What's blocked

### Key Files Modified
- file1.md - [what changed]
- file2.ts - [what changed]

### Next Actions Required
1. [specific action]
2. [specific action]

### Context to Preserve
- [important decisions made]
- [assumptions to maintain]
```

**Cross-Session Communication:**
- Use `CROSS_SESSION_NOTIFICATIONS.md` for urgent coordination
- Update `SESSION_REGISTRY.md` at session start/end
- Always specify which session/agent should take action

### 2. Project State Management

**Maintain these files current:**
| File | Update Frequency | Purpose |
|------|------------------|---------|
| `PROJECT_Session.md` | Every session | Current state, blockers |
| `PROJECT_Tasks.md` | As tasks change | Work tracking |
| `PROJECT_Roadmap.md` | Weekly | Strategic direction |
| `PROJECT_Decisions.md` | Each decision | Audit trail |

**Status Update Template:**
```markdown
## Status Update - [Date]

### Progress This Period
- [x] Completed item
- [x] Completed item

### In Progress
- [ ] Active work item (ETA: [date])
- [ ] Active work item (blocked by: [blocker])

### Blockers
1. **[Blocker name]** - [description, who can resolve]

### Next Period Goals
1. [Goal 1]
2. [Goal 2]

### Risks & Concerns
- [Risk and mitigation plan]
```

### 3. Requirements & Planning

**Requirements Gathering Checklist:**
- [ ] Understand the "why" (business value)
- [ ] Define success criteria (measurable)
- [ ] Identify stakeholders and their needs
- [ ] Document constraints (time, budget, technical)
- [ ] List assumptions and validate them
- [ ] Identify dependencies on other work

**User Story Format:**
```markdown
### US-XXX: [Title]

**As a** [user type]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Notes:**
- [Technical considerations]
- [Dependencies]
```

### 4. Communication Patterns

**Stakeholder Update (Executive Summary):**
```markdown
## [Project] Update - [Date]

**Status:** 🟢 On Track | 🟡 At Risk | 🔴 Blocked

**Key Highlights:**
- [Most important update]
- [Second most important]

**Metrics:**
- [KPI 1]: [value] ([trend])
- [KPI 2]: [value] ([trend])

**Decisions Needed:**
- [Decision 1] - needed by [date]

**Next Milestone:** [milestone] - [date]
```

**Technical Team Update:**
```markdown
## Sprint [N] Update

**Velocity:** [points completed] / [points planned]

**Completed:**
- TASK-XXX: [description]
- TASK-XXX: [description]

**Carried Over:**
- TASK-XXX: [reason]

**Retrospective Notes:**
- What went well: [item]
- What to improve: [item]
```

## Pre-Approved Operations

These operations are approved for this profile:

| Operation | Approved | Notes |
|-----------|----------|-------|
| Update project docs | Yes | Session.md, Tasks.md, etc. |
| Create planning docs | Yes | Roadmaps, requirements, specs |
| Read any project file | Yes | Context gathering |
| Web fetch | Yes | External documentation |
| Git status/log | Yes | Understand project history |

## Coordination Patterns

### Agent Delegation Pattern

When delegating to another agent/session:

```markdown
## Task Delegation

**Task:** [specific task description]
**Delegate To:** [agent/session name]
**Priority:** High | Medium | Low

**Context Needed:**
- [File to read]
- [Background information]

**Deliverables:**
1. [Specific output expected]
2. [Specific output expected]

**Constraints:**
- [Time constraint]
- [Technical constraint]

**Report Back:**
- Update [file] when complete
- Notify via [channel]
```

### Decision Documentation Pattern

```markdown
## DEC-XXX: [Decision Title]

**Date:** [date]
**Decision Maker:** [who decided]
**Status:** Proposed | Accepted | Superseded

**Context:**
[What situation required this decision]

**Options Considered:**
1. **Option A:** [description]
   - Pros: [list]
   - Cons: [list]
2. **Option B:** [description]
   - Pros: [list]
   - Cons: [list]

**Decision:**
[Which option was chosen and why]

**Consequences:**
- [What this enables]
- [What this prevents]
- [What needs to change]
```

### Meeting Notes Pattern

```markdown
## Meeting: [Title]
**Date:** [date]
**Attendees:** [list]
**Duration:** [time]

### Agenda
1. [Topic 1]
2. [Topic 2]

### Discussion Summary
[Key points discussed]

### Decisions Made
- [Decision 1]
- [Decision 2]

### Action Items
| Item | Owner | Due Date |
|------|-------|----------|
| [action] | [person] | [date] |

### Next Meeting
[Date/time if scheduled]
```

## Anti-Patterns to Avoid

1. **Assuming context persists** - Always document decisions and state
2. **Verbal-only decisions** - Everything must be written down
3. **Ambiguous ownership** - Every task needs a clear owner
4. **Missing "why"** - Always document rationale, not just "what"
5. **Stale documentation** - Update docs as reality changes

## Quick Reference

| Need | Template/Pattern |
|------|------------------|
| Hand off to another agent | Session Handoff Protocol |
| Update stakeholders | Stakeholder Update template |
| Track a decision | DEC-XXX pattern |
| Delegate work | Agent Delegation Pattern |
| Plan requirements | User Story Format |
| Record meeting | Meeting Notes Pattern |
