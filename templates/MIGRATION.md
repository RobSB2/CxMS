# CxMS Migration Guide

**Version:** 1.0
**Last Updated:** 2026-01-24
**CxMS Version:** 1.4

Upgrade your CxMS installation or start fresh.

---

## Quick Reference

| Scenario | Go To |
|----------|-------|
| New project, never used CxMS | [Fresh Installation](#fresh-installation-clean--green) |
| Have CxMS, want latest updates | [AI-Assisted Update](#ai-assisted-update-recommended) |
| Manual update preferred | [Manual Migration](#manual-migration) |
| Check my current version | [Version Detection](#version-detection) |

---

## Version Detection

### How to Check Your CxMS Version

**Method 1: Check CLAUDE.md header**
```markdown
# CLAUDE.md
**Version:** 1.3   ← Your version is here
```

**Method 2: Check for folder structure**
| Structure | Version |
|-----------|---------|
| `templates/core/`, `templates/logs/`, etc. | 1.3+ |
| All templates in flat `templates/` folder | 1.2 or earlier |
| No `templates/` folder | Pre-1.0 |

**Method 3: Check for key files**
| File Exists | Minimum Version |
|-------------|-----------------|
| `CxMS_Prompt_Library.md` or template | 1.3+ |
| `templates/multi-tool/` folder | 1.3+ |
| `templates/DEPLOYMENT.md` | 1.3+ |
| `PROJECT_Performance_Log.md` template | 1.1+ |

---

## Fresh Installation (Clean & Green)

For new projects or starting over completely.

### Option A: AI-Assisted Fresh Install (Recommended)

Copy this prompt to your AI assistant:

```
I want to set up CxMS (Agent Context Management System) for my project.

1. Fetch the latest CxMS templates from: https://github.com/RobSB2/CxMS
2. Read templates/DEPLOYMENT.md to understand deployment levels
3. Ask me which level I want: Lite (3 files), Standard (9 files), or Max (17+ files)
4. Create the appropriate files for my project, replacing [PROJECT] with my project name
5. Customize CLAUDE.md with my project's tech stack and conventions

My project name is: [YOUR_PROJECT_NAME]
My tech stack is: [YOUR_TECH_STACK]
```

### Option B: Manual Fresh Install

**Step 1: Choose your deployment level**

| Level | Files | Best For |
|-------|-------|----------|
| Lite | 3 | Small projects, solo work |
| Standard | 9 | Team projects, moderate complexity |
| Max | 17+ | Enterprise, complex multi-phase projects |

**Step 2: Download templates**

```bash
# Clone or download from GitHub
git clone https://github.com/RobSB2/CxMS.git

# Or download specific templates via raw URLs
curl -O https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/core/CLAUDE.md.template
```

**Step 3: Copy and customize**

See [templates/DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions per level.

---

## AI-Assisted Update (Recommended)

Let your AI assistant handle the migration automatically.

### Universal Update Prompt

Copy this prompt to your AI assistant:

```
I need to update my CxMS installation to the latest version.

Current setup:
- My CLAUDE.md is at version: [CHECK YOUR VERSION OR SAY "unknown"]
- My project files use the prefix: [YOUR_PROJECT_NAME]

Please:
1. Fetch the latest CxMS version info from: https://github.com/RobSB2/CxMS
2. Read the README.md to identify current version and changes
3. Read templates/MIGRATION.md for migration instructions
4. Compare my current setup with the latest templates
5. Tell me what's new and what needs updating
6. Apply updates while PRESERVING my customizations (project-specific content)
7. Update version numbers in my files

Important: Keep all my project-specific content (tech stack, conventions, session history). Only update CxMS framework elements.
```

### Tool-Specific Update Prompts

#### Claude Code
```
Read https://github.com/RobSB2/CxMS/blob/main/README.md and https://github.com/RobSB2/CxMS/blob/main/templates/MIGRATION.md to check for CxMS updates. Compare with my current CLAUDE.md version and suggest what needs updating. Preserve all my project-specific customizations.
```

#### Gemini CLI
```
Fetch https://github.com/RobSB2/CxMS to check the latest CxMS version. I'm currently on version [X]. Read the MIGRATION.md and tell me what updates I need. Then help me apply them while keeping my project customizations.
```

#### GitHub Copilot (Chat)
```
@workspace I want to update my CxMS setup. Please:
1. Check https://github.com/RobSB2/CxMS for the latest version
2. Compare with my current CLAUDE.md version
3. List what's new since my version
4. Help me update while preserving my project-specific content
```

#### Cursor / Aider
```
Check https://github.com/RobSB2/CxMS for CxMS updates. My current version is [X]. Read the migration guide and help me update my installation while preserving customizations.
```

---

## Manual Migration

### From Version 1.3 to 1.4

**What's New in 1.4:**
- **Auto Version Check** - AI checks for CxMS updates on session start
- **Deployment Health Check** - AI assesses your deployment level and suggests upgrades
- **VERSIONS.md** - Central manifest tracking all template versions
- **Deployment Level field** - Track Lite/Standard/Max in CLAUDE.md
- **Code Name field** - Optional personality for your AI assistant
- **Improved session start prompt** - Structured 3-part summary format
- **Yoda Mode** - Fun alternative prompts (because fun it is)

**Migration Steps:**

1. **Update CLAUDE.md version and add new fields**
   ```markdown
   **Version:** 1.4
   **Deployment Level:** Lite | Standard | Max  ← Choose your level
   **Code Name:** [Optional - e.g., Master Yoda]
   ```

2. **Add Version & Health Check section to CLAUDE.md** (after Session Start Requirements)
   ```markdown
   ### CxMS Version & Health Check (On Session Start)

   After providing the session summary, perform version and health checks:

   **Version Check:**
   1. Read the `CxMS Version` from this file
   2. Fetch: `https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/VERSIONS.md`
   3. Compare versions - if local < remote, notify user
   4. If user accepts, follow `MIGRATION.md` update process

   **Deployment Health Check:**
   1. Read the `Deployment Level` from this file
   2. Inventory which CxMS files exist in the project
   3. Check for level-up signals (see `DEPLOYMENT.md` for criteria)
   4. If upgrade recommended, notify user

   **Note:** If fetch fails (offline, etc.), skip version check silently. Health check runs locally.
   ```

3. **Update your session start prompt** (recommended)

   Old:
   ```
   Read CLAUDE.md and [PROJECT]_Session.md, summarize current status, then await instructions.
   ```

   New:
   ```
   Read CLAUDE.md and [PROJECT]_Session.md.
   Summarize:
   1. Current project state (version, key stats)
   2. Last session accomplishments
   3. Suggested next actions
   Then await instructions.
   ```

4. **Optional: Explore Yoda Mode**
   See `SESSION_START_PROMPTS.md` for fun Yoda-style prompts. Required it is not, but enjoy it you might.

5. **Optional: Update DEPLOYMENT.md awareness**
   DEPLOYMENT.md now includes health assessment criteria and level-up indicators. Review if you want to understand when to upgrade your deployment level.

**Files Changed in 1.4:**
| File | Change |
|------|--------|
| `CLAUDE.md.template` | Added Deployment Level, Code Name, Version Check section |
| `DEPLOYMENT.md` | Added health assessment section (v1.1) |
| `VERSIONS.md` | NEW - Central version manifest |
| `SESSION_START_PROMPTS.md` | Improved Quick Start prompt, added Yoda Mode |
| `SESSION_END_CHECKLIST.md` | Added Yoda quote |
| `README.md` | Updated to v1.4, added Yoda footer |
| All templates | Updated CxMS Version to 1.4 |

---

### From Version 1.2 to 1.3

**What's New in 1.3:**
- Template folder reorganization (core/, logs/, docs/, multi-tool/)
- Prompt Library template
- Multi-tool support (Gemini, Copilot, Cursor, Aider)
- DEPLOYMENT.md guide
- README highlights section

**Migration Steps:**

1. **Update CLAUDE.md version**
   ```markdown
   **Version:** 1.3
   ```

2. **No action required for existing files**
   Your `[PROJECT]_Session.md`, `[PROJECT]_Tasks.md`, etc. continue to work unchanged.

3. **Optional: Add new templates**
   - `[PROJECT]_Prompt_Library.md` - For prompt engineering training
   - Multi-tool configs if using other AI tools

4. **Optional: Update repository structure reference**
   If your CLAUDE.md references the template structure, update to reflect new folders.

### From Version 1.1 to 1.2

**What's New in 1.2:**
- E9-E12 enhancements
- Performance logging
- Multi-agent orchestration patterns
- Community telemetry templates

**Migration Steps:**

1. **Update CLAUDE.md version**
   ```markdown
   **Version:** 1.2
   ```

2. **Optional: Add Performance Log**
   Copy `PROJECT_Performance_Log.md.template` if you want to track CxMS effectiveness.

### From Version 1.0 to 1.1

**What's New in 1.1:**
- Additional log templates
- Session Summary template
- Deployment tracking template

**Migration Steps:**

1. **Update CLAUDE.md version**
   ```markdown
   **Version:** 1.1
   ```

2. **Optional: Add new log templates as needed**

### From Pre-1.0 (No Version)

If your CLAUDE.md doesn't have a version field:

1. **Add version field**
   ```markdown
   # CLAUDE.md
   **Version:** 1.3
   ```

2. **Review your file structure**
   Ensure you have the core files:
   - `CLAUDE.md`
   - `[PROJECT]_Session.md`
   - `[PROJECT]_Tasks.md`

3. **Consider adding Context.md and Prompt_History.md**
   These provide better documentation indexing and audit trails.

---

## What Gets Updated vs. Preserved

### Always Preserved (Your Content)
- Project name and description
- Tech stack details
- Coding conventions
- Session history and state
- Task lists and status
- Decision rationale
- Activity logs
- All project-specific customizations

### Updated (CxMS Framework)
- Version numbers
- Template structure references
- CxMS methodology sections
- Session lifecycle instructions
- New optional sections (you can adopt or ignore)

---

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 1.4 | 2026-01-24 | Auto version check, deployment health assessment, Yoda Mode |
| 1.3 | 2026-01-24 | Template reorganization, multi-tool support, Prompt Library |
| 1.2 | 2026-01-21 | E9-E12 enhancements, performance metrics, multi-agent |
| 1.1 | 2026-01-20 | Additional log templates, session summaries |
| 1.0 | 2026-01-20 | Initial public release |

---

## Troubleshooting

### AI can't fetch from GitHub
Some AI tools have restrictions on URL fetching. Alternatives:
1. Copy the README.md content and paste it to the AI
2. Download templates locally and ask AI to read local files
3. Use the manual migration steps above

### My customizations were overwritten
If your AI overwrote project-specific content:
1. Check git history: `git diff HEAD~1`
2. Restore specific sections: `git checkout HEAD~1 -- CLAUDE.md` then re-apply version update
3. For future updates, be explicit: "Preserve ALL content under 'Tech Stack' and 'Conventions' sections"

### Not sure which templates to add
Start minimal. You can always add more templates later:
1. Begin with Lite (3 files)
2. Add logging templates when you need audit trails
3. Add documentation templates for complex projects

### Version mismatch between files
If different files show different versions:
1. Check CLAUDE.md - this is the authoritative version
2. Update other files to match
3. The version in template files doesn't need to match your implementation version

---

## Getting Help

- **GitHub Issues:** https://github.com/RobSB2/CxMS/issues
- **README:** https://github.com/RobSB2/CxMS
- **Full Guide:** CxMS_Introduction_and_Guide.md

---

*CxMS - Stop re-explaining your project. Start where you left off.*
