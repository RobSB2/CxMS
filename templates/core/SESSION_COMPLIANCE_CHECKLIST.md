# Session Compliance Checklist

**CxMS Version:** 1.6
**Purpose:** Ensure agents maintain compliance with persistent directives throughout sessions
**Frequency:** Check every 20 tool calls OR at context thresholds

---

## The Problem This Solves

AI agents read CLAUDE.md at session start but "drift" from directives as sessions progress. This checklist provides:
1. **Periodic self-checks** for agents to verify directive compliance
2. **Explicit triggers** that prompt compliance verification
3. **Quick reference** for critical ongoing requirements

---

## When to Run This Checklist

| Trigger | Action |
|---------|--------|
| Every 20 tool calls | Quick compliance scan |
| Context reaches 50% | Full compliance check |
| Context reaches 65% | Full check + warn user |
| After any large file read (>500 lines) | Context check |
| After extended autonomous work | Full compliance check |
| Before any commit | Permission compliance check |

**Self-monitoring instruction for agents:**
```
Every 20 tool calls, silently verify:
- Am I still following CLAUDE.md directives?
- Have I checked context % recently?
- Am I within approved operation scope?
```

---

## Quick Compliance Scan (30 seconds)

Run this every 20 tool calls:

### 1. Context Status
- [ ] Read `.claude/context-status.json`
- [ ] Note current context %: ____
- [ ] If >65%: Warn user immediately
- [ ] If >75%: Write checkpoint to Session.md NOW

### 2. Scope Check
- [ ] Am I still working on the user's requested task?
- [ ] Have I asked before making architectural decisions?
- [ ] Am I avoiding over-engineering?

### 3. Permission Check
- [ ] Are my actions within approved operations (Approvals.md)?
- [ ] If destructive operation needed: Did I ask first?

---

## Full Compliance Check (Every Major Threshold)

### Context Monitoring Compliance

| Directive | Status | Action if Non-Compliant |
|-----------|--------|------------------------|
| Check context every 10 tool calls | [ ] | Read context-status.json now |
| Warn at 65% | [ ] | If >65%, warn user immediately |
| Auto-checkpoint at 75% | [ ] | Write checkpoint to Session.md |
| STOP at 80% | [ ] | Full save, await confirmation |

**Current Context:** ___% (read from `.claude/context-status.json`)

### Session Protocol Compliance

| Directive | Status | Action if Non-Compliant |
|-----------|--------|------------------------|
| Read CLAUDE.md at start | [ ] | Re-read key sections if unclear |
| Read Approvals.md at start | [ ] | Check before next operation |
| Update Session.md before end | [ ] | Plan for update |
| Update Tasks.md with changes | [ ] | Note pending updates |

### Behavioral Compliance

| Directive | Status | Action if Non-Compliant |
|-----------|--------|------------------------|
| Read files before editing | [ ] | Always Read → Edit, never blind edit |
| Ask before deletions | [ ] | Never auto-delete |
| No force push without asking | [ ] | Always confirm destructive git ops |
| Stay focused on user's task | [ ] | Avoid scope creep |
| Don't over-engineer | [ ] | Minimal changes for current need |

### Communication Compliance

| Directive | Status | Action if Non-Compliant |
|-----------|--------|------------------------|
| Short, concise responses | [ ] | Reduce verbosity |
| No emojis unless requested | [ ] | Remove emojis |
| Use file:line references | [ ] | Add code references |
| Professional objectivity | [ ] | Avoid excessive praise/validation |

---

## Critical Directives Reference

These are the most commonly "forgotten" directives - review when uncertain:

### From CLAUDE.md

```markdown
**Context Monitoring:**
- Check `.claude/context-status.json` every 10 tool calls
- 65% = warn, 75% = checkpoint, 80% = STOP

**File Operations:**
- NEVER edit a file you haven't read
- ALWAYS prefer editing existing files over creating new ones
- Read files before suggesting modifications

**Behavior:**
- Don't add features beyond what was asked
- Don't add error handling for scenarios that can't happen
- Don't create abstractions for one-time operations

**Git Safety:**
- NEVER push --force without explicit request
- NEVER skip hooks unless explicitly requested
- Create NEW commits after hook failures, don't amend
```

### From Approvals.md

Reference your project's `[PROJECT]_Approvals.md` for:
- Standing approvals (operations that don't need asking)
- Always-ask operations (destructive actions)
- Session permission captures

---

## Compliance Failure Recovery

If you realize you've drifted from directives:

### Minor Drift (Behavioral)
1. Note the drift internally
2. Self-correct going forward
3. No need to alert user unless it affected work

### Moderate Drift (Missed Context Threshold)
1. Immediately check context %
2. If >75%, write checkpoint NOW
3. Inform user: "Context at X%. Writing checkpoint."

### Major Drift (Unauthorized Operations)
1. STOP current work
2. Inform user what happened
3. Ask for guidance before continuing

---

## Integration with Startup

Add this to your `CLAUDE.md` or `PROJECT_Startup.md`:

```markdown
## Compliance Protocol

During session:
1. Every 20 tool calls: Quick compliance scan
2. At 50% context: Full compliance check
3. Before commits: Permission verification
4. Before session end: Final compliance + updates

Reference: `templates/core/SESSION_COMPLIANCE_CHECKLIST.md`
```

---

## Compliance Logging (Optional)

For projects tracking agent behavior, log compliance checks:

```markdown
### Compliance Log Entry

**Time:** [timestamp]
**Context:** [X]%
**Check Type:** Quick | Full | Recovery
**Status:** All compliant | Drift corrected | User notified
**Notes:** [any issues or corrections]
```

---

## Why This Matters

**The Fundamental Problem:** AI agents operate with a "recency bias" - instructions read 100 tool calls ago carry less weight than recent context. This causes:

1. **Directive Fade** - Early instructions become less influential over time
2. **Context Drift** - Agent forgets to monitor context % and gets compacted
3. **Scope Creep** - Without periodic checks, agents add unnecessary complexity
4. **Permission Erosion** - Approved vs. ask-first boundaries blur

**The Solution:** Explicit periodic compliance checks act as "directive refresh" - bringing critical instructions back into active consideration.

---

## For Agent Implementation

If you're an AI agent reading this, here's your execution model:

```
EVERY 20 TOOL CALLS:
  1. Read .claude/context-status.json
  2. If ctx_pct > 65: WARN USER
  3. If ctx_pct > 75: WRITE CHECKPOINT
  4. If ctx_pct > 80: STOP, FULL SAVE
  5. Verify you're on-task
  6. Verify operations are approved

AT SESSION END:
  1. Update Session.md
  2. Update Tasks.md
  3. Run telemetry (if consented)
  4. Provide summary
```

---

## Related Documents

- `CLAUDE.md` - Primary directive source
- `SESSION_END_CHECKLIST.md` - Session wrap-up workflow
- `SESSION_START_PROMPTS.md` - Session initialization
- `[PROJECT]_Approvals.md` - Standing permissions

---

> *"Discipline, you must have. Check your directives, you will."*
>
> — Master Yoda, definitely

*CxMS - Maintain compliance, maintain context.*
