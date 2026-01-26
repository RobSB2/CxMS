# CxMS - Tasks

**Template Version:** 1.0
**Purpose:** Track development tasks for CxMS itself
**Last Updated:** 2026-01-26 (Session 11)

---

## Active Tasks

### TASK-006: E16 + E17 Implementation
**Status:** Complete
**Priority:** High
**Description:** Implement E16 (convention inheritance) and E17 (approvals) to fix session friction

**Checklist:**
- [x] Document E16 in CxMS_Product_Roadmap.md
- [x] Fix ASB's CLAUDE.md with parent reference
- [x] Create ASB_Prompt_Library.md
- [x] Create PROJECT_Approvals.md.template (E17)
- [x] Update CLAUDE.md.template with Approvals in session start
- [x] Create ASB_Approvals.md
- [x] Update VERSIONS.md (v1.5)
- [x] Document E17 in roadmap

**Completed:** Session 10, 2026-01-25

---

### TASK-003: Metrics Monitoring Period
**Status:** In Progress
**Priority:** Medium
**Description:** Track CxMS metrics for 30-60 days to validate Enhancement 9

**Checklist:**
- [x] Implement metrics in CxMS_Session.md
- [x] Implement metrics in LPR_Session.md
- [ ] Track metrics for 30-60 days
- [ ] Compile performance review
- [ ] Update case study with real data

**Next Action:** Continue normal usage while tracking metrics

---

## Pending / Future

### TASK-008: Telemetry --quiet Flag
**Status:** Pending
**Priority:** Low
**Description:** Add `--quiet` flag to cxms-report.mjs for minimal output in auto mode

**Rationale:** Current auto-submit prints verbose output which creates perceived slowness. A quiet mode would output only success/failure for cleaner session-end experience.

**Next Action:** Implement when telemetry friction becomes noticeable

---

### TASK-007: PowerShell Statusline Script
**Status:** Pending
**Priority:** Medium
**Description:** Create Windows-native PowerShell version of statusline-command.sh for context monitoring

**Checklist:**
- [ ] Create statusline-command.ps1 in tools/
- [ ] Handle JSON input parsing with PowerShell
- [ ] Write context-status.json output
- [ ] Test on Windows
- [ ] Update templates with Windows instructions

**Next Action:** Port bash script logic to PowerShell

---

### TASK-004: Apprentice Strikes Back Live Stream
**Status:** Pending
**Priority:** High
**Description:** Build blackjack trainer app live on stream

**Checklist:**
- [x] Create GitHub repo and project structure
- [x] Save PROJECT_PLAN.md and STREAM_SCRIPT.md
- [ ] Complete pre-stream prep (Supabase tables, Vercel account)
- [ ] Run live stream demo
- [ ] Deploy to Vercel

**Next Action:** Complete Supabase pre-stream prep

---

### TASK-005: Telemetry Dashboard
**Status:** Pending
**Priority:** Medium
**Description:** Create public dashboard for CxMS community stats

**Checklist:**
- [x] Supabase backend deployed
- [x] First submission recorded
- [ ] Create GitHub Pages dashboard (or README badges)
- [ ] Publish npm package (cxms-report)

**Next Action:** Gather more submissions, then build dashboard

---

### TASK-001: Enhancement Prototyping
**Status:** Partially Complete
**Priority:** Medium
**Description:** Prototype remaining enhancements from CxMS_Enhancement_Exploration.md

Candidates (by priority):
1. ~~Cross-Agent Coordination Protocol (E1)~~ - **DESIGNED (UACF in telemetry spec)**
2. Multi-Agent CxMS Orchestration (E12) - enterprise scenarios
3. Token Usage & Conservation (E6)
4. Context Usage & Conservation (E7)

**Next Action:** E1 protocol designed, needs real-world testing

---

### TASK-002: Community Feedback Integration
**Status:** Pending
**Priority:** Low
**Description:** Monitor GitHub issues/discussions for feedback

**Next Action:** Wait for community input

---

## Completed

### Session 11 - E18 Automated Telemetry (2026-01-26)
- [x] Add consent management to cxms-report.mjs (--consent, --revoke, --status, --auto)
- [x] Create .cxms/telemetry-consent.json storage
- [x] Update PROJECT_Startup.md.template with consent check
- [x] Fix version extraction regex for "CxMS Version:" pattern
- [x] Update ASB CLAUDE.md with Deployment Level
- [x] Make ASB fully independent (parent = optional reference)
- [x] Document DEC-007: Child Project Independence
- [x] Grant telemetry consent for CxMS and ASB
- [x] Document E18 in roadmap

### Session 8 - Telemetry System & Apprentice Prep (2026-01-25)
- [x] Create Apprentice Strikes Back project structure
- [x] Save PROJECT_PLAN.md with full vision/tech stack
- [x] Create STREAM_SCRIPT.md with copy-paste prompts
- [x] Push to GitHub (ApprenticeStrikesBack repo)
- [x] Design comprehensive telemetry spec (11 data categories)
- [x] Design Universal Multi-Agent Coordination Protocol (UACF)
- [x] Build cxms-report.mjs script
- [x] Create Supabase schema with 6 views
- [x] Deploy Supabase backend
- [x] First telemetry submission recorded!
- [x] Add --yes flag for auto-consent
- [x] Add timezone/locale/timing capture

### Session 3 - Dogfooding & E12 (2026-01-21)
- [x] Add Enhancement 11 (Log Aging & Archival)
- [x] Rename Performance_Review → Performance_Log template
- [x] Update 8 files with Performance_Log references
- [x] Create CxMS_Performance_Log.md
- [x] Create CxMS_Activity_Log.md
- [x] Create CxMS_Decision_Log.md
- [x] Create CxMS_Prompt_History.md
- [x] Update LPR CLAUDE.md to v1.2 (E10, E11 awareness)
- [x] Create LPR_Performance_Log.md
- [x] Clean up LPR_Session.md
- [x] Add Enhancement 12 (Multi-Agent CxMS Orchestration)
- [x] Research Ralph Wiggum + Anthropic multi-agent patterns

### v1.1 Release - Enhancement 9 (2026-01-20)
- [x] Add Performance Monitoring enhancement to exploration doc
- [x] Create PROJECT_Performance_Log.md.template (17th template)
- [x] Update PROJECT_Session.md.template with metrics
- [x] Update CLAUDE.md.template with metrics instructions
- [x] Update SESSION_START_PROMPTS.md with metrics prompts
- [x] Update CxMS_Practical_Implementation_Guide.md
- [x] Update README.md with AI compatibility section
- [x] Add "Context Value > Token Cost" principle

### v1.0 Release (2026-01-20)
- [x] Finalize all 16 templates
- [x] Complete Introduction and Guide
- [x] Complete Implementation Guide
- [x] Create LPR case study
- [x] Rename to Agent Context Management System
- [x] Publish to GitHub
- [x] Add topics for discoverability
- [x] Set up CxMS self-tracking

---

## Task Template

```markdown
### TASK-XXX: [Title]
**Status:** Pending | In Progress | Blocked | Complete
**Priority:** High | Medium | Low
**Description:** [What needs to be done]

**Checklist:**
- [ ] Step 1
- [ ] Step 2

**Next Action:** [Specific next step]
```
