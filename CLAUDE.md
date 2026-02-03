# CLAUDE.md

**Version:** 1.6
**Code Name:** Master Yoda

> *"Patience you must have. Document everything, you should. Future you, thank you will."*

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains **CxMS (Agent Context Management System)** - persistent memory for AI coding assistants through structured documentation.

**Core Principle:** AI context is temporary; files are permanent. Everything the AI needs to know must exist in files it can read.

## Repository Structure

```
CxMS/
├── README.md                              # Start here
├── CLAUDE.md                              # This file
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
├── tools/                                 # CLI utilities
│   ├── cxms-cascade.mjs                   # Config inheritance
│   ├── cxms-report.mjs                    # Telemetry
│   └── cxms-profile.mjs                   # Profile manager
│
└── docs/dashboard/                        # Community stats
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `CxMS_Introduction_and_Guide.md` | **Start here** - Overview, training, history |
| `CxMS_Practical_Implementation_Guide.md` | Implementation details and patterns |
| `templates/DEPLOYMENT.md` | Deployment levels (Lite/Standard/Max) |
| `templates/MIGRATION.md` | Fresh install or upgrade existing |

## Using This Repository

### To Learn About CxMS
1. Read `CxMS_Introduction_and_Guide.md`
2. Follow the "Getting Started in 10 Minutes" section
3. Reference `CxMS_Practical_Implementation_Guide.md` for details

### To Apply CxMS to Your Project
1. Copy core templates from `templates/core/` to your project
2. Customize `CLAUDE.md` with your project details
3. Follow the session lifecycle in the guides

## Session Lifecycle

```
START → Read CLAUDE.md → Read Session.md → WORK → Update Session.md → END
```

Always update Session.md before ending a session!

## Contributing

- Issues/PRs welcome
- Contact: opencxms@proton.me

## License

MIT License - See LICENSE file
