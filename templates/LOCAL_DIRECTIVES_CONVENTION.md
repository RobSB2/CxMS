# Local Directives Convention

**Version:** 1.0
**Status:** Convention (not a rigid standard)
**Pattern:** ColdFusion Application.cfm / CSS Cascade

---

## Overview

Local directives provide **private, gitignored configuration** that cascades based on proximity to the working code. Like CSS specificity or ColdFusion's `Application.cfm`, the closest directive to your current context has the highest priority.

This complements the public cascade (GLOBAL → WORKSPACE → PROJECT) with a private layer that never leaves your machine.

---

## Directory Structure

```
.local.env/
├── .topic/           # Hidden topic folder (optional dot prefix)
│   ├── .README.md    # Hidden docs
│   └── CLAUDE.md     # AI directives for this topic
├── configs/          # Visible topic folder
│   └── CLAUDE.md
└── README.md         # Root-level local docs
```

**Key principle:** The `.local.env/` folder can exist at ANY level of your directory hierarchy.

---

## Cascade Resolution

Directives are resolved by walking UP the directory tree. **Nearest wins.**

```
C:\Users\Public\                              # Level 4 (lowest priority)
└── .local.env/
    └── CLAUDE.md                             # "Use formal tone"

C:\Users\Public\PhpstormProjects\             # Level 3
└── .local.env/
    └── CLAUDE.md                             # "Use TypeScript"

C:\Users\Public\PhpstormProjects\myapp\       # Level 2
└── .local.env/
    └── CLAUDE.md                             # "Use React 19"

C:\Users\Public\PhpstormProjects\myapp\src\   # Level 1 (highest priority)
└── .local.env/
    └── CLAUDE.md                             # "Use Tailwind v4"
```

When working in `myapp/src/`, all four levels apply, but conflicts resolve to Level 1.

---

## Gitignore Pattern

Add to your global or project `.gitignore`:

```gitignore
# Local directives (never committed)
.local.env/
```

This ensures local directives remain private regardless of where they're placed.

---

## Topic Organization

Topics are **operator-defined** - organize however makes sense for your context:

```
.local.env/
├── .business/        # Pricing, client info, NDAs
├── .credentials/     # API keys, tokens (extra hidden)
├── .personal/        # Work style preferences
├── configs/          # Tool configurations
├── prompts/          # Reusable prompt snippets
└── scratch/          # Temporary working notes
```

**Hidden prefix (`.`):** Use for sensitive topics. Double-hidden: `.local.env/.credentials/`

---

## File Types

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI directives (read by Claude Code) |
| `GEMINI.md` | AI directives (read by Gemini CLI) |
| `README.md` | Human documentation |
| `.README.md` | Hidden human documentation |
| `*.local.md` | Any private markdown |

---

## Inheritance Markers

Within local directive files, use E22 cascade markers:

```markdown
## API Standards

[INHERIT] Use REST conventions from parent
[OVERRIDE] But use camelCase for this project
[REQUIRED] All endpoints must have OpenAPI docs
```

---

## Example: Multi-Level Setup

**Global** (`C:\Users\Public\.local.env\CLAUDE.md`):
```markdown
# Global Preferences
- Prefer TypeScript over JavaScript
- Use conventional commits
- Never commit secrets
```

**Workspace** (`C:\Users\Public\PhpstormProjects\.local.env\CLAUDE.md`):
```markdown
# Workspace Standards
[INHERIT] Global preferences
- Use pnpm for package management
- Run tests before committing
```

**Project** (`C:\Users\Public\PhpstormProjects\myapp\.local.env\CLAUDE.md`):
```markdown
# Project Overrides
[INHERIT] Workspace standards
[OVERRIDE] Use npm (client requirement)
- React 19 with Server Components
- Tailwind v4
```

**Folder** (`C:\Users\Public\PhpstormProjects\myapp\src\api\.local.env\CLAUDE.md`):
```markdown
# API-Specific
[INHERIT] Project config
- Use Hono framework
- All routes must validate input with Zod
```

---

## Prior Art

| System | Mechanism | Behavior |
|--------|-----------|----------|
| **CSS** | Selector specificity | Nearest/most-specific wins |
| **ColdFusion** | Application.cfm/cfc | Walk up tree, first found applies |
| **Node.js** | package.json | Nearest parent with file wins |
| **Git** | .gitignore | Cascades from repo root down |
| **EditorConfig** | .editorconfig | Walk up tree, merge settings |

CxMS Local Directives follow this established pattern.

---

## Key Points

1. **Private by default** - `.local.env/` is always gitignored
2. **Proximity wins** - Closest to working code has highest priority
3. **No rigid structure** - Organize topics as needed
4. **Complements public cascade** - Adds LOCAL layer to GLOBAL → WORKSPACE → PROJECT
5. **Operator-defined** - You decide what goes where

---

## Integration with CxMS Cascade

```
┌─────────────────────────────────────────────────────┐
│                  RESOLUTION ORDER                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  LOWEST PRIORITY                                     │
│       │                                              │
│       ▼                                              │
│  ┌─────────────┐                                    │
│  │   GLOBAL    │  ~/.config/cxms/ or /etc/cxms/    │
│  └──────┬──────┘                                    │
│         ▼                                            │
│  ┌─────────────┐                                    │
│  │  WORKSPACE  │  ~/Projects/.cxms/                 │
│  └──────┬──────┘                                    │
│         ▼                                            │
│  ┌─────────────┐                                    │
│  │   PROJECT   │  ./CLAUDE.md, ./.cxms/            │
│  └──────┬──────┘                                    │
│         ▼                                            │
│  ┌─────────────┐                                    │
│  │LOCAL (root) │  ./.local.env/                     │
│  └──────┬──────┘                                    │
│         ▼                                            │
│  ┌─────────────┐                                    │
│  │LOCAL (folder)│ ./src/api/.local.env/            │
│  └─────────────┘                                    │
│       │                                              │
│       ▼                                              │
│  HIGHEST PRIORITY                                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## See Also

- [E22: Cascading Configuration](../CxMS_Product_Roadmap.md) - Public cascade system
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment levels
- [cxms-cascade.mjs](../tools/cxms-cascade.mjs) - Cascade audit tool
