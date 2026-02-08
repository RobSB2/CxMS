# CLAUDE.md

**Version:** 2.0
**Code Name:** Master Yoda

> *"Patience you must have. Document everything, you should. Future you, thank you will."*

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains **CxMS (Agent Context Management System)** - persistent memory for AI coding assistants through structured documentation.

**Core Principle:** AI context is temporary; files are permanent. Everything the AI needs to know must exist in files it can read.

## Hooks (Active)

CxMS hooks are configured in `.claude/settings.json` and run automatically:

| Hook | Script | Purpose |
|------|--------|---------|
| **SessionStart** | `tools/cxms-session-start.mjs` | Creates startup enforcement state, reads coordination file, outputs banner |
| **PreToolUse** | `tools/cxms-context-warn.mjs` | **Enforces startup sequence** + blocks at 80% context + compaction recovery |
| **PostToolUse** | `tools/cxms-context-check.mjs` | Breadcrumb tracking, startup completion detection, checkpoint enforcement |
| **PreCompact** | `tools/cxms-pre-compact.mjs` | Saves comprehensive recovery state before compaction |
| **SessionEnd** | `tools/cxms-session-end.mjs` | Saves session state, updates coordination file |

## Context Monitoring

Automated by hooks. When the 80% gate blocks you: save session state and tell user to start a new session.

## Repository Structure

```
CxMS/
├── CLAUDE.md                              # This file
├── README.md                              # Start here
├── CxMS_Introduction_and_Guide.md         # Full training guide
├── CxMS_Practical_Implementation_Guide.md # Implementation details
│
├── templates/                             # Ready-to-use templates
│   ├── DEPLOYMENT.md                      # Lite/Standard/Max levels
│   ├── MIGRATION.md                       # Install & upgrade guide
│   ├── VERSIONS.md                        # Version history
│   ├── core/                              # Required templates
│   ├── logs/                              # Optional logging
│   ├── docs/                              # Optional documentation
│   ├── multi-tool/                        # Cursor, Copilot, Aider, etc.
│   └── profiles/                          # Role-based profiles
│
├── tools/                                 # CLI utilities & hook scripts
│   ├── cxms-cascade.mjs                   # Config inheritance
│   ├── cxms-report.mjs                    # Telemetry
│   ├── cxms-profile.mjs                   # Profile manager
│   ├── cxms-session-start.mjs             # Session start + startup enforcement
│   ├── cxms-context-warn.mjs              # PreToolUse gate (startup + context)
│   ├── cxms-context-check.mjs             # PostToolUse (breadcrumbs + completion)
│   ├── cxms-pre-compact.mjs               # Pre-compaction save
│   ├── cxms-session-end.mjs               # Session end save + coordination
│   └── cxms-memory-bridge.mjs             # Memory bridge (auto-persist)
│
├── opencxms-website/                      # opencxms.org (Next.js)
└── docs/dashboard/                        # Community stats
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `CxMS_Introduction_and_Guide.md` | **Start here** - Overview, training, history |
| `CxMS_Practical_Implementation_Guide.md` | Implementation details and patterns |
| `templates/DEPLOYMENT.md` | Deployment levels (Lite/Standard/Max) |
| `templates/MIGRATION.md` | Fresh install or upgrade existing |

## Session Lifecycle

```
START → Hooks fire → Read CLAUDE.md → WORK → Hooks save state → END
```

## Contributing

- Issues/PRs welcome
- Contact: opencxms@proton.me

## License

MIT License - See LICENSE file
