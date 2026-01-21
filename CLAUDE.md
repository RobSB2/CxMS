# CLAUDE.md

**Version:** 1.0

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
├── templates/                                   # Reusable project templates (16 total)
│   │
│   │── # Core Templates (Required)
│   ├── CLAUDE.md.template                       # Project overview with mandatory requirements
│   ├── PROJECT_Context.md.template              # Documentation index
│   ├── PROJECT_Session.md.template              # Current state (dynamic)
│   ├── PROJECT_Tasks.md.template                # Task tracker
│   ├── PROJECT_Prompt_History.md.template       # Audit trail
│   ├── SESSION_START_PROMPTS.md                 # Copy-paste session prompts
│   │
│   │── # Log Templates (Optional)
│   ├── PROJECT_Activity_Log.md.template         # What was done (DEP, DB, CFG)
│   ├── PROJECT_Decision_Log.md.template         # Why decisions were made
│   ├── PROJECT_Issue_Log.md.template            # Problems and resolutions
│   ├── PROJECT_Session_Summary.md.template      # Quick session reference
│   ├── PROJECT_Deployment.md.template           # TEST/PROD tracking
│   ├── PROJECT_Compaction_Log.md.template       # Context loss events
│   ├── PROJECT_Performance_Review.md.template   # CxMS effectiveness metrics (E9)
│   │
│   │── # Project Documentation Templates (Optional)
│   ├── PROJECT_Plan.md.template                 # Multi-phase project planning
│   ├── PROJECT_Inventory.md.template            # Component/endpoint inventory
│   ├── PROJECT_Strategy.md.template             # AI workflow strategy
│   └── PROJECT_Exceptions.md.template           # Technical workarounds
│
├── case-studies/                                # Real-world implementations
│   └── LPR_LandTools_Case_Study.md              # Enterprise land management example
│
├── CxMS_Enhancement_Exploration.md              # Future enhancement ideas (RFC)
│
├── # CxMS Self-Tracking (dogfooding)
├── CxMS_Session.md                              # Current development state
├── CxMS_Tasks.md                                # Development task tracker
│
└── Archive/                                     # Historical reference
    └── v1-theoretical/                          # Original documentation
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `CxMS_Introduction_and_Guide.md` | **Start here** - Overview, training, history, and why to use CxMS |
| `CxMS_Practical_Implementation_Guide.md` | The formalized 5-file system with templates |
| `templates/` | Ready-to-use templates for new projects (16 templates) |

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

### Log Files (Optional - 6 files)
For tracking activities, decisions, and issues:

| File | Purpose | When to Use |
|------|---------|-------------|
| `[PROJECT]_Activity_Log.md` | What was done (deployments, DB changes) | Track significant actions |
| `[PROJECT]_Decision_Log.md` | Why decisions were made | Architectural choices |
| `[PROJECT]_Issue_Log.md` | Problems and resolutions | Debug patterns |
| `[PROJECT]_Session_Summary.md` | Quick session reference | Fast overview needed |
| `[PROJECT]_Deployment.md` | TEST/PROD status | Multi-environment projects |
| `[PROJECT]_Compaction_Log.md` | Context loss events | Debug context issues |

### Project Documentation (Optional - 4 files)
For complex projects:

| File | Purpose | When to Use |
|------|---------|-------------|
| `[PROJECT]_Plan.md` | Multi-phase project plan | Large features/initiatives |
| `[PROJECT]_Inventory.md` | Component/endpoint listing | Complex codebases |
| `[PROJECT]_Strategy.md` | AI workflow documentation | Long-running AI work |
| `[PROJECT]_Exceptions.md` | Technical workarounds | Edge cases accumulate |

**Total: 5 required + 6 logs + 4 project docs = 15 files maximum**

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
