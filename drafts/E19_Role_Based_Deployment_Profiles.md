# E19: Role-Based Deployment Profiles

**Status:** RFC (Request for Comments)
**Priority:** High
**Created:** 2026-01-27
**Inspired By:** Anthropic/skills repository patterns

---

## Problem Statement

Current CxMS deployment is **tool-agnostic** - it focuses on context management but doesn't help users configure their AI environment with role-appropriate tools. This creates friction:

1. **Per-session tool installation** - Users must configure Playwright, MCP servers, or other tools each session
2. **No role-specific guidance** - A web developer and a project manager have different needs, but get the same CLAUDE.md template
3. **Tool discovery burden** - Users don't know which tools exist or how to configure them for their role
4. **Repeated configuration** - Each new project requires manual tool setup

**Real-world example:**
> "Seems kind of crazy that each Claude session has to install tools like Playwright vs global tools/skills."

---

## Proposed Solution: Role-Based Deployment Profiles

Extend CxMS with **deployment profiles** that bundle:
- Pre-configured tool settings
- Role-specific CLAUDE.md extensions
- Recommended skills/MCP servers
- Domain-appropriate context templates

### Architecture Overview

```
CxMS Deployment
├── Level (Lite/Standard/Max)      ← Current system
└── Profile (Web Dev/PM/Data/...)  ← NEW: Role-based tooling
```

---

## Profile Structure

### Profile Manifest (`profiles/MANIFEST.json`)

Similar to Anthropic's `marketplace.json`:

```json
{
  "version": "1.0",
  "profiles": [
    {
      "id": "web-developer",
      "name": "Web Developer",
      "description": "Full-stack web development with testing, browser automation, and frontend tools",
      "tools": {
        "global": ["playwright", "prettier", "eslint"],
        "mcp_servers": ["@anthropic/fetch", "@anthropic/filesystem"],
        "skills": ["webapp-testing", "web-artifacts-builder"]
      },
      "files": [
        "profiles/web-developer/CLAUDE_EXTENSION.md",
        "profiles/web-developer/settings.json"
      ],
      "contexts": ["tech-stack", "api-patterns", "testing-strategy"]
    },
    {
      "id": "project-manager",
      "name": "Project Manager / Agent Coordinator",
      "description": "Multi-agent coordination, documentation, and project tracking",
      "tools": {
        "global": [],
        "mcp_servers": ["@anthropic/fetch"],
        "skills": ["doc-coauthoring", "internal-comms"]
      },
      "files": [
        "profiles/project-manager/CLAUDE_EXTENSION.md",
        "profiles/project-manager/COORDINATION_PROTOCOL.md"
      ],
      "contexts": ["team-structure", "project-timeline", "stakeholders"]
    },
    {
      "id": "data-engineer",
      "name": "Data Engineer",
      "description": "Data pipelines, SQL, analytics, and ETL workflows",
      "tools": {
        "global": ["duckdb", "pandas"],
        "mcp_servers": ["@anthropic/postgres", "@anthropic/sqlite"],
        "skills": ["xlsx", "pdf"]
      },
      "files": [
        "profiles/data-engineer/CLAUDE_EXTENSION.md",
        "profiles/data-engineer/DATA_PATTERNS.md"
      ],
      "contexts": ["data-sources", "schema-docs", "pipeline-architecture"]
    },
    {
      "id": "devops",
      "name": "DevOps / Infrastructure",
      "description": "CI/CD, containers, cloud infrastructure, and deployment automation",
      "tools": {
        "global": ["docker", "terraform", "kubectl"],
        "mcp_servers": ["@anthropic/fetch", "@anthropic/filesystem"],
        "skills": []
      },
      "files": [
        "profiles/devops/CLAUDE_EXTENSION.md",
        "profiles/devops/INFRA_CONVENTIONS.md"
      ],
      "contexts": ["infra-topology", "deployment-targets", "security-policies"]
    },
    {
      "id": "technical-writer",
      "name": "Technical Writer",
      "description": "Documentation, API specs, and content creation",
      "tools": {
        "global": ["vale", "markdownlint"],
        "mcp_servers": ["@anthropic/fetch"],
        "skills": ["docx", "pdf", "doc-coauthoring", "brand-guidelines"]
      },
      "files": [
        "profiles/technical-writer/CLAUDE_EXTENSION.md",
        "profiles/technical-writer/STYLE_GUIDE.md"
      ],
      "contexts": ["audience-personas", "terminology", "brand-voice"]
    }
  ]
}
```

---

## Profile Components

### 1. CLAUDE_EXTENSION.md (Role-Specific Guidance)

Each profile includes an extension file that gets appended to or referenced by CLAUDE.md:

```markdown
# Web Developer Extension

## Role Context
You are assisting a web developer. Prioritize:
- Code quality and testing
- Performance optimization
- Accessibility compliance
- Security best practices

## Available Tools

### Playwright (Browser Automation)
- **Installed globally:** Yes
- **Usage:** `npx playwright test` or via MCP
- **Config:** See `.playwright/playwright.config.ts`

### Testing Patterns
- Unit tests: Vitest/Jest
- E2E tests: Playwright
- Component tests: Testing Library

## Pre-Approved Operations
| Operation | Approved | Notes |
|-----------|----------|-------|
| Run tests | Yes | `npm test`, `npx playwright test` |
| Start dev server | Yes | `npm run dev` |
| Install packages | Yes | npm/yarn/pnpm |
| Browser automation | Yes | Playwright scripts |

## Domain-Specific Context Templates
When starting a web project, gather:
- [ ] Framework (React/Vue/Svelte/etc.)
- [ ] Testing strategy
- [ ] Deployment target
- [ ] API integration points
```

### 2. Settings Templates (`settings.json`)

Pre-configured Claude Code settings for the role:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(playwright:*)",
      "Bash(git:*)",
      "mcp__fetch__*",
      "mcp__filesystem__*"
    ]
  },
  "env": {
    "PLAYWRIGHT_BROWSERS_PATH": "~/.cache/ms-playwright"
  }
}
```

### 3. Global Tool Installation Script

One-time setup for profile tools:

```bash
#!/bin/bash
# profiles/web-developer/install.sh

echo "Installing Web Developer profile tools..."

# Global npm packages
npm install -g playwright prettier eslint

# Playwright browsers (shared location)
npx playwright install --with-deps

# MCP servers
claude mcp add @anthropic/fetch
claude mcp add @anthropic/filesystem

echo "Web Developer profile ready!"
```

---

## Integration with Existing CxMS

### Deployment Matrix

| Level | + Profile | Result |
|-------|-----------|--------|
| Lite | Web Dev | Minimal docs + web tooling |
| Standard | PM | Full docs + coordination tools |
| Max | Data Eng | All docs + data tools + telemetry |

### Updated CLAUDE.md Header

```markdown
# CLAUDE.md

**CxMS Version:** 1.6
**Deployment Level:** Standard
**Profile:** Web Developer  ← NEW
```

### Updated Startup Sequence

In `PROJECT_Startup.md.template`:

```markdown
### 1b. Check Profile Configuration (if configured)
If `profiles/` directory exists:
1. Read `profiles/MANIFEST.json` to identify active profile
2. Read profile's `CLAUDE_EXTENSION.md`
3. Verify global tools are installed
4. Load profile-specific approvals
```

---

## User Workflow

### Initial Setup (One-Time)

```bash
# 1. Choose a profile
cxms profile list
# Available profiles:
#   - web-developer: Full-stack web development...
#   - project-manager: Multi-agent coordination...
#   - data-engineer: Data pipelines, SQL...

# 2. Install profile (global tools + config)
cxms profile install web-developer
# Installing playwright globally...
# Configuring MCP servers...
# Created ~/.cxms/profiles/web-developer/

# 3. Profile is now available for all projects
```

### Per-Project Setup

```bash
# Apply profile to a new project
cd my-web-project
cxms init --level standard --profile web-developer
# Created CLAUDE.md with web-developer extension
# Copied profile settings
# Ready!
```

### Session Start

```
Read CxMS_Startup.md and follow its instructions.

> Profile: Web Developer
> Global tools: playwright (installed), prettier (installed)
> MCP servers: fetch, filesystem
> Role guidance loaded from CLAUDE_EXTENSION.md
```

---

## Profile Development Guide

### Creating a New Profile

```
profiles/
└── my-role/
    ├── SKILL.md           # Metadata (Anthropic skills format)
    ├── CLAUDE_EXTENSION.md # Role-specific guidance
    ├── settings.json      # Claude Code settings
    ├── install.sh         # Global tool installation
    ├── install.ps1        # Windows variant
    └── references/        # Optional domain knowledge
        ├── workflows.md
        └── patterns.md
```

### SKILL.md Format (Anthropic-Compatible)

```yaml
---
name: my-role
description: |
  Description that triggers profile selection.
  Include specific use cases and when to activate.
license: MIT
---

# My Role Profile

[Additional documentation]
```

---

## Benefits

1. **One-time global setup** - Install tools once, use everywhere
2. **Role-appropriate context** - AI understands your domain from the start
3. **Reduced friction** - No per-session tool configuration
4. **Community-driven** - Profiles can be shared and improved
5. **Anthropic-compatible** - Uses same skill format as official repo

---

## Implementation Phases

### Phase 1: Core Profiles (MVP)
- [ ] Create `profiles/` directory structure
- [ ] Implement 3 core profiles: web-developer, project-manager, data-engineer
- [ ] Create `cxms profile` CLI commands
- [ ] Update CLAUDE.md template with profile support
- [ ] Document profile creation guide

### Phase 2: Tool Integration
- [ ] Global tool installation scripts (bash + PowerShell)
- [ ] MCP server configuration automation
- [ ] Settings.json merging logic
- [ ] Profile verification command

### Phase 3: Community & Distribution
- [ ] Profile submission guidelines
- [ ] Profile marketplace/registry
- [ ] Version management for profiles
- [ ] Telemetry for profile adoption

---

## Design Decisions

### 1. Profile Location: Layered Architecture

**Decision:** Global + project-local with layering

```
~/.cxms/
├── profiles/                    ← Global (installed tools, base configs)
│   ├── web-developer/
│   │   ├── SKILL.md
│   │   ├── CLAUDE_EXTENSION.md
│   │   ├── settings.json
│   │   └── installed.json       ← Tracks installed tools/versions
│   └── data-engineer/
└── config.json                  ← Global CxMS settings

./cxms/                          ← Project-local
├── profile.json                 ← Active profiles + overrides
└── CLAUDE_EXTENSION.local.md    ← Project-specific additions
```

**Rationale:**
- Tools (Playwright browsers ~500MB) installed once globally
- Project tweaks stay local and version-controlled
- Mirrors git/npm global+local config pattern
- Clean separation: "installed" vs "configured"

### 2. Profile Composition: Multi-Profile with Merge

**Decision:** Allow multiple profiles with explicit merge strategy

```json
// ./cxms/profile.json
{
  "profiles": ["web-developer", "technical-writer"],
  "merge_strategy": "last-wins",
  "overrides": {
    "approvals": {
      "Bash(vale:*)": true
    }
  }
}
```

**Merge Rules:**
| Component | Strategy |
|-----------|----------|
| `tools.global` | Union (all tools) |
| `tools.mcp_servers` | Union with dedup |
| `permissions` | Union (most permissive) |
| `CLAUDE_EXTENSION` | Concatenate with `## Profile: {name}` headers |
| Settings conflicts | Last profile wins, or explicit override |

**Common Combinations:**
- Web Dev + Technical Writer = developer who documents
- Data Engineer + DevOps = platform engineer
- PM + Technical = tech lead

### 3. Anthropic Skills: Compatible, Not Dependent

**Decision:** Use Anthropic-compatible format, allow skill imports, remain standalone

```yaml
# Profile SKILL.md (Anthropic-compatible)
---
name: web-developer
description: Full-stack web development with testing...
cxms:
  version: ">=1.6"
  deployment_levels: [standard, max]
anthropic_skills:              # Optional skill references
  - webapp-testing
  - web-artifacts-builder
---
```

**Integration Approach:**
- CxMS profiles use SKILL.md format (same as Anthropic)
- Optional `anthropic_skills` array imports official skills
- CxMS works fully offline (no hard dependency)
- Profiles can be contributed to Anthropic marketplace

**CLI Integration:**
```bash
# Import Anthropic skill into profile
cxms profile add-skill web-developer anthropic/webapp-testing

# Reference in profile.json
{
  "profiles": ["web-developer"],
  "external_skills": ["anthropic/docx", "anthropic/pdf"]
}
```

### 4. Tool Versioning: Latest with Optional Pinning

**Decision:** Default to latest, allow pinning for stability

```json
// Profile tools definition
{
  "tools": {
    "global": [
      "playwright",           // Latest
      "prettier@3.x",         // Major version pinned
      "eslint@8.57.0"         // Exact version pinned
    ]
  }
}
```

**Rationale:**
- Most users want latest (security patches, features)
- Enterprise/stability users can pin
- Semver ranges supported for balance

### 5. MCP Server Management: Auto-Configure with Confirmation

**Decision:** Auto-configure on first profile activation, with user confirmation

```
$ cxms profile install web-developer

Installing Web Developer profile...
✓ playwright installed globally
✓ prettier installed globally

This profile uses MCP servers:
  - @anthropic/fetch (web requests)
  - @anthropic/filesystem (file access)

Configure these MCP servers now? [Y/n] y
✓ MCP servers configured

Profile ready! Use with: cxms init --profile web-developer
```

**Rationale:**
- Reduces friction (one prompt vs per-server)
- User still has control (can decline)
- MCP servers listed with purpose for informed consent

### 6. Profile Updates: VERSIONS.md Pattern

**Decision:** Profile versioning follows CxMS VERSIONS.md pattern

```markdown
# ~/.cxms/profiles/VERSIONS.md

## Profile Versions

| Profile | Installed | Latest | Status |
|---------|-----------|--------|--------|
| web-developer | 1.0.0 | 1.1.0 | Update available |
| data-engineer | 1.0.0 | 1.0.0 | Current |
```

**Update Flow:**
```bash
# Check for updates
cxms profile check

# Update specific profile
cxms profile update web-developer

# Update all
cxms profile update --all
```

**Notification:** On session start, if profile updates available:
```
Profile updates available: web-developer (1.0.0 → 1.1.0)
Run `cxms profile update` to upgrade.
```

---

## Related Enhancements

- E16: Parent-Child Convention Inheritance (profiles could inherit)
- E17: Pre-Approved Operations (profiles include approvals)
- E12: Multi-Agent Orchestration (PM profile specializes in this)

---

## References

- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Agent Skills Specification](https://agentskills.io)
- [Claude Code MCP Documentation](https://docs.anthropic.com/claude/docs/mcp)
