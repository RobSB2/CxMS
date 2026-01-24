# CxMS - Agent Context Management System

**Version:** 1.3 | **Date:** January 2026

Persistent memory for AI coding assistants through structured documentation.

---

## The Problem

Every time you start a new session with an AI coding assistant:

> "Continue working on the authentication feature we discussed Friday."

> "I don't have any context about previous conversations. Could you tell me about the authentication feature?"

You spend 15-30 minutes re-explaining your project, decisions, and progress. **Every. Single. Time.**

## The Solution

**CxMS gives AI assistants structured, persistent, user-controlled memory through markdown files.**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Your Project + CxMS Files = AI That           │
│   Remembers Everything                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

| Without CxMS | With CxMS |
|--------------|-----------|
| Start from zero each time | Pick up exactly where you left off |
| Re-explain everything | AI reads context files automatically |
| Decisions forgotten | Decisions documented with rationale |
| Inconsistent approaches | Consistent patterns maintained |

### Works With Any AI Assistant

CxMS is **AI-agnostic**. It works with any coding assistant that can read files:

| AI Assistant | Compatible | Notes |
|--------------|------------|-------|
| Claude Code | ✅ | Auto-reads CLAUDE.md |
| Gemini CLI | ✅ | Auto-reads GEMINI.md |
| GitHub Copilot | ✅ | Reads .github/copilot-instructions.md |
| Cursor | ✅ | Reads .cursorrules |
| Aider | ✅ | Reads CONVENTIONS.md via config |
| ChatGPT | ✅ | Upload or paste file contents |
| Any file-aware AI | ✅ | Same methodology applies |

> **Why "CLAUDE.md"?** Claude Code auto-reads files named `CLAUDE.md`. You can rename it to `COPILOT.md`, `AI_CONTEXT.md`, or anything else - the methodology works the same.

---

## Recent Highlights

| Date | Enhancement | Description |
|------|-------------|-------------|
| 2026-01-24 | **E14: Portability Kit** | SESSION_END_CHECKLIST, existing-project template |
| 2026-01-24 | **E15: Update Management** | MIGRATION.md with AI-assisted updates |
| 2026-01-24 | **Multi-Tool Support** | Templates for Gemini CLI, GitHub Copilot, Cursor, Aider |
| 2026-01-24 | **Prompt Library** | Curated prompts with improvement analysis for training |
| 2026-01-24 | **Deployment Packages** | Lite/Standard/Max levels with organized template folders |
| 2026-01-21 | **E13: Community Telemetry** | Case study pipeline, GitHub issue templates |
| 2026-01-21 | **E12: Multi-Agent Orchestration** | Agent registry, coordination patterns |
| 2026-01-20 | **E9-E11: Metrics & Maintenance** | Performance monitoring, health checks, log aging |

**See:** [Product Roadmap](CxMS_Product_Roadmap.md) for all 15 enhancements

---

## Quick Start (5 Minutes)

### 1. Choose your deployment level:

| Level | Files | Best For |
|-------|-------|----------|
| **Lite** | 3 | Quick experiments, solo projects |
| **Standard** | 9 | Team projects, ongoing development |
| **Max** | 17+ | Enterprise, complex multi-phase projects |

**See:** [templates/DEPLOYMENT.md](templates/DEPLOYMENT.md) for full details

### 2. Copy templates to your project:

**Lite (minimum viable):**
```
your-project/
├── CLAUDE.md              # From templates/core/CLAUDE.md.template
├── MyApp_Session.md       # From templates/core/PROJECT_Session.md.template
└── MyApp_Tasks.md         # From templates/core/PROJECT_Tasks.md.template
```

**Adding to existing project?** See [CLAUDE.md.existing-project.template](templates/core/CLAUDE.md.existing-project.template)

### 3. Start every AI session with:

```
Read CLAUDE.md and MyApp_Session.md, summarize current status, then await instructions.
```

### 4. End every session with:

```
Update MyApp_Session.md with this session's work before we end.
```

**See:** [SESSION_END_CHECKLIST.md](templates/core/SESSION_END_CHECKLIST.md) for complete wrap-up workflow

**That's it.** You now have AI session continuity.

---

## The Core Insight

> **AI context is temporary; files are permanent.**
>
> Everything the AI needs to know must exist in files it can read.

This simple principle drives the entire system. Instead of relying on AI memory (which resets), we store context in markdown files that persist between sessions.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [CxMS_Introduction_and_Guide.md](CxMS_Introduction_and_Guide.md) | **START HERE** - Full training guide, history, examples |
| [CxMS_Practical_Implementation_Guide.md](CxMS_Practical_Implementation_Guide.md) | Implementation details, templates, patterns |
| [templates/DEPLOYMENT.md](templates/DEPLOYMENT.md) | Deployment levels (Lite/Standard/Max) |
| [templates/MIGRATION.md](templates/MIGRATION.md) | **Upgrade guide** - Fresh install or update existing |

---

## Templates (25 Total)

**See:** [templates/DEPLOYMENT.md](templates/DEPLOYMENT.md) for deployment levels | [templates/MIGRATION.md](templates/MIGRATION.md) for upgrades

### Core Templates (`templates/core/` - 8 files)
| Template | Purpose |
|----------|---------|
| `CLAUDE.md.template` | Project overview with mandatory AI requirements |
| `CLAUDE.md.existing-project.template` | Adding CxMS to existing projects |
| `PROJECT_Context.md.template` | Documentation index and reading order |
| `PROJECT_Session.md.template` | Current state - **update every session** |
| `PROJECT_Tasks.md.template` | Task tracker with status |
| `PROJECT_Prompt_History.md.template` | Audit trail of prompts and actions |
| `SESSION_START_PROMPTS.md` | Copy-paste prompts for session starts |
| `SESSION_END_CHECKLIST.md` | Session wrap-up workflow |

### Log Templates (`templates/logs/` - 7 files)
| Template | Purpose |
|----------|---------|
| `PROJECT_Activity_Log.md.template` | Record of significant changes |
| `PROJECT_Decision_Log.md.template` | Decisions with rationale |
| `PROJECT_Issue_Log.md.template` | Issue tracking |
| `PROJECT_Session_Summary.md.template` | One-line per session quick reference |
| `PROJECT_Deployment.md.template` | Deployment tracking across environments |
| `PROJECT_Compaction_Log.md.template` | Context loss tracking |
| `PROJECT_Performance_Log.md.template` | CxMS effectiveness metrics |

### Documentation Templates (`templates/docs/` - 5 files)
| Template | Purpose |
|----------|---------|
| `PROJECT_Plan.md.template` | Multi-phase project planning |
| `PROJECT_Inventory.md.template` | Component and endpoint inventory |
| `PROJECT_Strategy.md.template` | AI workflow strategy |
| `PROJECT_Exceptions.md.template` | Technical workarounds documentation |
| `PROJECT_Prompt_Library.md.template` | Curated prompts with improvement analysis |

### Multi-Tool Templates (`templates/multi-tool/` - 5 files)
| Template | Tool | Purpose |
|----------|------|---------|
| `GEMINI.md.template` | Gemini CLI | CxMS config for Gemini |
| `copilot-instructions.md.template` | GitHub Copilot | CxMS config for Copilot |
| `cursorrules.template` | Cursor | CxMS config for Cursor |
| `CONVENTIONS.md.template` | Aider | CxMS config for Aider |
| `MULTI-TOOL-DEPLOYMENT.md` | All | Multi-tool deployment guide |

---

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  START                                                       │
│    │                                                         │
│    ▼                                                         │
│  ┌─────────────────┐                                        │
│  │ Read CLAUDE.md  │ ← Project overview                     │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Read Session.md │ ← Current state                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│       [ WORK ]                                               │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │Update Session.md│ ← CRITICAL!                            │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│         END                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Remember:** Always update Session.md before ending a session or when context compacts!

---

## Who Is This For?

- **Developers** using Claude Code, GitHub Copilot, ChatGPT, or similar AI assistants
- **Teams** wanting consistent AI-assisted development across members
- **Anyone** tired of re-explaining their project to AI every session

## Requirements

- A text editor
- Markdown files (`.md`)
- An AI coding assistant that can read files

No installation. No dependencies. No API keys. Just markdown files.

---

## Proven Results

CxMS was developed and validated through real production use:

- **Before:** 15-30 minutes of context rebuilding per session
- **After:** Instant context restoration with a single prompt
- **Context loss incidents:** Reduced by ~80%
- **Session productivity:** Significantly improved

**Ongoing Development:**
- 15 enhancements documented, E9-E15 implemented
- CxMS uses itself for development tracking (dogfooding)
- Active metrics collection for validation

**See:** [LPR LandTools™ Case Study](case-studies/LPR_LandTools_Case_Study.md) - Real-world implementation details

---

## Repository Structure

```
Context_Management_System/
├── README.md                              # This file
├── CLAUDE.md                              # Repository guidance
├── CxMS_Introduction_and_Guide.md         # START HERE
├── CxMS_Practical_Implementation_Guide.md # Implementation details
├── CxMS_Product_Roadmap.md                # 15 enhancements (RFC)
│
├── templates/                             # 25 templates organized by category
│   ├── DEPLOYMENT.md                      # Deployment guide (Lite/Standard/Max)
│   ├── MIGRATION.md                       # Fresh install & upgrade guide
│   ├── core/                              # Required templates (8)
│   │   ├── CLAUDE.md.template
│   │   ├── CLAUDE.md.existing-project.template
│   │   ├── PROJECT_Session.md.template
│   │   ├── SESSION_END_CHECKLIST.md
│   │   └── ...
│   ├── logs/                              # Optional logging (7)
│   │   ├── PROJECT_Activity_Log.md.template
│   │   ├── PROJECT_Decision_Log.md.template
│   │   └── ...
│   ├── docs/                              # Optional documentation (5)
│   │   ├── PROJECT_Plan.md.template
│   │   ├── PROJECT_Prompt_Library.md.template
│   │   └── ...
│   └── multi-tool/                        # Tool-specific configs (5)
│       ├── GEMINI.md.template
│       ├── copilot-instructions.md.template
│       ├── cursorrules.template
│       ├── CONVENTIONS.md.template
│       └── MULTI-TOOL-DEPLOYMENT.md
│
├── case-studies/                          # Real-world implementations
│   └── LPR_LandTools_Case_Study.md
│
├── # CxMS Self-Tracking (dogfooding)
├── CxMS_Session.md                        # CxMS development state
├── CxMS_Tasks.md                          # CxMS task tracker
├── CxMS_Prompt_Library.md                 # Curated prompts with analysis
├── CxMS_Performance_Log.md                # CxMS metrics
├── CxMS_Activity_Log.md                   # CxMS activities
├── CxMS_Decision_Log.md                   # CxMS design decisions
├── CxMS_Prompt_History.md                 # CxMS audit trail
│
└── Archive/                               # Historical reference materials
```

> **Dogfooding:** CxMS uses its own system to track its development - proving the methodology works.

---

## Contributing

Contributions welcome:

- **Issues/PRs:** Bug reports, feature ideas, documentation improvements
- **Case Studies:** [Submit your CxMS experience](../../issues/new?template=cxms-case-study.md) to help validate and improve the system

---

## License

[MIT License](LICENSE) - Feel free to use, modify, and distribute.

---

## Acknowledgments

Developed through extensive real-world use with Claude Code (Anthropic). The methodology emerged from solving actual context management challenges in production software development.

---

**Stop re-explaining your project. Start where you left off.**
