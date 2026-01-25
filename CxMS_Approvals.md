# CxMS - Pre-Approved Operations

**CxMS Version:** 1.5
**Template Version:** 1.0
**Purpose:** Reduce permission prompts by documenting standing approvals
**Last Updated:** 2026-01-25

---

## Standing Approvals

### Git Operations
| Operation | Approved | Notes |
|-----------|----------|-------|
| Commit with co-author tag | Yes | Standard commits |
| Push to origin/main | Yes | After user reviews |
| Create feature branches | Yes | |
| Git status/diff/log | Yes | Read-only, always OK |

### File Operations
| Operation | Approved | Scope |
|-----------|----------|-------|
| Read any project file | Yes | Entire project |
| Create new files | Yes | templates/, tools/, case-studies/ |
| Edit existing files | Yes | Within project directory |
| Delete files | ASK | Always confirm deletions |

### Bash Commands
| Command Pattern | Approved | Notes |
|-----------------|----------|-------|
| git (read-only) | Yes | status, diff, log, branch |
| git commit | Yes | With co-author |
| git push | Yes | origin/main |
| gh (GitHub CLI) | Yes | Issues, PRs, API calls |
| Directory listing | Yes | ls, dir |
| node/npm | Yes | For tools/ scripts |

### Destructive Operations (Always Ask)
| Operation | Policy |
|-----------|--------|
| git push --force | ALWAYS ASK |
| git reset --hard | ALWAYS ASK |
| rm -rf / delete directories | ALWAYS ASK |
| Deleting templates | ALWAYS ASK |

### Tool Usage
| Tool | Approved | Scope |
|------|----------|-------|
| Read | Yes | Any project file |
| Edit | Yes | Project files |
| Write | Yes | New files in approved directories |
| Glob/Grep | Yes | Code search |
| WebFetch | Yes | Documentation, GitHub raw files |
| WebSearch | Yes | Technical queries |
| Bash | Conditional | See command patterns above |

---

## CxMS-Specific Approvals

| Operation | Approved | Notes |
|-----------|----------|-------|
| Update templates | Yes | templates/ |
| Update VERSIONS.md | Yes | Version tracking |
| Update roadmap | Yes | CxMS_Product_Roadmap.md |
| Update session/tasks | Yes | CxMS_Session.md, CxMS_Tasks.md |
| Create case studies | Yes | case-studies/ |
| Run telemetry tools | Yes | tools/ |

---

## Revoked Approvals

| Operation | Revoked Date | Reason |
|-----------|--------------|--------|
| (none) | | |

---

## Notes

- Read this file at session start
- Do not prompt for listed operations
- When in doubt, check this file before prompting

## Session Permission Capture

**When user grants a new permission during a session:**
1. Complete the approved action
2. Add the permission to the appropriate table above
3. Note the date in the Notes column

This ensures permissions accumulate and don't need to be re-granted.
