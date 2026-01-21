# CxMS - Agent Context Management System

**Version:** 1.0 | **Date:** January 2026

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

---

## Quick Start (10 Minutes)

### 1. Copy the 5 core templates to your project:

```
your-project/
├── CLAUDE.md              # Project overview (from CLAUDE.md.template)
├── MyApp_Context.md       # Documentation index
├── MyApp_Session.md       # Current state (update every session)
├── MyApp_Tasks.md         # Task tracker
└── MyApp_Prompt_History.md # Audit trail (optional)
```

### 2. Fill in CLAUDE.md with your project basics:

```markdown
# CLAUDE.md

## Overview
[2-3 sentences about your project]

## Tech Stack
- Backend: [your tech]
- Frontend: [your tech]
- Database: [your tech]

## Session Context Preservation
Before ending any session, update MyApp_Session.md with current state.
```

### 3. Start every AI session with:

```
Read CLAUDE.md and MyApp_Session.md, summarize current status, then await instructions.
```

### 4. End every session with:

```
Update MyApp_Session.md with this session's work before we end.
```

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

---

## Templates (17 Total)

### Core Templates (Required)
| Template | Purpose |
|----------|---------|
| `CLAUDE.md.template` | Project overview with mandatory AI requirements |
| `PROJECT_Context.md.template` | Documentation index and reading order |
| `PROJECT_Session.md.template` | Current state - **update every session** (v1.1 with metrics) |
| `PROJECT_Tasks.md.template` | Task tracker with status |
| `PROJECT_Prompt_History.md.template` | Audit trail of prompts and actions |
| `SESSION_START_PROMPTS.md` | Copy-paste prompts for session starts |

### Log Templates (Optional)
| Template | Purpose |
|----------|---------|
| `PROJECT_Activity_Log.md.template` | Record of significant changes |
| `PROJECT_Decision_Log.md.template` | Decisions with rationale |
| `PROJECT_Issue_Log.md.template` | Issue tracking |
| `PROJECT_Session_Summary.md.template` | One-line per session quick reference |
| `PROJECT_Deployment.md.template` | Deployment tracking across environments |
| `PROJECT_Compaction_Log.md.template` | Context loss tracking |
| `PROJECT_Performance_Review.md.template` | CxMS effectiveness metrics |

### Project Documentation Templates (Optional)
| Template | Purpose |
|----------|---------|
| `PROJECT_Plan.md.template` | Multi-phase project planning |
| `PROJECT_Inventory.md.template` | Component and endpoint inventory |
| `PROJECT_Strategy.md.template` | AI workflow strategy |
| `PROJECT_Exceptions.md.template` | Technical workarounds documentation |

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

**See:** [LPR LandTools™ Case Study](case-studies/LPR_LandTools_Case_Study.md) - Real-world implementation details

---

## Repository Structure

```
Context_Management_System/
├── README.md                              # This file
├── CLAUDE.md                              # Repository guidance
├── CxMS_Introduction_and_Guide.md         # START HERE
├── CxMS_Practical_Implementation_Guide.md # Implementation details
│
├── templates/                             # All 16 templates
│   ├── CLAUDE.md.template
│   ├── PROJECT_Context.md.template
│   ├── PROJECT_Session.md.template
│   ├── PROJECT_Tasks.md.template
│   ├── PROJECT_Prompt_History.md.template
│   ├── SESSION_START_PROMPTS.md
│   ├── PROJECT_Activity_Log.md.template
│   ├── PROJECT_Decision_Log.md.template
│   ├── PROJECT_Issue_Log.md.template
│   ├── PROJECT_Session_Summary.md.template
│   ├── PROJECT_Deployment.md.template
│   ├── PROJECT_Compaction_Log.md.template
│   ├── PROJECT_Plan.md.template
│   ├── PROJECT_Inventory.md.template
│   ├── PROJECT_Strategy.md.template
│   └── PROJECT_Exceptions.md.template
│
├── case-studies/                          # Real-world implementations
│   └── LPR_LandTools_Case_Study.md        # Enterprise land management platform
│
├── CxMS_Enhancement_Exploration.md        # Future enhancement ideas
│
└── Archive/                               # Historical reference materials
```

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## License

[MIT License](LICENSE) - Feel free to use, modify, and distribute.

---

## Acknowledgments

Developed through extensive real-world use with Claude Code (Anthropic). The methodology emerged from solving actual context management challenges in production software development.

---

**Stop re-explaining your project. Start where you left off.**
