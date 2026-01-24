# CxMS - Prompt Library

**Template Version:** 1.0
**Purpose:** Curated prompt engineering reference and training resource
**Last Updated:** 2026-01-24

---

## Overview

This library captures **significant prompts** from CxMS development sessions with analysis and improvement suggestions. Use this as a prompt engineering training resource.

---

## Library Entries

### Entry 001: Session Initialization

**Date:** 2026-01-24
**Category:** INIT
**Context:** Starting a new session, need to restore context

#### Original Prompt
```
Read CLAUDE.md and CxMS_Session.md, summarize current state, await instructions.
```

#### Improved Prompt
```
Read CLAUDE.md and CxMS_Session.md.
Summarize:
1. Current project state (version, key stats)
2. Last session accomplishments
3. Suggested next actions
Then await instructions.
```

#### Improvement Analysis

| Aspect | Original | Improved | Why |
|--------|----------|----------|-----|
| Clarity | Good | Better | Explicit structure for summary |
| Specificity | Medium | High | Numbered expectations |
| Context | Implicit | Same | Files provide context |
| Constraints | None | Minimal | Adds structure |
| Output Format | Implicit | Explicit | Specifies 3-part summary |

#### Key Improvements
1. **Structured output:** Numbered list tells AI exactly what to include
2. **Explicit expectations:** "await instructions" is clear in both, but improved version sets up the summary format

#### Outcome
- **Original result:** Works well - AI provides good summary
- **Would improved version help:** Marginally - original is already effective for this use case

#### Tags
`#init` `#session-start` `#context-loading`

---

### Entry 002: Research Before Decision

**Date:** 2026-01-24
**Category:** RESEARCH
**Context:** Needed to understand how other AI tools handle configuration files before designing multi-tool support

#### Original Prompt
```
We should also think about adding a template for other CLIs like Gemini CLI, Copilot, Replit, ChatGPT, etc. Search to find out what process they use for session start up and offer those files as deployment options
```

#### Improved Prompt
```
Research configuration file patterns for AI coding assistants:
- Gemini CLI
- GitHub Copilot
- Cursor
- Aider
- Replit
- ChatGPT

For each, identify:
1. Config file name and location
2. File format (MD, JSON, YAML, etc.)
3. How it's loaded (auto vs manual)

Summarize findings in a comparison table.
Then recommend which tools CxMS should support first.
```

#### Improvement Analysis

| Aspect | Original | Improved | Why |
|--------|----------|----------|-----|
| Clarity | Good | Better | Explicit list of tools |
| Specificity | Low | High | Specifies what info to gather |
| Context | Implicit | Same | Purpose understood from conversation |
| Constraints | None | Some | Comparison table format |
| Output Format | None | Explicit | Table + recommendation |

#### Key Improvements
1. **Enumerated targets:** Lists specific tools to research
2. **Data points specified:** "file name, location, format, loading" - tells AI exactly what to capture
3. **Output format:** Requests comparison table for easy analysis
4. **Action item:** Ends with recommendation request

#### Outcome
- **Original result:** AI understood intent, provided good research
- **Would improved version help:** Yes - would get more structured, comparable data

#### Tags
`#research` `#multi-tool` `#comparison`

---

### Entry 003: Concise Direction

**Date:** 2026-01-24
**Category:** TASK
**Context:** After AI presented options A, B, C for capturing ideas

#### Original Prompt
```
b
```

#### Improved Prompt
```
b
```

#### Improvement Analysis

| Aspect | Original | Improved | Why |
|--------|----------|----------|-----|
| Clarity | Perfect | N/A | Context made meaning clear |
| Specificity | Perfect | N/A | Single-letter selection is unambiguous |
| Context | From conversation | N/A | AI offered options, user selected |
| Constraints | N/A | N/A | Not applicable |
| Output Format | N/A | N/A | Not applicable |

#### Key Improvements
**None needed.** This demonstrates that effective prompting is contextual. When AI has offered clear options, a single-letter response is optimal. Over-explaining would waste tokens and time.

#### Outcome
- **Original result:** AI immediately executed option B
- **Would improved version help:** No - would add unnecessary overhead

#### Tags
`#efficiency` `#context-aware` `#selection`

---

### Entry 004: Asking the Right Question

**Date:** 2026-01-24
**Category:** RESEARCH
**Context:** After designing CxMS update strategy, needed to validate approach against industry practice

#### Original Prompt
```
Are deployments & updates currently baked together in traditional / non AI software deployment, realease/change management
```

#### Improved Prompt
```
Research traditional software deployment and release management:
1. Are deployment and updates typically handled together or separately?
2. What does ITIL say about deployment vs release management?
3. What patterns do GitOps/DevOps use for updates vs initial deployment?

Looking to validate our decision to separate E14 (deployment) from E15 (updates) in CxMS.
```

#### Improvement Analysis

| Aspect | Original | Improved | Why |
|--------|----------|----------|-----|
| Clarity | Good | Better | More structured questions |
| Specificity | Medium | High | Names specific frameworks (ITIL, GitOps) |
| Context | Implicit | Explicit | States purpose: validate E14/E15 split |
| Constraints | None | Some | Focuses research areas |
| Output Format | None | Implicit | Expects structured answer |

#### Key Improvements
1. **Purpose stated:** Tells AI why you're asking (validation)
2. **Specific frameworks:** ITIL, GitOps - guides research to authoritative sources
3. **Numbered questions:** Ensures all aspects are covered

#### Outcome
- **Original result:** AI understood and provided good research
- **Would improved version help:** Yes - would get more targeted, relevant findings

#### Tags
`#validation` `#research` `#decision-support`

---

### Entry 005: Delegation with Constraints

**Date:** 2026-01-24
**Category:** TASK
**Context:** Needed to formalize raw ideas into an enhancement document

#### Original Prompt
```
Let's formalize then as E14 then
```

#### Improved Prompt
```
Formalize the 5 ideas we captured in IDEAS.local.md as Enhancement 14 in CxMS_Enhancement_Exploration.md.

Follow the existing enhancement format:
- Problem Statement
- Proposed Solution (with subsections)
- Implementation Approach
- Value Proposition
- Related Enhancements

Update the priority table and revision history.
```

#### Improvement Analysis

| Aspect | Original | Improved | Why |
|--------|----------|----------|-----|
| Clarity | Good | Better | Explicit file references |
| Specificity | Low | High | Lists required sections |
| Context | From conversation | Made explicit | Names source (IDEAS.local.md) |
| Constraints | None | Strong | Must follow existing format |
| Output Format | Implicit | Explicit | Lists expected structure |

#### Key Improvements
1. **Source specified:** Points to IDEAS.local.md
2. **Format constrained:** Lists sections to include
3. **Housekeeping included:** Mentions priority table and revision history

#### Outcome
- **Original result:** AI produced correct E14 based on conversation context
- **Would improved version help:** For new AI session, yes - original relied on conversation context

#### Tags
`#formalization` `#documentation` `#format-constrained`

---

### Entry 006: Efficient Session Wrap-up

**Date:** 2026-01-24
**Category:** DEPLOY
**Context:** End of work session, need to commit and push

#### Original Prompt
```
commit and push
```

#### Improved Prompt
```
commit and push
```

#### Improvement Analysis

**None needed.** At session end, after work is complete and reviewed, a brief commit command is appropriate. The AI:
- Knows what files changed (it made the changes)
- Can write an appropriate commit message
- Understands the push target (origin/main)

Over-specifying would be unnecessary overhead.

#### Key Insight
Prompt complexity should match task complexity. Simple, well-understood operations don't need elaborate prompts.

#### Tags
`#efficiency` `#git` `#session-end`

---

### Entry 007: AI-Assisted System Update

**Date:** 2026-01-24
**Category:** META
**Context:** Created MIGRATION.md - needed a prompt that lets users have their AI update CxMS automatically

#### Original Prompt
```
Update my CxMS files to the latest version
```

#### Improved Prompt
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

#### Improvement Analysis

| Aspect | Original | Improved | Why |
|--------|----------|----------|-----|
| Clarity | Low | High | Specifies exactly what to do |
| Specificity | Low | Very High | Numbered steps, file paths |
| Context | None | Full | Version, project name, constraints |
| Safety | Low | High | Explicit "preserve customizations" |
| Output Format | None | Structured | Step-by-step process |

#### Key Improvements
1. **Source specified:** Points to GitHub repo for latest version
2. **Safety constraint:** Explicit instruction to preserve customizations
3. **Step-by-step:** Ensures complete update process
4. **Version context:** Provides current version for comparison

#### Outcome
- Creates a reusable prompt for any CxMS user
- Enables "self-updating" CxMS installations
- Documented in templates/MIGRATION.md for all users

#### Tags
`#meta` `#migration` `#self-updating` `#reusable`

---

## Prompt Patterns Observed in CxMS Development

### Pattern: Ideas → Staging → Formalization
```
[Capture raw idea in IDEAS.local.md]
→ [Discuss and refine]
→ "formalize as E[X]"
```
**When to use:** Complex features that need cooking time

### Pattern: Research-Validate-Decide
```
"Search for [how others do X]"
→ [Review findings]
→ "add to IDEAS" or "formalize as E[X]"
```
**When to use:** When you need industry validation before committing

### Pattern: Efficient Selection
```
[AI presents options A, B, C]
→ "b" or "yes" or "please"
```
**When to use:** When AI has already structured the decision

### Pattern: Batch Operations
```
"Update GitHub docs, commit and push"
```
**When to use:** Multiple related operations that should happen together

---

## Common Improvements for CxMS Work

| Weak Pattern | Strong Pattern | Reasoning |
|--------------|----------------|-----------|
| "fix it" | "fix [specific issue] in [file]" | CxMS has many files |
| "update the docs" | "update README.md to reflect [change]" | Multiple docs to update |
| "add this idea" | "add to IDEAS.local.md under [section]" | IDEAS has multiple sections |
| "make an enhancement" | "formalize as E[X] following existing format" | Ensures consistency |

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Entries | 7 |
| Most Common Category | RESEARCH (2), TASK (2), META (1) |
| Top Improvement Area | Specificity |
| Last Updated | 2026-01-24 |

---

## Key Learnings

### What Works Well
1. **Context-loading prompts:** "Read X and Y, summarize, await instructions" - effective pattern
2. **Single-letter responses:** When AI offers options, brief selection is optimal
3. **Research-before-decision:** Asking about industry practice validates design choices

### Patterns That Work for CxMS
1. Ideas → IDEAS.local.md → Enhancement doc (staged formalization)
2. "Search for X, then add to Y" (research-then-act)
3. Brief commands for well-understood operations

### Areas to Improve
1. **Format specifications:** More often specify expected output structure
2. **Purpose statements:** Include "why" to focus AI research
3. **File references:** Be explicit about which files to read/update
