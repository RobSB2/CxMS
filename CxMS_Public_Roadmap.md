# CxMS Product Roadmap

**Version:** 1.0
**Created:** 2026-01-20
**Last Updated:** 2026-02-06
**Purpose:** Document planned enhancements and product direction for CxMS
**Status:** Active Development

---

## Overview

This document tracks the CxMS product roadmap, including planned enhancements, implementation status, and priorities. Enhancements are discovered through real-world usage and community feedback.

**Current Status:** 24 public enhancements documented, 13 implemented, 4 superseded, 7 in RFC stage.

CxMS follows a rapid enhancement cycle — enhancements are identified from real-world pain points, designed, and implemented within the same release stream. Most enhancements originated from direct usage in production projects.

---

## Enhancement Summary

| # | Enhancement | Status | Category |
|---|------------|--------|----------|
| E1 | Cross-Agent Coordination Protocol | Implemented | Multi-Agent |
| E2 | Periodic Context Verification | Implemented | Core |
| E3 | Automated Session Handoff Document | RFC | Core |
| E4 | Multi-Project Dashboard | RFC | Tooling |
| E5 | Context Compression Strategies | Superseded (E21) | - |
| E6 | Token Usage & Conservation | Superseded (E21) | - |
| E7 | Context Usage & Conservation | Superseded (E10) | - |
| E8 | Communication Efficiency | Implemented | Core |
| E9 | Performance Monitoring & Validation | Implemented | Logging |
| E10 | CxMS Health Check (Staleness Audit) | Implemented | Core |
| E11 | Log Aging & Archival Strategy | Superseded (E21) | - |
| E12 | Multi-Agent CxMS Orchestration | RFC | Multi-Agent |
| E13 | Community Telemetry & Case Study Pipeline | Implemented | Community |
| E14 | CxMS Portability Kit | RFC | Tooling |
| E15 | CxMS Update & Release Management | RFC | Tooling |
| E16 | Parent-Child CxMS Convention Inheritance | Implemented | Core |
| E17 | Pre-Approved Operations | Implemented | Core |
| E18 | Automated Telemetry with Consent | Implemented | Tooling |
| E19 | Role-Based Deployment Profiles | Implemented | Profiles |
| E20 | Multi-Tool Profile Export | Implemented | Profiles |
| E21 | Context Lifecycle Management | RFC | Core |
| E22 | Cascading Configuration System | Implemented | Tooling |
| E23 | Startup Context Budget & Auto-Archiving | RFC | Core |
| E26 | Universal Document Classification | Implemented | Security |
| E27 | Directory Access Control | Implemented | Security |

> **Note:** Some enhancement numbers are reserved for internal/enterprise features not yet published.

---

## Implemented Enhancements

### E1: Cross-Agent Coordination Protocol
**Implemented:** v1.6

When multiple AI sessions work on related projects, they operate in isolation. Changes in one session can affect another's context with no notification mechanism.

**Solution:** Cross-session notification system with three components:
- **Notification File:** `CROSS_SESSION_NOTIFICATIONS.md` — inter-session messages with acknowledgment tracking
- **Session Registry:** `SESSION_REGISTRY.md` — tracks active sessions and their focus
- **Project Linking:** CLAUDE.md defines related projects and check protocols

**Templates:**
- `templates/multi-agent/CROSS_SESSION_NOTIFICATIONS.md.template`
- `templates/multi-agent/SESSION_REGISTRY.md.template`

---

### E2: Periodic Context Verification
**Implemented:** v1.6

During long sessions, AI agents can drift from project conventions as the context window fills with task-specific content. The original CLAUDE.md instructions lose prominence.

**Solution:** Mandatory re-read of CLAUDE.md preferences every 3-5 work packages, with trigger conditions for immediate re-read (new team member mentions, architecture changes, deployment context shifts).

**Implementation:** Added to `templates/core/CLAUDE.md.template` as mandatory requirements section.

> **Honest Status:** Template directive exists but agent compliance is inconsistent. Future work needed on structural enforcement (hooks, automated triggers).

---

### E8: Communication Efficiency
**Implemented:** v1.3

AI agents often produce verbose output that wastes context window space and makes sessions harder to review.

**Solution:** Communication efficiency directives added to CLAUDE.md template:
- Prefer tables over paragraphs for structured data
- Use TL;DR sections for long documents
- Avoid restating what the user just said
- Keep status updates concise

---

### E9: Performance Monitoring & Validation
**Implemented:** v1.1

No way to measure whether CxMS is actually helping or how effective sessions are.

**Solution:** Performance monitoring template that tracks:
- Context recovery time (how fast the AI gets up to speed)
- Task completion rates
- Session effectiveness metrics
- Comparison across sessions

**Template:** `templates/logs/PROJECT_Performance_Log.md.template`

---

### E10: CxMS Health Check (Staleness Audit)
**Implemented:** v1.3

CxMS files can become inconsistent — Tasks.md shows items done that Session.md still lists as in-progress, or Activity_Log references files that no longer exist.

**Solution:** Systematic cross-file validation that checks:
- Session.md ↔ Tasks.md consistency
- File references still valid
- No orphaned tasks or stale status
- Context freshness protocol (from E7)

> **Honest Status:** Template and protocol defined but no automated execution. Future work needed to integrate into startup sequence.

---

### E13: Community Telemetry & Case Study Pipeline
**Implemented:** v1.4

No way to understand how CxMS is being used across the community or to collect effectiveness data.

**Solution:** Opt-in telemetry system with:
- Anonymous usage data (deployment level, AI tool, project type)
- Enhancement demand tracking
- Community dashboard: https://robsb2.github.io/CxMS/dashboard
- GitHub issue-based case study submission

**Tool:** `tools/cxms-report.mjs`

---

### E16: Parent-Child CxMS Convention Inheritance
**Implemented:** v1.5

Child projects (e.g., a microservice within a monorepo) need to inherit conventions from a parent CxMS system without duplicating everything.

**Solution:** Parent reference in child CLAUDE.md that points to parent project conventions. Child overrides only what's specific to its scope.

---

### E17: Pre-Approved Operations
**Implemented:** v1.5

AI agents repeatedly prompt for permission on operations the user has already approved, creating friction during every session.

**Solution:** `PROJECT_Approvals.md` file documenting standing approvals for git, file, and bash operations. Agent reads at startup and skips prompts for listed operations.

**Template:** `templates/core/PROJECT_Approvals.md.template`

**Status:** Working well — measurably reduced permission prompts in real sessions.

---

### E18: Automated Telemetry with Consent
**Implemented:** v1.5 (upgraded to v1.2.0)

Manual telemetry submission is forgotten. Need automated, respectful data collection.

**Solution:** Opt-out consent model with:
- Queue-first resilience (works offline, retries later)
- `--quiet` mode for minimal output
- Consent stored in `.cxms/telemetry-consent.json`
- Auto-submit at session end

**Tool:** `tools/cxms-report.mjs` with `--auto`, `--quiet`, `--status`, `--revoke`, `--consent` flags.

---

### E19: Role-Based Deployment Profiles
**Implemented:** v1.6

Different roles (web developer, project manager, data engineer) need different CxMS configurations, tools, and MCP servers.

**Solution:** Profile system with 5 built-in profiles:
- **web-developer:** Frontend/backend focus, testing frameworks
- **project-manager:** Planning, documentation, communication
- **data-engineer:** ETL, databases, data pipelines
- **devops:** Infrastructure, CI/CD, monitoring
- **technical-writer:** Documentation, API docs, style guides

Each profile includes SKILL.md, CLAUDE_EXTENSION.md, settings.json, and install scripts.

**Tool:** `tools/cxms-profile.mjs`
**Profiles:** `templates/profiles/`

---

### E20: Multi-Tool Profile Export
**Implemented:** v1.6

CxMS profiles are Claude Code-specific. Users of Cursor, Copilot, Windsurf, and Aider need equivalent configurations.

**Solution:** Export functionality generating tool-specific configs:

| Format | Target Tool | Output File |
|--------|------------|-------------|
| cursorrules | Cursor | `.cursorrules` |
| copilot | GitHub Copilot | `.github/copilot-instructions.md` |
| windsurf | Windsurf | `.windsurfrules` |
| aider | Aider | `CONVENTIONS.md` |

**Tool:** `tools/cxms-profile.mjs export --format <type>`

---

### E22: Cascading Configuration System
**Implemented:** v1.6

Each project has standalone CLAUDE.md with no inheritance, leading to duplication and inconsistency across projects.

**Solution:** CSS-like cascading configuration:
- **GLOBAL** (`~/.cxms/`) — user-wide defaults
- **WORKSPACE** (monorepo root) — team conventions
- **PROJECT** — specific overrides

Section markers control inheritance: `[REQUIRED]`, `[INHERIT]`, `[OVERRIDE]`, `[DEFAULT]`.

**Tool:** `tools/cxms-cascade.mjs` with `chain`, `show`, `audit`, `enable`, `init` commands.

> **Honest Status:** Tool built and functional but not yet integrated into startup sequence. Requires manual invocation.

---

### E26: Universal Document Classification
**Implemented:** Session 39

Documents across projects have no standardized classification, creating risk of proprietary content being accidentally shared or committed to wrong repositories.

**Solution:** Classification headers + YAML policy file:
- 5 classification levels: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, REGULATED
- Pattern-based auto-classification by file path and suffix
- Policy file: `.cxms/classification.yaml`

---

### E27: Directory Access Control
**Implemented:** Session 39

AI coding agents can start in any directory with no guardrails. Easy to accidentally work in the wrong repository context.

**Solution:** Directory startup control:
- Repository verification (remote URL + path check) before operations
- Blocking check with visual warning and explicit options
- Audit logging for overrides
- Configurable blocked directory patterns

**Policy file:** `.cxms/access.yaml`

---

## RFC Enhancements (Planned)

### E3: Automated Session Handoff Document
**Priority:** Medium

When a session ends (context exhaustion, user departure, compaction), the next session starts cold. Manual session notes are inconsistent.

**Proposed:** Structured handoff document auto-generated at session end containing: current task state, file references, pending decisions, and exact continuation prompt.

---

### E4: Multi-Project Dashboard
**Priority:** Medium

Users managing multiple CxMS projects have no central view of project status, health, or recent activity.

**Proposed:** Central dashboard file (or CLI output) aggregating status across all CxMS-managed projects in a workspace.

---

### E12: Multi-Agent CxMS Orchestration
**Priority:** Enterprise

E1 enables coordination through notification files. E12 takes this further with automated orchestration — an agent that coordinates work across multiple sessions.

**Proposed:** Orchestrator patterns (Ralph-style loops, coordinator agents) that manage cross-project synchronization using CxMS files as the shared state layer.

---

### E14: CxMS Portability Kit
**Priority:** High

Adding CxMS to an existing project requires manual template copying and customization.

**Proposed:** Deployment package with:
- `cxms init` command for new projects
- `cxms retrofit` for existing projects
- Auto-detection of AI tools in use
- Multi-tool config generation

---

### E15: CxMS Update & Release Management
**Priority:** High

No standardized way to detect or apply CxMS updates across projects.

**Proposed:** Version tracking with:
- Local vs remote version comparison at session start
- Migration scripts for template updates
- Changelog tracking
- `VERSIONS.md` as source of truth

---

### E21: Context Lifecycle Management
**Priority:** Next (consolidates E5, E6, E11)

Three superseded enhancements addressed parts of the context lifecycle. E21 unifies them:
- **Pillar 1 (Structure):** TL;DR sections, tables over prose, information density
- **Pillar 2 (Loading):** Tiered context loading — read summary first, details on demand
- **Pillar 3 (Aging):** Current → Aging → Archive lifecycle with automatic transitions

---

### E23: Startup Context Budget & Auto-Archiving
**Priority:** High

Session.md files grow unbounded. CxMS itself reached 1,567 lines before manual intervention, consuming 26% of context at startup.

**Proposed:** Configuration-driven context budget:
- Configurable startup target (default: 15%)
- Session retention limit (keep N most recent inline)
- Three modes: `prompt` (default), `auto`, `disabled`
- Budget check at session start with status reporting

---

## Superseded Enhancements

| Enhancement | Absorbed Into | Reason |
|-------------|--------------|--------|
| E5: Context Compression Strategies | E21 (Pillar 1) | Compression is part of broader lifecycle |
| E6: Token Usage & Conservation | E21 (Pillar 2) | Token management is part of loading strategy |
| E7: Context Usage & Conservation | E10 (Health Check) | Freshness checks folded into staleness audit |
| E11: Log Aging & Archival | E21 (Pillar 3) | Aging is part of broader lifecycle |

---

## Effectiveness Notes

We believe in honest documentation. Some implemented enhancements work better than others:

**Reliably Working:** E17 (Pre-Approved Ops), E19/E20 (Profiles), E26/E27 (Classification/Access Control)
- These all have *structural enforcement* — a file the agent must read or a check that blocks progress.

**Needs Improvement:** E2 (Periodic Verification), E10 (Health Check), E22 (Cascading Config)
- These exist as directives or tools but lack triggers to make them actually run.

**Key Insight:** Enhancements that rely on the agent voluntarily doing something ("check this every N actions") are unreliable. Enhancements that create structural checkpoints ("read this file to proceed") work consistently. Future enhancements will prioritize structural enforcement.

---

## Implementation Priority

| Priority | Enhancement | Complexity | Impact |
|----------|-------------|------------|--------|
| 1 | E21: Context Lifecycle Management | Medium | Very High |
| 2 | E23: Startup Context Budget | Low | Very High |
| 3 | E14: CxMS Portability Kit | Medium | Very High |
| 4 | E15: Update & Release Management | Low | Very High |
| 5 | E3: Automated Session Handoff | Low | Medium |
| 6 | E4: Multi-Project Dashboard | Medium | Medium |
| 7 | E12: Multi-Agent Orchestration | High | Very High |

---

## Contributing

Enhancement ideas are welcome! If you've used CxMS and found a gap, please:
1. Open a GitHub issue with the `enhancement` label
2. Describe the problem you encountered
3. Propose a solution if you have one

All enhancements in this roadmap originated from real-world usage pain points.

---

## Revision History

| Date | Change |
|------|--------|
| 2026-02-06 | v1.0: Initial public roadmap (25 enhancements, split from internal roadmap) |
| 2026-01-30 | E22: Cascading Configuration implemented |
| 2026-01-27 | E19/E20: Profiles and Multi-Tool Export implemented |
| 2026-01-25 | E16-E18: Inheritance, Approvals, Telemetry implemented |
| 2026-01-21 | E12-E15: Orchestration, Telemetry, Portability, Release Management |
| 2026-01-20 | Initial enhancement exploration (E1-E10) |
