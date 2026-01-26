# CxMS - Decision Log

**Template Version:** 1.0
**Purpose:** Record significant decisions and their rationale for future reference
**Created:** 2026-01-21
**Format:** Append new decisions chronologically

---

## Decisions

### DEC-007: Child Project Independence (Multi-Agent Lessons)
**Date:** 2026-01-25
**Status:** Active
**Category:** Architecture

**Context:**
During Session 11, ASB (child project) had issues with telemetry and CxMS conventions. Parent session (CxMS) needed to fix child project files, revealing multi-agent coordination issues.

**Problems Discovered:**
1. ASB telemetry submitted but `cxms_version` and `deployment_level` were null
2. Version regex looked for `**Version:**` but ASB had `**CxMS Version:**`
3. ASB was missing `Deployment Level` metadata entirely
4. ASB's CLAUDE.md said "when unsure, check parent" - created runtime dependency
5. Telemetry was fully manual - easy to forget between sessions

**Lessons Learned:**

| Lesson | Implementation |
|--------|----------------|
| Child projects must be fully self-sufficient | Parent reference is "optional enrichment" not dependency |
| Tools must handle variations | Regex now matches `**CxMS Version:**` and `**Version:**` |
| Required metadata must be explicit | Templates include all required fields with no assumptions |
| Cross-project tools need robust extraction | Case-insensitive, flexible patterns |
| Automated workflows need consent management | E18: one-time consent, auto-submit thereafter |
| **Sessions are autonomous** | Parent session must NOT perform actions for child sessions (e.g., telemetry) |
| Session wrap-up = THIS project only | Don't wrap up sibling/child projects - they handle themselves |

**Decision:**
1. Child projects are standalone - parent is reference material only
2. Templates include ALL required fields with explicit placeholders
3. Tools use flexible extraction patterns (case-insensitive, multiple formats)
4. Automation requires explicit consent but then runs silently

**Implications:**
- Updated ASB's CLAUDE.md with `Deployment Level: Standard`
- Fixed cxms-report.mjs regex for version extraction
- E18 implemented for consent-based auto-telemetry
- Parent reference section reworded as "optional for learning"

**Revisit If:**
- Multi-agent orchestration (E12) is implemented
- More child projects reveal additional edge cases

**Related:** E16, E17, E18, E12

---

### DEC-006: Log Aging - Skip ZIP Stage
**Date:** 2026-01-21
**Status:** Active
**Category:** Architecture

**Context:**
User proposed log aging with eventual ZIP archival. Needed to decide on archival approach.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Two-stage (Aging → ZIP) | Space efficient, clear lifecycle | ZIP not AI-readable, adds complexity |
| Single-stage (Aging only) | AI-readable, simpler | Less space efficient |
| Git-based archive | Already have git, no extra files | Less visible, requires git commands |

**Decision:**
Use aging markdown files, skip ZIP compression, use git for deep archive.

**Rationale:**
- 90% of value with minimal complexity
- AI can always read aging files without extraction
- Git provides infinite archive automatically
- Simplicity over completeness

**Implications:**
- Aging files stay as markdown forever (or until manually deleted)
- Git history serves as long-term archive
- May need to revisit if storage becomes issue (unlikely)

**Revisit If:**
- Storage costs become significant
- AI tools gain native ZIP reading

**Related:** E11, ACT-006

---

### DEC-005: Rename Performance_Review to Performance_Log
**Date:** 2026-01-21
**Status:** Active
**Category:** Naming Convention

**Context:**
Performance_Review template didn't match naming pattern of other log files (Activity_Log, Decision_Log, Issue_Log).

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Keep Performance_Review | No changes needed | Inconsistent naming |
| Rename to Performance_Log | Consistent with other logs | Requires updates across files |

**Decision:**
Rename to Performance_Log for consistency.

**Rationale:**
- Consistency aids discoverability and understanding
- All log files should follow same naming pattern
- Minor effort to update references

**Implications:**
- 8 files needed reference updates
- Template version bumped to 1.1

**Related:** ACT-007

---

### DEC-004: Context Value > Token Cost
**Date:** 2026-01-20
**Status:** Active
**Category:** Principle

**Context:**
During E9 implementation, discussion about file size guidelines raised concern about over-aggressive pruning.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Hard file size limits | Predictable token usage | May lose valuable context |
| Soft guidelines + principle | Preserves useful context | Less predictable token usage |

**Decision:**
Establish "Context Value > Token Cost" as core principle. Guidelines are soft targets, not hard limits.

**Rationale:**
- The purpose of CxMS is context preservation
- Losing useful context defeats the purpose
- Token costs are acceptable if context is valuable
- Trust users to judge what's valuable

**Implications:**
- File size metrics are advisory only
- Users should prune redundant/stale content, not useful context
- Larger files acceptable if detail is justified

**Revisit If:**
- Token costs become prohibitive
- Better compression techniques available

**Related:** E9, E6

---

### DEC-003: 5 Core Files + Optional Logs Architecture
**Date:** 2026-01-20
**Status:** Active
**Category:** Architecture

**Context:**
Needed to balance completeness with simplicity. Original theoretical docs had too many files.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Single monolithic file | Simple | Hard to maintain, grows unbounded |
| 15+ specialized files | Comprehensive | Overwhelming, high overhead |
| 5 core + optional logs | Balanced | Some initial setup |

**Decision:**
5 required core files + optional log files as needed.

**Rationale:**
- Core 5 covers essential needs (overview, context, session, tasks, history)
- Optional logs add value for specific use cases
- Users can start minimal and add as needed
- Proven in LPR LandTools implementation

**Implications:**
- New projects need minimum 5 files
- Optional files are truly optional
- Template library provides all options

**Related:** v1.0 release

---

### DEC-002: AI-Agnostic Naming
**Date:** 2026-01-20
**Status:** Active
**Category:** Branding

**Context:**
Originally called "Claude Context Management System". GitHub user asked about Copilot compatibility.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Keep Claude-specific | Clear for Claude users | Limits adoption |
| Rename to AI-agnostic | Broader appeal | May lose Claude identity |

**Decision:**
Rename to "Agent Context Management System" (CxMS). Works with any AI assistant.

**Rationale:**
- Core concept is AI-agnostic (documentation as external memory)
- Broader adoption benefits everyone
- Keep CLAUDE.md filename (it's a convention now)

**Implications:**
- README updated with compatibility section
- Marketing is AI-agnostic
- Still reference Claude Code in examples

**Related:** ACT-003

---

### DEC-001: Markdown Over Structured Data
**Date:** 2026-01-20
**Status:** Active
**Category:** Technology

**Context:**
Choosing format for context files. Options included JSON, YAML, or Markdown.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| JSON | Structured, parseable | Hard for humans to read/edit |
| YAML | Readable, structured | Still needs tooling |
| Markdown | Human readable, AI readable | Less structured |

**Decision:**
Use Markdown for all context files.

**Rationale:**
- AI assistants read markdown naturally
- Humans can read/edit without tools
- GitHub renders it nicely
- Tables provide enough structure
- No special tooling needed

**Implications:**
- All templates are markdown
- Structure enforced by convention, not schema
- Easy to adopt

**Revisit If:**
- Need programmatic parsing
- AI tools gain better JSON support

---

## Decisions by Category

### Architecture Decisions
| ID | Decision | Date | Status |
|----|----------|------|--------|
| DEC-007 | Child Project Independence | 2026-01-25 | Active |
| DEC-006 | Skip ZIP in log aging | 2026-01-21 | Active |
| DEC-003 | 5 core + optional logs | 2026-01-20 | Active |

### Technology Decisions
| ID | Decision | Date | Status |
|----|----------|------|--------|
| DEC-001 | Markdown over structured data | 2026-01-20 | Active |

### Naming/Branding Decisions
| ID | Decision | Date | Status |
|----|----------|------|--------|
| DEC-005 | Performance_Log naming | 2026-01-21 | Active |
| DEC-002 | AI-agnostic naming | 2026-01-20 | Active |

### Principle Decisions
| ID | Decision | Date | Status |
|----|----------|------|--------|
| DEC-004 | Context Value > Token Cost | 2026-01-20 | Active |

---

## Notes

- Decision log created 2026-01-21 with retroactive entries
- Future decisions should be logged at time of decision
