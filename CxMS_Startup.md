# CxMS Session Startup

**Purpose:** Single prompt to initialize a fully-contextualized session
**Usage:** "Read CxMS_Startup.md and follow its instructions"

---

## Startup Sequence

Execute these steps in order:

### 1. Read Core Files
Read these files completely (in this order):
- `CLAUDE.md` - Project overview, CxMS conventions
- `CxMS_Approvals.md` - Pre-approved operations (DO NOT prompt for these)
- `CxMS_Session.md` - Current state, last session, what's in progress
- `CxMS_Tasks.md` - Active and pending tasks

### 2. Read Context Files (as needed)
- `CxMS_Product_Roadmap.md` - Enhancement specs and priorities
- `CxMS_Prompt_Library.md` - Prompt patterns

### 3. Version & Health Check
Per CLAUDE.md instructions:
1. Fetch `https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/VERSIONS.md`
2. Compare to local version
3. Run deployment health check

### 4. Check Context Status
If `.claude/context-status.json` exists, read it:
```bash
cat .claude/context-status.json
```
Monitor `ctx_pct` throughout session. Alert user if it exceeds 75%.

### 5. Check Telemetry Consent
Check if `.cxms/telemetry-consent.json` exists:
- **If missing:** Ask user once: "CxMS can send anonymous usage metrics to help improve the system. Enable telemetry? (You can revoke anytime)"
  - If yes: Run `node tools/cxms-report.mjs --consent`
  - If no: Run `node tools/cxms-report.mjs --revoke`
- **If exists with `consented: true`:** Note for session end (will auto-submit)
- **If exists with `consented: false`:** Skip telemetry entirely

### 6. Provide Session Summary

```
## Session Ready

**Project:** CxMS (Agent Context Management System)
**Version:** [from CLAUDE.md]
**Context:** [X]% used (or "unknown")
**Last Session:** [date and number from Session.md]
**Last Accomplishments:** [bullet points]

**Current State:**
- Templates: [count]
- Enhancements: [count documented / count implemented]
- Tools: [count]

**Active Tasks:**
- [from Tasks.md]

**Pre-Approved:** Git ops, file ops, npm, node, gh CLI
**Always Ask:** Deletions, force push

**Telemetry:** [Enabled - will auto-submit at session end | Disabled | Not configured]

**Suggested Next Action:** [based on tasks and roadmap]

Awaiting instructions.
```

### 7. Apply Approvals

For the remainder of this session:
- Do NOT prompt for operations listed in CxMS_Approvals.md
- DO prompt for anything marked "ALWAYS ASK"
- When user grants new permissions, add them to CxMS_Approvals.md

---

## Quick Start

```
Read CxMS_Startup.md and follow its instructions.
```

---

## Session End Reminder

Before ending:
1. Update `CxMS_Session.md` - Current state
2. Update `CxMS_Tasks.md` - Mark completed, add new
3. **If telemetry consented:** Run `node tools/cxms-report.mjs --auto`
4. Commit changes
