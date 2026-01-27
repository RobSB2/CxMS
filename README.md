# CxMS - Agent Context Management System

**Version:** 1.6 | **Date:** January 2026

Persistent memory for AI coding assistants through structured documentation.

---

## The Problem

Every time you start a new session with an AI coding assistant:

> "Continue working on the authentication feature we discussed Friday."

> "I don't have any context about previous conversations. Could you tell me about the authentication feature?"

You spend 15-30 minutes re-explaining your project, decisions, and progress. **Every. Single. Time.**

```
WITHOUT CxMS                              WITH CxMS

Session 1  Session 2  Session 3          Session 1  Session 2  Session 3
    │          │          │                  │          │          │
    ▼          ▼          ▼                  ▼          ▼          ▼
┌───────┐  ┌───────┐  ┌───────┐          ┌───────┐  ┌───────┐  ┌───────┐
│ FULL  │  │ FULL  │  │ FULL  │          │ FULL  │  │ FULL  │  │ FULL  │
│CONTEXT│  │CONTEXT│  │CONTEXT│          │CONTEXT│  │CONTEXT│  │CONTEXT│
│       │  │       │  │       │          │   ↑   │  │   ↑   │  │   ↑   │
│  ▲    │  │  ▲    │  │  ▲    │          │   │   │  │   │   │  │   │   │
│  │    │  │  │    │  │  │    │          │ 5 sec │  │ 5 sec │  │ 5 sec │
│15-30  │  │15-30  │  │15-30  │          │ read  │  │ read  │  │ read  │
│ min   │  │ min   │  │ min   │          └───┬───┘  └───┬───┘  └───┬───┘
│rebuild│  │rebuild│  │rebuild│              │          │          │
└───────┘  └───────┘  └───────┘              ▼          ▼          ▼
                                         ┌─────────────────────────────┐
    ════════════════════                 │    Session.md persists      │
    ~60-90 min WASTED                    │    context between sessions │
    per week                             └─────────────────────────────┘
                                             ~0 min wasted
```

## The Solution

**CxMS gives AI assistants structured, persistent, user-controlled memory through markdown files.**

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

## Community Dashboard

**[View Live Dashboard](https://robsb2.github.io/CxMS/dashboard/)** - Anonymous community telemetry

See how the CxMS community uses the system: file adoption, deployment levels, feature requests, and more.

---

## Recent Highlights

| Date | Enhancement | Description |
|------|-------------|-------------|
| 2026-01-27 | **E20: Multi-Tool Export** | Export profiles to Cursor, Copilot, Windsurf, Aider |
| 2026-01-27 | **E19: Role-Based Profiles** | web-developer, project-manager, data-engineer, devops, technical-writer |
| 2026-01-27 | **E21: Context Lifecycle** | Unified context management (consolidates E5+E6+E11) |
| 2026-01-27 | **E8: Communication Efficiency** | Concise AI output guidelines in templates |
| 2026-01-26 | **Community Dashboard** | Live telemetry visualization |
| 2026-01-25 | **E17: Pre-Approved Operations** | Skip permission prompts with Approvals file |
| 2026-01-25 | **E16: Parent-Child Inheritance** | Child projects reference parent CxMS conventions |
| 2026-01-25 | **Context Monitoring** | Self-monitor context % via statusline script |

**See:** [Product Roadmap](CxMS_Product_Roadmap.md) for all 21 enhancements (9 implemented)

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

**One Prompt to Rule Them All (Max deployment):**
```
Read MyApp_Startup.md and follow its instructions.
```

This single prompt reads all context files, applies approvals, checks context %, and provides a full session summary.

**Or use level-appropriate prompts:**

| Level | Startup Prompt |
|-------|----------------|
| **Lite** | `Read CLAUDE.md and MyApp_Session.md. Summarize current state and await instructions.` |
| **Standard** | `Read CLAUDE.md, MyApp_Session.md, and MyApp_Tasks.md. Summarize state, active tasks, and suggest next action.` |
| **Max** | `Read MyApp_Startup.md and follow its instructions.` |

*The AI will automatically check for CxMS updates and apply pre-approved permissions.*

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

## How It Works

```
                          ┌─────────────────┐
                          │                 │
                          │    CLAUDE.md    │◄──── AI reads FIRST
                          │   (The Brain)   │      Project overview
                          │                 │      Mandatory requirements
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │              │ │              │ │              │
            │ Session.md   │ │  Tasks.md    │ │ Context.md   │
            │ (The Memory) │ │ (The Todo)   │ │ (The Index)  │
            │              │ │              │ │              │
            │ Current state│ │ What to do   │ │ Where to look│
            │ Last session │ │ Priorities   │ │ Doc map      │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   ▼
            ┌─────────────────────────────────────────────────┐
            │                 OPTIONAL LOGS                    │
            ├─────────────┬─────────────┬─────────────────────┤
            │Activity_Log │Decision_Log │ Issue_Log           │
            │ What done   │ Why decided │ What broke          │
            └─────────────┴─────────────┴─────────────────────┘
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [CxMS_Introduction_and_Guide.md](CxMS_Introduction_and_Guide.md) | **START HERE** - Full training guide, history, examples |
| [CxMS_Practical_Implementation_Guide.md](CxMS_Practical_Implementation_Guide.md) | Implementation details, templates, patterns |
| [templates/DEPLOYMENT.md](templates/DEPLOYMENT.md) | Deployment levels (Lite/Standard/Max) |
| [templates/MIGRATION.md](templates/MIGRATION.md) | **Upgrade guide** - Fresh install or update existing |

---

## Templates (27+) & Profiles (5)

**See:** [templates/DEPLOYMENT.md](templates/DEPLOYMENT.md) for deployment levels | [templates/MIGRATION.md](templates/MIGRATION.md) for upgrades

### Core Templates (`templates/core/` - 10 files)
| Template | Purpose |
|----------|---------|
| `CLAUDE.md.template` | Project overview with mandatory AI requirements |
| `CLAUDE.md.existing-project.template` | Adding CxMS to existing projects |
| `PROJECT_Startup.md.template` | **One prompt** to initialize full session context |
| `PROJECT_Approvals.md.template` | Pre-approved operations (skip permission prompts) |
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

### Role-Based Profiles (`templates/profiles/` - 5 profiles)
| Profile | Tools Installed | Use Case |
|---------|-----------------|----------|
| `web-developer` | Playwright, Prettier, ESLint | Frontend/backend web development |
| `project-manager` | GitHub CLI, documentation tools | Multi-agent coordination, planning |
| `data-engineer` | DuckDB, SQL tools | Data pipelines, ETL, analytics |
| `devops` | Docker, Terraform, kubectl | Infrastructure, CI/CD, deployment |
| `technical-writer` | Vale, markdownlint | Documentation, content creation |

**Profile CLI:**
```bash
node tools/cxms-profile.mjs list                    # List available profiles
node tools/cxms-profile.mjs install web-developer   # Install profile globally
node tools/cxms-profile.mjs export web-developer --format all  # Export to other AI tools
```

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
- 21 enhancements documented, 9 implemented (E8, E9, E10, E13, E16, E17, E18, E19, E20)
- 5 role-based deployment profiles with CLI tool
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
├── CxMS_Product_Roadmap.md                # 21 enhancements (9 implemented)
│
├── templates/                             # 27+ templates organized by category
│   ├── DEPLOYMENT.md                      # Deployment guide (Lite/Standard/Max)
│   ├── MIGRATION.md                       # Fresh install & upgrade guide
│   ├── VERSIONS.md                        # Template version manifest
│   ├── core/                              # Required templates (10)
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
│   ├── multi-tool/                        # Tool-specific configs (5)
│   │   ├── GEMINI.md.template
│   │   ├── copilot-instructions.md.template
│   │   ├── cursorrules.template
│   │   ├── CONVENTIONS.md.template
│   │   └── MULTI-TOOL-DEPLOYMENT.md
│   └── profiles/                          # Role-based profiles (5)
│       ├── MANIFEST.json                  # Profile registry
│       ├── web-developer/                 # Playwright, Prettier, ESLint
│       ├── project-manager/               # GitHub CLI, docs tools
│       ├── data-engineer/                 # DuckDB, SQL tools
│       ├── devops/                        # Docker, Terraform, kubectl
│       └── technical-writer/              # Vale, markdownlint
│
├── docs/                                  # GitHub Pages
│   └── dashboard/                         # Community telemetry dashboard
│
├── tools/                                 # CxMS utilities
│   ├── cxms-report.mjs                    # Telemetry reporter (anonymous metrics)
│   ├── cxms-profile.mjs                   # Profile manager CLI (install, export)
│   ├── statusline-command.sh              # Context monitoring (Mac/Linux)
│   └── statusline-command.ps1             # Context monitoring (Windows)
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

---

> *"AI context temporary is. Files permanent are. Remember this, you must."*
>
> — Master Yoda *(CxMS Code Name since v1.3. Speak this way, required it is not. But fun, it is.)*
