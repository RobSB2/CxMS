---
name: project-manager
description: |
  Multi-agent coordination, documentation workflows, and project tracking toolkit.

  Use this profile when working on:
  - Coordinating multiple AI agents or sessions
  - Project planning and roadmaps
  - Documentation and requirements gathering
  - Team communication and stakeholder management
  - Sprint planning and task tracking
  - Cross-project dependencies

  Optimized for orchestration tasks rather than code implementation.
  Includes doc-coauthoring and internal-comms skills from Anthropic.
license: MIT
cxms:
  version: ">=1.6"
  deployment_levels: [standard, max]
  profile_version: "1.0.0"
anthropic_skills:
  - doc-coauthoring
  - internal-comms
---

# Project Manager / Agent Coordinator Profile

This profile configures Claude Code for project coordination, multi-agent orchestration, and documentation workflows.

## Included Tools

### Global Packages
None required - this profile focuses on coordination patterns rather than tooling.

### MCP Servers
- **@anthropic/fetch** - Web requests for external integrations

### Anthropic Skills
- **doc-coauthoring** - Structured documentation workflow
- **internal-comms** - Internal communication templates

## When This Profile Activates

The profile guidance loads when Claude detects coordination context:
- Multi-project or multi-agent discussions
- Planning documents (roadmaps, sprints, requirements)
- Communication drafting (updates, announcements)
- Task tracking and delegation

## Combines Well With

- **web-developer** - Tech lead coordinating development
- **technical-writer** - Documentation-heavy projects
- **devops** - Infrastructure coordination

## Usage

```bash
# Install globally (one-time)
cxms profile install project-manager

# Apply to a project
cxms init --profile project-manager

# Tech lead combo
cxms init --profile project-manager,web-developer
```
