# Enhancement 21: Context Lifecycle Management

**Status:** RFC (Consolidates E5, E6, E11)
**Created:** 2026-01-27
**Replaces:** E5 (Context Compression), E6 (Token Conservation), E11 (Log Aging)

---

## Problem Statement

CxMS files grow over time, creating compounding problems:

| Problem | Cause | Impact |
|---------|-------|--------|
| Token bloat | Files accumulate history | Higher cost, slower sessions |
| Context limits | Large files fill context window | More compactions, lost nuance |
| Signal-to-noise | Old entries mixed with current | Harder to find relevant info |
| Stale data | Historical info loses relevance | Wasted context on useless data |

**Growth patterns by file type:**

| File Type | Growth | Example |
|-----------|--------|---------|
| Append-only logs | Unbounded | Session.md, Tasks.md, Activity_Log.md |
| Reference docs | Slow/stable | CLAUDE.md, Context.md |
| Audit trails | Fast | Prompt_History.md (every prompt) |

**Token cost reality:**
- Minimum session load: ~5K tokens
- Full context load: ~12K+ tokens
- Loading 12K tokens before any work = significant overhead

---

## Solution: Unified Context Lifecycle

### The Three Pillars

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONTEXT LIFECYCLE MANAGEMENT                    │
├─────────────────┬─────────────────────┬─────────────────────────┤
│   STRUCTURE     │      LOADING        │       AGING             │
│   (File Design) │   (What to Read)    │   (What to Keep)        │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ • TL;DR sections│ • Tiered loading    │ • Current → Aging       │
│ • Tables > prose│ • Lazy loading      │ • Aging → Archive       │
│ • Hot/warm/cold │ • Checkpoints       │ • Trigger-based moves   │
└─────────────────┴─────────────────────┴─────────────────────────┘
```

---

## Pillar 1: File Structure (Design for Efficiency)

### 1.1 TL;DR Pattern

Every dynamic file starts with a summary:

```markdown
# PROJECT_Session.md

## TL;DR
| Field | Value |
|-------|-------|
| Status | Active development |
| Last Session | 16 (2026-01-27) |
| Current Task | TASK-010 E20 Export |
| Next Action | Test exports with real tools |
| Blockers | None |

---

## Full Details
[Detailed content below - only read if needed]
```

**Benefit:** AI reads ~50 tokens to get current state, not ~1,200.

### 1.2 Tables Over Prose

```markdown
# Instead of (80 tokens):
The current active task is TASK-001 which involves implementing
a page access tracking system. This was started on January 19th
and is currently in progress...

# Use (40 tokens):
| Field | Value |
|-------|-------|
| Task | TASK-001: Page Tracking |
| Status | In Progress |
| Started | 2026-01-19 |
```

### 1.3 Temperature Zones

Organize content by access frequency:

```markdown
## Hot Zone (Always Current)
- Current session state
- Active tasks
- Immediate blockers

## Warm Zone (Recent/Relevant)
- Last 3 sessions summary
- Pending tasks
- Recent decisions

## Cold Zone (Archive Reference)
- Completed tasks (summary only)
- Historical sessions
- Superseded decisions
```

---

## Pillar 2: Loading Strategy (Read Smarter)

### 2.1 Loading Tiers

| Tier | When | Files |
|------|------|-------|
| **1: Mandatory** | Every session | CLAUDE.md, Session.md (TL;DR) |
| **2: Task-based** | When doing work | Tasks.md, Approvals.md |
| **3: On-demand** | When relevant | Decision_Log.md, Deployment.md, Exceptions.md |
| **4: Rarely** | Explicit request | Prompt_History.md, Archives, Inventory.md |

### 2.2 Task-Based Loading Matrix

| User Intent | Load These |
|-------------|------------|
| "Continue work" | Tier 1 + Tasks.md |
| "Deploy to production" | Tier 1 + Tasks.md + Deployment.md |
| "Make architecture decision" | Tier 1 + Decision_Log.md |
| "Debug styling issue" | Tier 1 + Exceptions.md |
| "Review what we did" | Tier 1 + Session.md (full) |
| "Full context" | All Tier 1-3 |

### 2.3 Lazy Loading Protocol

```markdown
## Session Start Protocol

1. Read CLAUDE.md (mandatory - project rules)
2. Read Session.md TL;DR only (~50 tokens)
3. Ask: "What would you like to work on?"
4. Load relevant files based on response
5. Begin work

Do NOT pre-load:
- Prompt_History.md (audit trail, rarely needed)
- Full Session.md history (TL;DR sufficient)
- Archive files (by definition, not current)
```

### 2.4 Context Checkpoints

Create lightweight snapshots for fast resume:

```markdown
# CHECKPOINT_2026-01-27.md

**Created:** 2026-01-27 14:00
**Token cost:** ~300 (vs ~5,000 full load)

## State Snapshot
- **Project:** CxMS v1.6
- **Phase:** E20 Multi-Tool Export complete
- **Active:** TASK-010 (testing)
- **Blockers:** None
- **Key Decision:** Merged E5+E6+E11 into E21

## Resume Prompt
"Read CHECKPOINT_2026-01-27.md and CLAUDE.md. Continue from E21 draft."
```

**Use checkpoints when:**
- Context is getting full (>75%)
- Ending a long session
- Before risky operations
- Handing off to another session

---

## Pillar 3: Aging Strategy (Keep Less)

### 3.1 File Lifecycle

```
CURRENT                    AGING                      ARCHIVE
(Active work)              (Recent history)           (Long-term)
     │                          │                          │
     │  Trigger: age/size       │  Trigger: 6+ months      │
     ├─────────────────────────→├─────────────────────────→│
     │                          │                          │
PROJECT_Session.md    PROJECT_Aging_Session.md    PROJECT_Archive_2026-H1.zip
PROJECT_Tasks.md      PROJECT_Aging_Tasks.md
```

### 3.2 Aging Triggers

| Trigger | Action |
|---------|--------|
| File > 200 lines | Review for aging candidates |
| Entry > 30 days old | Move to aging file |
| Task completed 5+ sessions ago | Move to aging |
| Session > 10 sessions ago | Move to aging |
| Aging file > 6 months | Archive to ZIP |

### 3.3 What Ages vs What Stays

**Ages (append-only, grows unbounded):**
- Session.md history entries
- Completed tasks
- Activity_Log.md entries
- Prompt_History.md (fastest growth)
- Issue_Log.md resolved issues

**Stays (reference value, bounded):**
- CLAUDE.md (project config)
- Decision_Log.md (architectural memory)
- Context.md (documentation index)
- Exceptions.md (active workarounds)

### 3.4 Aging File Format

```markdown
# PROJECT_Aging_Session.md

**Purpose:** Historical session entries moved from active file
**Created:** 2026-01-27
**Entries:** Sessions 1-10

---

## Session Summaries

| # | Date | Focus | Key Outcome |
|---|------|-------|-------------|
| 10 | 2026-01-25 | v1.5 release | E16, E17 implemented |
| 9 | 2026-01-25 | ASB game specs | 7 specs created |
| ... | ... | ... | ... |

---

## Detailed Entries (Archived)

### Session 10 (2026-01-25)
[Full details preserved for reference]
```

---

## Implementation

### Phase 1: Template Updates
- [ ] Add TL;DR sections to Session.md, Tasks.md templates
- [ ] Add temperature zone markers to templates
- [ ] Add loading tier metadata to CLAUDE.md template
- [ ] Create Aging file templates

### Phase 2: Agent Directives
- [ ] Add lazy loading protocol to CLAUDE.md
- [ ] Add aging triggers to session-end checklist
- [ ] Add checkpoint creation guidance
- [ ] Update startup prompts for tiered loading

### Phase 3: Tooling (Optional)
- [ ] `cxms-checkpoint` - Generate checkpoint file
- [ ] `cxms-age` - Move old entries to aging files
- [ ] `cxms-audit` - Report file sizes and aging candidates

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Session start tokens | ~12K | ~3K |
| Avg active file size | 150 lines | 80 lines |
| Time to productive | 30s | 10s |
| Compaction frequency | High | Low |

---

## Relationship to Other Enhancements

| Enhancement | Relationship |
|-------------|--------------|
| E7 (Context Freshness) | Complementary - E21 manages quantity, E7 manages quality |
| E8 (Output Efficiency) | Separate concern - AI verbosity, not file management |
| E10 (Health Check) | Synergy - Health check can flag aging candidates |

---

## Migration Notes

**This enhancement replaces:**
- E5: Context Compression Strategies → Absorbed into Pillar 1 (Structure)
- E6: Token Usage & Conservation → Absorbed into Pillar 2 (Loading)
- E11: Log Aging & Archival → Absorbed into Pillar 3 (Aging)

**Roadmap update:**
- Mark E5, E6, E11 as "Superseded by E21"
- E21 becomes the unified context efficiency enhancement
