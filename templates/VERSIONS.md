# CxMS Template Versions

**CxMS Framework Version:** 1.6
**Last Updated:** 2026-01-27

This file is the single source of truth for template versions. AI assistants should fetch this file to check for updates.

---

## Core Templates (`templates/core/`)

| Template | Version | Description |
|----------|---------|-------------|
| `CLAUDE.md.template` | 1.6 | Project overview with AI requirements + Context Monitoring + Approvals |
| `CLAUDE.md.existing-project.template` | 1.0 | Adding CxMS to existing projects |
| `PROJECT_Approvals.md.template` | 1.0 | Pre-approved operations to reduce permission prompts |
| `PROJECT_Startup.md.template` | 1.1 | Single-file session initialization + telemetry consent |
| `PROJECT_Context.md.template` | 1.0 | Documentation index |
| `PROJECT_Session.md.template` | 1.1 | Session state tracking |
| `PROJECT_Tasks.md.template` | 1.0 | Task tracker |
| `PROJECT_Prompt_History.md.template` | 1.0 | Prompt audit trail |
| `SESSION_START_PROMPTS.md` | 1.3 | Copy-paste session prompts |
| `SESSION_END_CHECKLIST.md` | 1.0 | Session wrap-up workflow |

## Log Templates (`templates/logs/`)

| Template | Version | Description |
|----------|---------|-------------|
| `PROJECT_Activity_Log.md.template` | 1.0 | Significant actions record |
| `PROJECT_Decision_Log.md.template` | 1.0 | Decisions with rationale |
| `PROJECT_Issue_Log.md.template` | 1.0 | Issue tracking |
| `PROJECT_Session_Summary.md.template` | 1.0 | Quick session reference |
| `PROJECT_Deployment.md.template` | 1.0 | Deployment tracking |
| `PROJECT_Compaction_Log.md.template` | 1.0 | Context loss tracking |
| `PROJECT_Performance_Log.md.template` | 1.1 | CxMS effectiveness metrics |

## Documentation Templates (`templates/docs/`)

| Template | Version | Description |
|----------|---------|-------------|
| `PROJECT_Plan.md.template` | 1.0 | Multi-phase project planning |
| `PROJECT_Inventory.md.template` | 1.0 | Component inventory |
| `PROJECT_Strategy.md.template` | 1.0 | AI workflow strategy |
| `PROJECT_Exceptions.md.template` | 1.0 | Technical workarounds |
| `PROJECT_Prompt_Library.md.template` | 1.0 | Curated prompts |

## Multi-Tool Templates (`templates/multi-tool/`)

| Template | Version | Description |
|----------|---------|-------------|
| `GEMINI.md.template` | 1.0 | Gemini CLI config |
| `copilot-instructions.md.template` | 1.0 | GitHub Copilot config |
| `cursorrules.template` | 1.0 | Cursor config |
| `CONVENTIONS.md.template` | 1.0 | Aider config |
| `MULTI-TOOL-DEPLOYMENT.md` | 1.0 | Multi-tool deployment guide |

## Guide Files (`templates/`)

| File | Version | Description |
|------|---------|-------------|
| `DEPLOYMENT.md` | 1.1 | Deployment levels guide + health assessment |
| `MIGRATION.md` | 1.0 | Fresh install & upgrade guide |
| `VERSIONS.md` | 1.0 | This file |

## Role-Based Profiles (`templates/profiles/`)

| Profile | Version | Status | Description |
|---------|---------|--------|-------------|
| `web-developer` | 1.0.0 | Stable | Playwright, Prettier, ESLint, web testing |
| `project-manager` | 1.0.0 | Stable | Multi-agent coordination, documentation |
| `data-engineer` | 1.0.0 | Stable | DuckDB, SQL, data pipelines |
| `devops` | 1.0.0 | Stable | Docker, Terraform, Kubernetes |
| `technical-writer` | 1.0.0 | Stable | Vale, markdownlint, content creation |

**Profile Files:**
| File | Description |
|------|-------------|
| `MANIFEST.json` | Profile registry and metadata |
| `PROJECT_profile.json.template` | Project-local profile configuration |
| `{profile}/SKILL.md` | Anthropic-compatible profile metadata |
| `{profile}/CLAUDE_EXTENSION.md` | Role-specific AI guidance |
| `{profile}/settings.json` | Claude Code permission presets |
| `{profile}/install.sh` | Unix tool installation script |
| `{profile}/install.ps1` | Windows tool installation script |

## Tools (`tools/`)

| File | Version | Platform | Description |
|------|---------|----------|-------------|
| `cxms-report.mjs` | 1.1.0 | Node.js | Telemetry reporter with consent management |
| `cxms-profile.mjs` | 1.0.0 | Node.js | Profile manager CLI |
| `statusline-command.sh` | 1.1.0 | Bash (Mac/Linux) | Context monitoring statusline script |
| `statusline-command.ps1` | 1.0.0 | PowerShell (Windows) | Context monitoring statusline script |
| `supabase-schema.sql` | 1.0 | SQL | Telemetry database schema |

---

## Version History

| Date | CxMS Version | Changes |
|------|--------------|---------|
| 2026-01-27 | 1.6 | **E19 Role-Based Deployment Profiles** - web-developer profile, cxms-profile CLI |
| 2026-01-25 | 1.5 | E16 Parent-Child Inheritance, E17 Approvals template |
| 2026-01-24 | 1.4 | Added VERSIONS.md, version check, health check, Context Monitoring |
| 2026-01-24 | 1.3 | E14 Portability Kit, E15 Update Management, Multi-tool support |
| 2026-01-21 | 1.2 | E11-E13, full dogfooding |
| 2026-01-20 | 1.1 | E9-E10, initial release |

---

## For AI Assistants

To check if a user's CxMS installation is current:

1. Read the user's CLAUDE.md to get their `CxMS Version`
2. Fetch this file from: `https://raw.githubusercontent.com/RobSB2/CxMS/main/templates/VERSIONS.md`
3. Compare versions
4. If outdated, offer to update using the process in `MIGRATION.md`

**Comparison logic:**
- If user's CxMS Version < Framework Version here → update available
- Check individual template versions for granular updates
