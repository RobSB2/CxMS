# CxMS Deployment Guide

**Version:** 1.0
**CxMS Template Version:** 1.3

This guide helps you deploy CxMS to your project based on your needs.

---

## Quick Start

1. Choose your deployment level (Lite, Standard, or Max)
2. Copy the required templates to your project
3. Rename `PROJECT_*.md` files to `[YourProject]_*.md`
4. Customize `CLAUDE.md` with your project details
5. Start your first session

**Already using CxMS?** See [MIGRATION.md](MIGRATION.md) for upgrade instructions.

---

## Deployment Levels

### Lite (3 files)
**Best for:** Quick experiments, simple projects, solo developers

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project overview and AI instructions |
| `[PROJECT]_Session.md` | Current state tracking |
| `[PROJECT]_Tasks.md` | Task management |

**Copy from:**
```
templates/core/CLAUDE.md.template
templates/core/PROJECT_Session.md.template
templates/core/PROJECT_Tasks.md.template
```

**Pros:** Minimal overhead, fast setup
**Cons:** Limited audit trail, no decision history

---

### Standard (9 files)
**Best for:** Most projects, team collaboration, ongoing development

**Includes everything in Lite, plus:**

| File | Purpose |
|------|---------|
| `[PROJECT]_Context.md` | Documentation index |
| `[PROJECT]_Prompt_History.md` | Audit trail of prompts |
| `[PROJECT]_Activity_Log.md` | What was done |
| `[PROJECT]_Decision_Log.md` | Why decisions were made |
| `[PROJECT]_Issue_Log.md` | Problems and resolutions |
| `SESSION_START_PROMPTS.md` | Ready-to-use session prompts |

**Copy from:**
```
# Core (required)
templates/core/CLAUDE.md.template
templates/core/PROJECT_Context.md.template
templates/core/PROJECT_Session.md.template
templates/core/PROJECT_Tasks.md.template
templates/core/PROJECT_Prompt_History.md.template
templates/core/SESSION_START_PROMPTS.md

# Logs (recommended)
templates/logs/PROJECT_Activity_Log.md.template
templates/logs/PROJECT_Decision_Log.md.template
templates/logs/PROJECT_Issue_Log.md.template
```

**Pros:** Good balance of tracking and overhead
**Cons:** More files to maintain

---

### Max (17 files)
**Best for:** Enterprise projects, complex systems, multi-environment deployments

**Includes everything in Standard, plus:**

| File | Purpose |
|------|---------|
| `[PROJECT]_Session_Summary.md` | Quick session reference |
| `[PROJECT]_Deployment.md` | TEST/PROD environment tracking |
| `[PROJECT]_Compaction_Log.md` | Context loss events |
| `[PROJECT]_Performance_Log.md` | CxMS effectiveness metrics |
| `[PROJECT]_Plan.md` | Multi-phase project planning |
| `[PROJECT]_Inventory.md` | Component/endpoint listing |
| `[PROJECT]_Strategy.md` | AI workflow documentation |
| `[PROJECT]_Exceptions.md` | Technical workarounds |

**Copy from:**
```
# Everything in templates/core/
# Everything in templates/logs/
# Everything in templates/docs/
```

**Pros:** Complete tracking, enterprise-ready
**Cons:** Significant overhead, requires discipline

---

## Template Folder Structure

```
templates/
├── DEPLOYMENT.md          # This file
├── core/                   # Required templates (6 files)
│   ├── CLAUDE.md.template
│   ├── PROJECT_Context.md.template
│   ├── PROJECT_Session.md.template
│   ├── PROJECT_Tasks.md.template
│   ├── PROJECT_Prompt_History.md.template
│   └── SESSION_START_PROMPTS.md
│
├── logs/                   # Optional logging (7 files)
│   ├── PROJECT_Activity_Log.md.template
│   ├── PROJECT_Decision_Log.md.template
│   ├── PROJECT_Issue_Log.md.template
│   ├── PROJECT_Session_Summary.md.template
│   ├── PROJECT_Deployment.md.template
│   ├── PROJECT_Compaction_Log.md.template
│   └── PROJECT_Performance_Log.md.template
│
└── docs/                   # Optional documentation (4 files)
    ├── PROJECT_Plan.md.template
    ├── PROJECT_Inventory.md.template
    ├── PROJECT_Strategy.md.template
    └── PROJECT_Exceptions.md.template
```

---

## Deployment from GitHub

### Option 1: Clone and Copy
```bash
# Clone the CxMS repository
git clone https://github.com/RobSB2/CxMS.git

# Copy templates to your project (example: Standard level)
cp CxMS/templates/core/* /path/to/your/project/
cp CxMS/templates/logs/PROJECT_Activity_Log.md.template /path/to/your/project/
cp CxMS/templates/logs/PROJECT_Decision_Log.md.template /path/to/your/project/
cp CxMS/templates/logs/PROJECT_Issue_Log.md.template /path/to/your/project/

# Rename templates
cd /path/to/your/project/
mv CLAUDE.md.template CLAUDE.md
mv PROJECT_Session.md.template MyProject_Session.md
mv PROJECT_Tasks.md.template MyProject_Tasks.md
# ... etc
```

### Option 2: Download ZIP
1. Go to https://github.com/RobSB2/CxMS
2. Click "Code" → "Download ZIP"
3. Extract and copy desired templates

### Option 3: Raw File Download
```bash
# Download individual files (example: Lite level)
curl -O https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/core/CLAUDE.md.template
curl -O https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/core/PROJECT_Session.md.template
curl -O https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/core/PROJECT_Tasks.md.template
```

---

## Post-Deployment Checklist

- [ ] Rename all `PROJECT_*.md` files to `[YourProject]_*.md`
- [ ] Edit `CLAUDE.md` with your project overview
- [ ] Remove `.template` extension from all files
- [ ] Add CxMS files to version control (or `.gitignore` as preferred)
- [ ] Test session start prompt: "Read CLAUDE.md and [Project]_Session.md..."

---

## Choosing Your Level

| Question | Lite | Standard | Max |
|----------|------|----------|-----|
| Solo or team? | Solo | Either | Team |
| Project duration? | Days/weeks | Weeks/months | Months/years |
| Need audit trail? | No | Yes | Yes |
| Multi-environment? | No | Maybe | Yes |
| Complex architecture? | No | Maybe | Yes |
| Regulatory compliance? | No | Maybe | Yes |

**When in doubt, start with Standard.** You can always add more files later.

---

## Upgrading Levels

Moving from Lite → Standard → Max is easy:

1. Copy additional templates from the repository
2. Rename with your project name
3. Backfill historical data if desired
4. Update `CLAUDE.md` to reference new files

---

## Version Information

| Field | Value |
|-------|-------|
| CxMS Version | 1.3 |
| Deployment Guide Version | 1.0 |
| Last Updated | 2026-01-24 |

See [MIGRATION.md](../MIGRATION.md) for upgrade instructions between CxMS versions.
