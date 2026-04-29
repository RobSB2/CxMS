<div align="center">

<h1>🚀 CxMS Pro is Here</h1>
<h3>The AI That Never Forgets</h3>

**Your corrections stick. Your decisions persist. Every session builds on the last.**

Persistent memory with confidence-based knowledge tiers, accuracy enforcement, and self-improving recall. Born from 184+ real production sessions. 16 patents pending. Zero cloud dependency.

$49 one-time on Gumroad. Pick any 1 of 9 AI assistant integrations. Add the others at $19 one-time each. Bring your own API key for any AI model.

Works with Claude Code, Cursor, Windsurf, GitHub Copilot, Cline, Continue.dev, Zed, and Amazon Q.

[![Get CxMS Pro](https://img.shields.io/badge/Get_CxMS_Pro-$49_one--time-6366f1?style=for-the-badge)](https://opencxms.org/products/cxms-pro) [![Try Core Free](https://img.shields.io/badge/CxMS_Core-Free_&_Open_Source-22c55e?style=for-the-badge)](https://github.com/RobSB2/CxMS)

| | CxMS Core (Free) | CxMS Pro |
|---|---|---|
| Full-text search | :white_check_mark: | :white_check_mark: |
| Session lifecycle hooks | :white_check_mark: | :white_check_mark: |
| Context monitoring | :white_check_mark: | :white_check_mark: |
| **Persistent memory engine** | | :star: |
| **Confidence-based knowledge tiers** | | :star: |
| **Accuracy enforcement** | | :star: |
| **Automatic context awareness** | | :star: |
| **Source verification before writes** | | :star: |
| **Self-improving memory** | | :star: |
| **Conflict detection and resolution** | | :star: |
| **Cross-project knowledge sharing** | | :star: |
| **Adaptive context scaling (128K-1M)** | | :star: |
| **Project onboarding + migration** | | :star: |
| **9 AI assistant support** | | :star: |

</div>

---

# CxMS - OpenCxMS Memory System

<div align="center">

[![Website](https://img.shields.io/badge/Website-opencxms.org-blue?style=for-the-badge)](https://opencxms.org)
[![Version](https://img.shields.io/badge/Version-3.0.0-purple?style=for-the-badge)](templates/VERSIONS.md)
[![Contact](https://img.shields.io/badge/Contact-opencxms%40proton.me-orange?style=for-the-badge)](mailto:opencxms@proton.me)

**Persistent memory for AI coding assistants through structured documentation.**

*Because AI context is temporary, but files are permanent.*

</div>

> **Note:** This repository was restructured and relaunched in early 2026. Current GitHub analytics (clone count, stars, traffic) reflect only the period since the relaunch and do not capture the full adoption history across prior versions. Total clones since inception exceed 1,000.

---

## The Problem

Every time you start a new session with an AI coding assistant:

> "Continue working on the authentication feature we discussed Friday."

> "I don't have any context about previous conversations. Could you tell me about the authentication feature?"

You spend 15-30 minutes re-explaining your project, decisions, and progress. **Every. Single. Time.**

```
WITHOUT CxMS                              WITH CxMS

Session 1  Session 2  Session 3          Session 1  Session 2  Session 3
    |          |          |                  |          |          |
    v          v          v                  v          v          v
+-------+  +-------+  +-------+          +-------+  +-------+  +-------+
| FULL  |  | FULL  |  | FULL  |          | FULL  |  | FULL  |  | FULL  |
|CONTEXT|  |CONTEXT|  |CONTEXT|          |CONTEXT|  |CONTEXT|  |CONTEXT|
|       |  |       |  |       |          |   ^   |  |   ^   |  |   ^   |
|  ^    |  |  ^    |  |  ^    |          |   |   |  |   |   |  |   |   |
|  |    |  |  |    |  |  |    |          | 5 sec |  | 5 sec |  | 5 sec |
|15-30  |  |15-30  |  |15-30  |          | read  |  | read  |  | read  |
| min   |  | min   |  | min   |          +---+---+  +---+---+  +---+---+
|rebuild|  |rebuild|  |rebuild|              |          |          |
+-------+  +-------+  +-------+              v          v          v
                                         +-----------------------------+
    ====================                 |    Session.md persists      |
    ~60-90 min WASTED                    |    context between sessions |
    per week                             +-----------------------------+
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

---

## What's New

### v3.0.0 — Total Recall v2: Session ID Coordination (February 19, 2026)

Multiple Claude Code sessions on the same project are now tracked individually. The coordination file gains an `active_sessions` array (schema 1.1, auto-migrated) that records each session's ID, status, context %, and model.

- **Concurrent session detection:** Starting a second session on the same project triggers a `CONCURRENT SESSIONS DETECTED` banner with the sibling's age and context usage
- **Session lifecycle:** SessionEnd marks sessions `completed` with final stats. Stale sessions auto-pruned (completed >1hr, active >4hr)
- **Per-session message tracking:** Coordination messages record which specific session read them (`{project, session_id, read_at}` objects), backward-compatible with existing string format
- **Per-session cleanup:** State files deleted on session exit; SessionStart only clears its own session's files (no longer destroys concurrent sessions' state)

Updated: `cxms-session-start.mjs` (v3.1 → v4.0), `cxms-session-end.mjs` (v2.1 → v2.2)

### v2.0.5 — Per-Session Context Isolation (February 19, 2026)

Fixed a bug where two sessions on the same project shared a single `context-status.json`. Each session now writes to its own `context-status-{session_id}.json`. Compaction detection logging added.

### v2.0.0 — Enforced Startup + Total Recall (February 8, 2026)

Major release: PreToolUse hook blocks all non-Read tools until required startup files are confirmed read. Cross-instance memory transfer via coordination file. Full changelog at [opencxms.org/updates](https://opencxms.org/updates).

---

### Works With Any AI Assistant

CxMS is **AI-agnostic**. It works with any coding assistant that can read files:

| AI Assistant | Compatible | Notes |
|--------------|------------|-------|
| Claude Code | Yes | Auto-reads CLAUDE.md |
| Gemini CLI | Yes | Auto-reads GEMINI.md |
| GitHub Copilot | Yes | Reads .github/copilot-instructions.md |
| Cursor | Yes | Reads .cursorrules |
| Aider | Yes | Reads CONVENTIONS.md via config |
| ChatGPT | Yes | Upload or paste file contents |
| Any file-aware AI | Yes | Same methodology applies |

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

| Level | Startup Prompt |
|-------|----------------|
| **Lite** | `Read CLAUDE.md and MyApp_Session.md. Summarize current state and await instructions.` |
| **Standard** | `Read CLAUDE.md, MyApp_Session.md, and MyApp_Tasks.md. Summarize state, active tasks, and suggest next action.` |
| **Max** | `Read MyApp_Startup.md and follow its instructions.` |

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
| [templates/DEPLOYMENT.md](templates/DEPLOYMENT.md) | Deployment levels (Lite/Standard/Max) |
| [templates/MIGRATION.md](templates/MIGRATION.md) | **Upgrade guide** - Fresh install or update existing |

---

## Templates (27+) & Profiles (5)

### Core Templates (`templates/core/` - 10 files)
| Template | Purpose |
|----------|---------|
| `CLAUDE.md.template` | Project overview with mandatory AI requirements |
| `CLAUDE.md.existing-project.template` | Adding CxMS to existing projects |
| `PROJECT_Startup.md.template` | **One prompt** to initialize full session context |
| `PROJECT_Approvals.md.template` | Pre-approved operations (skip permission prompts) |
| `PROJECT_Session.md.template` | Current state - **update every session** |
| `PROJECT_Tasks.md.template` | Task tracker with status |
| `SESSION_START_PROMPTS.md` | Copy-paste prompts for session starts |
| `SESSION_END_CHECKLIST.md` | Session wrap-up workflow |

### Log Templates (`templates/logs/` - 7 files)
Activity logs, decision logs, issue tracking, deployment tracking, and more.

### Documentation Templates (`templates/docs/` - 5 files)
Project planning, inventory, strategy, exceptions, and prompt libraries.

### Multi-Tool Templates (`templates/multi-tool/` - 5 files)
Export CxMS to Cursor, GitHub Copilot, Windsurf, and Aider.

### Role-Based Profiles (`templates/profiles/` - 5 profiles)
| Profile | Use Case |
|---------|----------|
| `web-developer` | Frontend/backend web development |
| `project-manager` | Multi-agent coordination, planning |
| `data-engineer` | Data pipelines, ETL, analytics |
| `devops` | Infrastructure, CI/CD, deployment |
| `technical-writer` | Documentation, content creation |

---

## Key Features

### Automatic Context Protection (6 Hooks)

| Hook | Trigger | What It Does |
|------|---------|-------------|
| **SessionStart** | Session begins | Creates startup enforcement, registers session, reads coordination messages, detects concurrent sessions |
| **PreToolUse** | Before every tool | Enforces startup sequence, one-time checkpoint save at 80% context (then approves), compaction recovery |
| **PostToolUse** | After every tool | Tracks breadcrumbs with edit summaries, detects startup completion, enforces checkpoints every 30 tool calls |
| **PreCompact** | Before auto-compaction | Saves comprehensive recovery file with breadcrumbs, session state, active tasks, uncommitted changes |
| **SessionEnd** | Session ends | Updates session file, marks session completed, cleans up state files, syncs memory bridge |
| **Memory Bridge** | Called by hooks | Syncs session state into Claude Code's native MEMORY.md (auto-loaded at next session start) |

### Per-Project Configuration

Each project gets a `.claude/cxms-config.json` that defines:
- Which files must be read at startup (enforced by hooks)
- Session and tasks file names
- Coordination file path

```json
{
  "project_name": "MyApp",
  "startup_required_reads": ["MyApp_Startup.md", "MyApp_Approvals.md", "MyApp_Session.md", "MyApp_Tasks.md"],
  "session_file": "MyApp_Session.md",
  "tasks_file": "MyApp_Tasks.md",
  "coordination_file": "~/.claude/coordination/cxms-coordination.json"
}
```

---

## Session Lifecycle

```
+-------------------------------------------------------------+
|                    SESSION LIFECYCLE (v2.0)                   |
+-------------------------------------------------------------+
|                                                              |
|  START                                                       |
|    |                                                         |
|    v                                                         |
|  +-----------------+                                         |
|  | SessionStart    | <- Hook creates enforcement state       |
|  | hook fires      | <- Reads coordination messages          |
|  +--------+--------+                                         |
|           |                                                  |
|           v                                                  |
|  +-----------------+                                         |
|  | Read CLAUDE.md  | <- Auto-loaded by Claude Code           |
|  +--------+--------+                                         |
|           |                                                  |
|           v                                                  |
|  +-----------------+                                         |
|  | Read Startup,   | <- ENFORCED: non-read tools blocked     |
|  | Approvals,      |    until all files confirmed read       |
|  | Session, Tasks  |                                         |
|  +--------+--------+                                         |
|           |                                                  |
|           v                                                  |
|       [ WORK ]    <- Breadcrumbs tracked, checkpoints        |
|           |          enforced every 30 tool calls             |
|           |                                                  |
|           v                                                  |
|  +-----------------+                                         |
|  | PreCompact/     | <- Automatic recovery saves             |
|  | SessionEnd      | <- State persisted to memory bridge     |
|  +--------+--------+                                         |
|           |                                                  |
|           v                                                  |
|         END                                                  |
|                                                              |
+-------------------------------------------------------------+
```

**Remember:** Session saves are now automatic via hooks, but manual checkpoints are still valuable!

---

## Repository Structure

```
CxMS/
├── README.md                              # This file
├── CLAUDE.md                              # Repository guidance
├── CxMS_Introduction_and_Guide.md         # START HERE
├── CxMS_Practical_Implementation_Guide.md # Implementation details
│
├── templates/                             # 27+ templates organized by category
│   ├── DEPLOYMENT.md                      # Deployment guide (Lite/Standard/Max)
│   ├── MIGRATION.md                       # Fresh install & upgrade guide
│   ├── VERSIONS.md                        # Template version manifest
│   ├── core/                              # Required templates (10)
│   ├── logs/                              # Optional logging (7)
│   ├── docs/                              # Optional documentation (5)
│   ├── multi-tool/                        # Tool-specific configs (5)
│   └── profiles/                          # Role-based profiles (5)
│
├── tools/                                 # CxMS utilities & hook scripts
│   ├── cxms-session-start.mjs             # SessionStart hook (enforcement + coordination)
│   ├── cxms-context-warn.mjs              # PreToolUse hook (startup gate + context gate)
│   ├── cxms-context-check.mjs             # PostToolUse hook (breadcrumbs + completion)
│   ├── cxms-pre-compact.mjs               # PreCompact hook (recovery saves)
│   ├── cxms-session-end.mjs               # SessionEnd hook (state save + coordination)
│   ├── cxms-memory-bridge.mjs             # Memory bridge (auto-persist to MEMORY.md)
│   ├── cxms-cascade.mjs                   # Cascading config manager
│   ├── cxms-report.mjs                    # Telemetry reporter
│   ├── cxms-profile.mjs                   # Profile manager CLI
│   ├── statusline-command.sh              # Context monitoring (all platforms)
│   └── statusline-command.ps1             # Context monitoring (deprecated — use .sh)
│
└── docs/dashboard/                        # Community dashboard (coming soon)
```

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

- **Before:** 15-30 minutes of context rebuilding per session
- **After:** Instant context restoration with a single prompt
- **Context loss incidents:** Reduced by ~80%
- **Session productivity:** Significantly improved

---

## Community & Resources

| Resource | Link | Description |
|----------|------|-------------|
| **Website** | [opencxms.org](https://opencxms.org) | Official site - docs, getting started |
| **GitHub** | [RobSB2/CxMS](https://github.com/RobSB2/CxMS) | Source code, issues |
| **Contact** | [opencxms@proton.me](mailto:opencxms@proton.me) | Questions, feedback |

---

## Contributing

Contributions welcome:

- **Issues/PRs:** Bug reports, feature ideas, documentation improvements
- **Contact:** [opencxms@proton.me](mailto:opencxms@proton.me)

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
> -- Master Yoda *(CxMS Code Name since v1.3)*
