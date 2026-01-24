# CxMS Multi-Tool Deployment Guide

**Version:** 1.0
**Last Updated:** 2026-01-24

Deploy CxMS with your preferred AI coding assistant.

---

## Supported Tools

| Tool | Config File | Location | Auto-Load |
|------|-------------|----------|-----------|
| Claude Code | `CLAUDE.md` | Project root | Yes |
| Gemini CLI | `GEMINI.md` | Project root (or ~/.gemini/) | Yes |
| GitHub Copilot | `copilot-instructions.md` | `.github/` | Yes |
| Cursor | `.cursorrules` | Project root | Yes |
| Aider | `CONVENTIONS.md` | Project root | Via config |

---

## Quick Start by Tool

### Claude Code

**Files needed:**
```
your-project/
├── CLAUDE.md                    # Use templates/core/CLAUDE.md.template
├── [PROJECT]_Session.md         # Use templates/core/PROJECT_Session.md.template
└── [PROJECT]_Tasks.md           # Use templates/core/PROJECT_Tasks.md.template
```

**Deployment:**
```bash
# Copy from CxMS repo
cp templates/core/CLAUDE.md.template your-project/CLAUDE.md
cp templates/core/PROJECT_Session.md.template your-project/MyProject_Session.md
cp templates/core/PROJECT_Tasks.md.template your-project/MyProject_Tasks.md
```

**Session start prompt:**
```
Read CLAUDE.md and MyProject_Session.md, summarize current state, await instructions.
```

---

### Gemini CLI

**Files needed:**
```
your-project/
├── GEMINI.md                    # Use templates/multi-tool/GEMINI.md.template
├── [PROJECT]_Session.md
└── [PROJECT]_Tasks.md
```

**Deployment:**
```bash
cp templates/multi-tool/GEMINI.md.template your-project/GEMINI.md
cp templates/core/PROJECT_Session.md.template your-project/MyProject_Session.md
cp templates/core/PROJECT_Tasks.md.template your-project/MyProject_Tasks.md
```

**Session start prompt:**
```
Read GEMINI.md and MyProject_Session.md, summarize current state, await instructions.
```

**Global vs Project:**
- Project-specific: Place `GEMINI.md` in project root
- Global (all projects): Place in `~/.gemini/GEMINI.md`
- Subdirectory scope: Place in any subdirectory

---

### GitHub Copilot

**Files needed:**
```
your-project/
├── .github/
│   └── copilot-instructions.md  # Use templates/multi-tool/copilot-instructions.md.template
├── [PROJECT]_Session.md
└── [PROJECT]_Tasks.md
```

**Deployment:**
```bash
mkdir -p your-project/.github
cp templates/multi-tool/copilot-instructions.md.template your-project/.github/copilot-instructions.md
cp templates/core/PROJECT_Session.md.template your-project/MyProject_Session.md
cp templates/core/PROJECT_Tasks.md.template your-project/MyProject_Tasks.md
```

**Usage:**
Copilot automatically reads `.github/copilot-instructions.md`. For session context, manually reference the Session.md file in your prompts or use Copilot Chat.

**Path-specific instructions (optional):**
```
.github/
├── copilot-instructions.md          # Global project instructions
└── instructions/
    ├── src-api.instructions.md      # API-specific
    └── src-frontend.instructions.md # Frontend-specific
```

---

### Cursor

**Files needed:**
```
your-project/
├── .cursorrules                 # Use templates/multi-tool/cursorrules.template
├── [PROJECT]_Session.md
└── [PROJECT]_Tasks.md
```

**Deployment:**
```bash
cp templates/multi-tool/cursorrules.template your-project/.cursorrules
cp templates/core/PROJECT_Session.md.template your-project/MyProject_Session.md
cp templates/core/PROJECT_Tasks.md.template your-project/MyProject_Tasks.md
```

**Note:** Cursor is transitioning to `.cursor/rules/*.mdc` format. The `.cursorrules` file still works but may be deprecated in future versions.

**New format (optional):**
```
your-project/
├── .cursor/
│   └── rules/
│       └── project.mdc          # MDC format rules
├── [PROJECT]_Session.md
└── [PROJECT]_Tasks.md
```

---

### Aider

**Files needed:**
```
your-project/
├── CONVENTIONS.md               # Use templates/multi-tool/CONVENTIONS.md.template
├── .aider.conf.yml              # Aider configuration
├── [PROJECT]_Session.md
└── [PROJECT]_Tasks.md
```

**Deployment:**
```bash
cp templates/multi-tool/CONVENTIONS.md.template your-project/CONVENTIONS.md
cp templates/core/PROJECT_Session.md.template your-project/MyProject_Session.md
cp templates/core/PROJECT_Tasks.md.template your-project/MyProject_Tasks.md
```

**Create `.aider.conf.yml`:**
```yaml
# .aider.conf.yml
read:
  - CONVENTIONS.md
  - MyProject_Session.md

# Optional: auto-commit settings
auto-commits: true
dirty-commits: false
```

**Usage:**
```bash
# Option 1: Use config file (recommended)
aider

# Option 2: Manual flags
aider --read CONVENTIONS.md --read MyProject_Session.md
```

---

## Universal Files (All Tools)

These CxMS files work with any tool:

| File | Purpose | Tool-Agnostic? |
|------|---------|----------------|
| `[PROJECT]_Session.md` | Current state | Yes |
| `[PROJECT]_Tasks.md` | Task tracking | Yes |
| `[PROJECT]_Context.md` | Doc index | Yes |
| `[PROJECT]_*_Log.md` | Various logs | Yes |

Only the **instructions file** (CLAUDE.md, GEMINI.md, etc.) needs to be tool-specific.

---

## Multi-Tool Projects

If your team uses multiple AI tools, you can include multiple instruction files:

```
your-project/
├── CLAUDE.md                    # For Claude Code users
├── GEMINI.md                    # For Gemini CLI users
├── .github/
│   └── copilot-instructions.md  # For Copilot users
├── .cursorrules                 # For Cursor users
├── CONVENTIONS.md               # For Aider users
│
├── [PROJECT]_Session.md         # Shared - all tools use this
└── [PROJECT]_Tasks.md           # Shared - all tools use this
```

**Keeping in sync:**
The tool-specific files should all reference the same `[PROJECT]_Session.md` and `[PROJECT]_Tasks.md`. When one tool updates the session state, all other tools will see the changes.

---

## Deployment Levels by Tool

### Lite (3-4 files)

| Tool | Files |
|------|-------|
| Claude | CLAUDE.md, Session.md, Tasks.md |
| Gemini | GEMINI.md, Session.md, Tasks.md |
| Copilot | .github/copilot-instructions.md, Session.md, Tasks.md |
| Cursor | .cursorrules, Session.md, Tasks.md |
| Aider | CONVENTIONS.md, .aider.conf.yml, Session.md, Tasks.md |

### Standard (9-10 files)

Add to Lite:
- Context.md
- Prompt_History.md
- Activity_Log.md
- Decision_Log.md
- Issue_Log.md
- SESSION_START_PROMPTS.md

### Max (17-18 files)

Add to Standard:
- Session_Summary.md
- Deployment.md
- Compaction_Log.md
- Performance_Log.md
- Plan.md
- Inventory.md
- Strategy.md
- Exceptions.md

---

## Tool Comparison

| Feature | Claude | Gemini | Copilot | Cursor | Aider |
|---------|--------|--------|---------|--------|-------|
| Auto-loads config | Yes | Yes | Yes | Yes | Via config |
| Global config | ~/.claude/ | ~/.gemini/ | VS Code | ~/.cursor/ | ~/.aider.conf.yml |
| Project config | Root | Root | .github/ | Root | Root |
| Subdirectory scope | Via files | Yes | Via .github/instructions/ | No | No |
| Format | Markdown | Markdown | Markdown | Plain text | Markdown |

---

## Migration Between Tools

### Claude → Gemini
1. Rename `CLAUDE.md` to `GEMINI.md`
2. Update tool-specific sections
3. Session.md and Tasks.md work as-is

### Claude → Copilot
1. Copy `CLAUDE.md` content to `.github/copilot-instructions.md`
2. Adjust format for Copilot conventions
3. Session.md and Tasks.md work as-is

### Any Tool → Another
The core workflow is identical:
1. Create tool-specific instructions file
2. Point it to Session.md and Tasks.md
3. Use same session start/end prompts (adjusted for tool)

---

## Troubleshooting

### Tool not reading config file

| Tool | Check |
|------|-------|
| Claude | File named exactly `CLAUDE.md` in project root |
| Gemini | File named exactly `GEMINI.md`, check scope hierarchy |
| Copilot | File in `.github/copilot-instructions.md` (exact path) |
| Cursor | File named `.cursorrules` (with dot prefix) |
| Aider | `.aider.conf.yml` exists and lists files under `read:` |

### Session state not persisting
- Verify Session.md is being updated at session end
- Check file is in expected location
- Ensure tool has read access to file

### Multi-tool conflicts
- Each tool should read/write the same Session.md
- Avoid simultaneous edits from multiple tools
- Use git to track changes and resolve conflicts

---

## Version Information

| Field | Value |
|-------|-------|
| CxMS Version | 1.3 |
| Guide Version | 1.0 |
| Last Updated | 2026-01-24 |

---

*For updates and more information: https://github.com/RobSB2/CxMS*
