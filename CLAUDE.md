# CLAUDE.md

**Version:** 1.4
**Code Name:** Master Yoda
**Deployment Level:** Max

> *"Patience you must have. Document everything, you should. Future you, thank you will."*

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CxMS Version & Health Check

On session start, after summarizing current state:

**Version Check:**
1. Read `CxMS Version` from this file (1.4)
2. Fetch: `https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/VERSIONS.md`
3. Compare versions - if local < remote, notify user
4. If user accepts, follow `templates/MIGRATION.md` update process

**Health Check:**
1. Read `Deployment Level` from this file (Max)
2. Inventory CxMS files, check for level-up signals per `templates/DEPLOYMENT.md`
3. Report any recommendations

*Skip version check silently if fetch fails (offline). Health check runs locally.*

## Context Monitoring (CRITICAL)

**On Session Start:**
- Note current context usage (if visible in UI)
- Be aware of "Context left until auto-compact" indicator

**During Session:**
- Monitor context consumption, especially during large file reads
- At ~75% full, alert user: "Context is getting full. Should we do a checkpoint save?"
- At ~90% full, STOP and perform pre-compaction save immediately

**Pre-Compaction Save Protocol:**
1. Immediately update `CxMS_Session.md` with current state
2. List any work in progress with specific file:line references
3. Note any uncommitted decisions or pending items
4. Confirm save before continuing

## Overview

This repository contains **CxMS (Agent Context Management System)** - persistent memory for AI coding assistants through structured documentation.

**Core Principle:** AI context is temporary; files are permanent. Everything the AI needs to know must exist in files it can read.

## Repository Structure

```
Context_Managment_System/
│
├── README.md                                    # GitHub landing page
├── CLAUDE.md                                    # This file - AI guidance
├── CxMS_Introduction_and_Guide.md               # START HERE - Overview, training, history
├── CxMS_Practical_Implementation_Guide.md       # THE SYSTEM - templates and patterns
│
├── templates/                                   # Reusable project templates (25 total)
│   ├── DEPLOYMENT.md                            # Deployment guide (Lite/Standard/Max)
│   ├── MIGRATION.md                             # Fresh install & upgrade guide
│   │
│   ├── core/                                    # Required templates (8)
│   │   ├── CLAUDE.md.template
│   │   ├── CLAUDE.md.existing-project.template  # For adding CxMS to existing projects
│   │   ├── PROJECT_Context.md.template
│   │   ├── PROJECT_Session.md.template
│   │   ├── PROJECT_Tasks.md.template
│   │   ├── PROJECT_Prompt_History.md.template
│   │   ├── SESSION_START_PROMPTS.md
│   │   └── SESSION_END_CHECKLIST.md             # Session wrap-up workflow
│   │
│   ├── logs/                                    # Optional logging (7)
│   │   ├── PROJECT_Activity_Log.md.template
│   │   ├── PROJECT_Decision_Log.md.template
│   │   ├── PROJECT_Issue_Log.md.template
│   │   ├── PROJECT_Session_Summary.md.template
│   │   ├── PROJECT_Deployment.md.template
│   │   ├── PROJECT_Compaction_Log.md.template
│   │   └── PROJECT_Performance_Log.md.template
│   │
│   ├── docs/                                    # Optional documentation (5)
│   │   ├── PROJECT_Plan.md.template
│   │   ├── PROJECT_Inventory.md.template
│   │   ├── PROJECT_Strategy.md.template
│   │   ├── PROJECT_Exceptions.md.template
│   │   └── PROJECT_Prompt_Library.md.template
│   │
│   └── multi-tool/                              # Tool-specific configs (5)
│       ├── GEMINI.md.template
│       ├── copilot-instructions.md.template
│       ├── cursorrules.template
│       ├── CONVENTIONS.md.template
│       └── MULTI-TOOL-DEPLOYMENT.md
│
├── case-studies/                                # Real-world implementations
│   └── LPR_LandTools_Case_Study.md              # Enterprise land management example
│
├── CxMS_Product_Roadmap.md                      # 15 enhancements documented
│
├── # CxMS Self-Tracking (dogfooding - 8 files)
├── CxMS_Session.md                              # Current development state
├── CxMS_Tasks.md                                # Development task tracker
├── CxMS_Prompt_Library.md                       # Curated prompts with analysis
├── CxMS_Performance_Log.md                      # Metrics tracking
├── CxMS_Activity_Log.md                         # Activity history
├── CxMS_Decision_Log.md                         # Design decisions
├── CxMS_Prompt_History.md                       # Prompt audit trail
│
└── Archive/                                     # Historical reference
    └── v1-theoretical/                          # Original documentation
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `CxMS_Introduction_and_Guide.md` | **Start here** - Overview, training, history, and why to use CxMS |
| `CxMS_Practical_Implementation_Guide.md` | Implementation details and patterns |
| `templates/DEPLOYMENT.md` | Deployment levels (Lite/Standard/Max) |
| `templates/MIGRATION.md` | Fresh install or upgrade existing |
| `templates/` | Ready-to-use templates (25 total) |

## The CxMS File System

### Core Files (Required - 5 files)
Every project using CxMS needs these files:

| File | Type | Update Frequency | Template |
|------|------|------------------|----------|
| `CLAUDE.md` | Static | Rarely | `CLAUDE.md.template` |
| `[PROJECT]_Context.md` | Static | When docs change | `PROJECT_Context.md.template` |
| `[PROJECT]_Session.md` | Dynamic | **Every session** | `PROJECT_Session.md.template` |
| `[PROJECT]_Tasks.md` | Dynamic | As tasks change | `PROJECT_Tasks.md.template` |
| `[PROJECT]_Prompt_History.md` | Append-only | Each prompt | `PROJECT_Prompt_History.md.template` |

### Log Files (Optional - 7 files)
For tracking activities, decisions, and issues:

| File | Purpose | When to Use |
|------|---------|-------------|
| `[PROJECT]_Activity_Log.md` | What was done (deployments, DB changes) | Track significant actions |
| `[PROJECT]_Decision_Log.md` | Why decisions were made | Architectural choices |
| `[PROJECT]_Issue_Log.md` | Problems and resolutions | Debug patterns |
| `[PROJECT]_Session_Summary.md` | Quick session reference | Fast overview needed |
| `[PROJECT]_Deployment.md` | TEST/PROD status | Multi-environment projects |
| `[PROJECT]_Compaction_Log.md` | Context loss events | Debug context issues |
| `[PROJECT]_Performance_Log.md` | CxMS effectiveness metrics | Periodic review (30-60 days) |

### Project Documentation (Optional - 5 files)
For complex projects:

| File | Purpose | When to Use |
|------|---------|-------------|
| `[PROJECT]_Plan.md` | Multi-phase project plan | Large features/initiatives |
| `[PROJECT]_Inventory.md` | Component/endpoint listing | Complex codebases |
| `[PROJECT]_Strategy.md` | AI workflow documentation | Long-running AI work |
| `[PROJECT]_Exceptions.md` | Technical workarounds | Edge cases accumulate |
| `[PROJECT]_Prompt_Library.md` | Curated prompts with analysis | Prompt engineering training |

**Total: 5 required + 7 logs + 5 project docs = 17 files maximum**

## Using This Repository

### To Learn About CxMS (New Users)
1. Read `CxMS_Introduction_and_Guide.md` - explains the problem, history, and how it works
2. Follow the "Getting Started in 10 Minutes" section
3. Reference `CxMS_Practical_Implementation_Guide.md` for detailed templates

### To Apply CxMS to a New Project
1. Copy core templates from `templates/` to your project:
   - `CLAUDE.md.template` → `CLAUDE.md`
   - `PROJECT_Session.md.template` → `[YourProject]_Session.md`
   - `PROJECT_Tasks.md.template` → `[YourProject]_Tasks.md`
2. Customize `CLAUDE.md` with your project details
3. Optionally copy additional templates as needed (Context, Prompt_History, logs)
4. Follow the session lifecycle in `CxMS_Practical_Implementation_Guide.md`

### To Implement Advanced Features
1. Review optional log templates in `templates/` folder
2. Choose which optional files fit your project needs
3. Add templates as your project complexity grows

## Archive Contents

The `Archive/` folder contains:

- **v1-theoretical/** - Original documentation from early development

These are preserved for historical reference but superseded by the current guides.

## Session Management

When working in this repo:
1. Read this file first
2. For overview/training: Read `CxMS_Introduction_and_Guide.md`
3. For implementation details: Read `CxMS_Practical_Implementation_Guide.md`
4. Use templates when starting new projects

## Document Reading Order

| Goal | Read These |
|------|------------|
| Learn what CxMS is | `CxMS_Introduction_and_Guide.md` |
| Implement CxMS (basic) | `CxMS_Practical_Implementation_Guide.md` → core templates |
| Add advanced logging | Log templates in `templates/` folder |
| Plan large projects | `PROJECT_Plan.md.template`, `PROJECT_Strategy.md.template` |
| Track deployments | `PROJECT_Deployment.md.template`, `PROJECT_Activity_Log.md.template` |
| Document complex codebases | `PROJECT_Inventory.md.template`, `PROJECT_Exceptions.md.template` |

## Template Quick Reference

| Need | Template to Use |
|------|-----------------|
| Start any project | `CLAUDE.md.template`, `PROJECT_Session.md.template`, `PROJECT_Tasks.md.template` |
| Track what was asked | `PROJECT_Prompt_History.md.template` |
| Track what was done | `PROJECT_Activity_Log.md.template` |
| Track why decisions | `PROJECT_Decision_Log.md.template` |
| Track problems | `PROJECT_Issue_Log.md.template` |
| Multi-environment deploy | `PROJECT_Deployment.md.template` |
| Large feature planning | `PROJECT_Plan.md.template` |
| Complex codebase | `PROJECT_Inventory.md.template` |
| AI workflow docs | `PROJECT_Strategy.md.template` |
| Technical workarounds | `PROJECT_Exceptions.md.template` |
| CxMS effectiveness metrics | `PROJECT_Performance_Log.md.template` |
| Prompt engineering training | `PROJECT_Prompt_Library.md.template` |
| Adding CxMS to existing project | `CLAUDE.md.existing-project.template` |
| Session wrap-up workflow | `SESSION_END_CHECKLIST.md` |
