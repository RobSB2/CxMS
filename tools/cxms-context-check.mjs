#!/usr/bin/env node
/**
 * CxMS Context Check + Breadcrumb Tracker + Checkpoint Enforcer (v3.1)
 *
 * PostToolUse hook that does THREE things:
 *
 *   1. CONTEXT MONITORING — Outputs warnings at threshold crossings
 *   2. BREADCRUMB TRACKING — Records tool calls with edit summaries
 *   3. CHECKPOINT ENFORCEMENT — Every N tool calls, outputs a MANDATORY
 *      checkpoint reminder that forces the agent to write detailed session
 *      state to Session.md. This is STRUCTURAL enforcement, not a directive.
 *
 * Why checkpoint enforcement matters:
 *   Directives in CLAUDE.md telling the agent to "write checkpoints at 75%"
 *   are ignored. By injecting a mandatory checkpoint message via stdout,
 *   the agent receives it as a system message in the conversation and
 *   must act on it. This is the difference between asking and telling.
 *
 * Input (stdin): JSON from Claude Code PostToolUse event:
 *   { "tool_name": "Write", "tool_input": { "file_path": "...", ... } }
 *
 * Output (stdout): Context warnings + checkpoint reminders (injected into conversation)
 *
 * Files written:
 *   .claude/context-check-state.json — Threshold + checkpoint state
 *   .claude/session-breadcrumbs.json — Rolling breadcrumb trail with edit summaries
 *
 * Version: 3.1.0 — Added guards for inflated ctx% after compaction
 */

import fs from 'fs';
import path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const CONTEXT_STATUS_FILE = path.join(CLAUDE_DIR, 'context-status.json');
const CHECK_STATE_FILE = path.join(CLAUDE_DIR, 'context-check-state.json');
const BREADCRUMBS_FILE = path.join(CLAUDE_DIR, 'session-breadcrumbs.json');

const MAX_RECENT_OPS = 40;
const MAX_FILES_TRACKED = 50;
const MAX_SUMMARY_LENGTH = 200;

// How often to force a detailed checkpoint (in tool calls)
const CHECKPOINT_INTERVAL = 30;

// Context thresholds — only warn once per crossing
const THRESHOLDS = [
  { pct: 83, level: 'EMERGENCY', message: 'EMERGENCY: Context at {pct}%. Compaction imminent. Save session state NOW.' },
  { pct: 80, level: 'STOP', message: 'STOP: Context at {pct}%. 5% buffer. Full session save needed. Do NOT continue until user confirms.' },
  { pct: 75, level: 'CHECKPOINT', message: 'CHECKPOINT: Context at {pct}%. 10% buffer. Write checkpoint to Session.md immediately.' },
  { pct: 65, level: 'WARN', message: 'Context at {pct}%. 20% buffer remains before auto-compaction at 85%.' },
];

// ============================================
// BREADCRUMB UTILITIES
// ============================================

function extractFilePath(toolName, toolInput) {
  if (!toolInput) return null;
  if (toolInput.file_path) return toolInput.file_path;
  if (toolInput.notebook_path) return toolInput.notebook_path;
  if (toolInput.path) return toolInput.path;
  if (toolInput.pattern && toolName === 'Glob') return `glob:${toolInput.pattern}`;
  if (toolInput.pattern && toolName === 'Grep') return `grep:${toolInput.pattern}`;
  if (toolInput.command) return `bash:${toolInput.command.substring(0, 120)}`;
  if (toolInput.description) return `task:${toolInput.description}`;
  return null;
}

function toRelative(filePath) {
  if (!filePath) return null;
  if (/^(bash|task|glob|grep):/.test(filePath)) return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  const projNormalized = PROJECT_DIR.replace(/\\/g, '/');
  if (normalized.startsWith(projNormalized)) {
    return normalized.substring(projNormalized.length).replace(/^\//, '');
  }
  return filePath;
}

function classifyTool(toolName) {
  if (['Write', 'Edit', 'NotebookEdit'].includes(toolName)) return 'write';
  if (['Read', 'Glob', 'Grep'].includes(toolName)) return 'read';
  if (toolName === 'Bash') return 'bash';
  if (toolName === 'Task') return 'task';
  return 'other';
}

function getWorkDomain(relPath) {
  if (!relPath) return null;
  if (/^(bash|task|glob|grep):/.test(relPath)) return null;
  const dir = path.dirname(relPath).replace(/\\/g, '/');
  return dir === '.' ? '(root)' : dir;
}

/**
 * Extract a meaningful summary of WHAT changed from tool input.
 * This is the difference between "Edit -> file.md" and
 * "Edit -> file.md: Added cross-vendor consensus section with 7 claims"
 */
function extractEditSummary(toolName, toolInput) {
  if (!toolInput) return null;

  try {
    if (toolName === 'Edit') {
      // For Edit, capture the new_string (what was written)
      const newStr = toolInput.new_string || '';
      if (!newStr) return null;

      // Look for meaningful content: headings, key phrases, first substantial line
      const lines = newStr.split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) return null;

      // If it starts with a markdown heading, use that
      const heading = lines.find(l => /^#{1,4}\s/.test(l));
      if (heading) {
        return heading.trim().substring(0, MAX_SUMMARY_LENGTH);
      }

      // If it's a short edit (< 3 lines), capture the whole thing
      if (lines.length <= 3) {
        return lines.join(' | ').substring(0, MAX_SUMMARY_LENGTH);
      }

      // Otherwise, first line + line count
      return `${lines[0].trim().substring(0, 150)} (+${lines.length} lines)`;
    }

    if (toolName === 'Write') {
      // For Write, capture the document title/purpose from first meaningful lines
      const content = toolInput.content || '';
      if (!content) return null;

      const lines = content.split('\n');
      const summary = [];

      for (const line of lines.slice(0, 10)) {
        const trimmed = line.trim();
        // Capture headings
        if (/^#{1,3}\s/.test(trimmed)) {
          summary.push(trimmed);
          if (summary.length >= 2) break;
        }
        // Capture JSDoc/comment purpose lines
        if (/^\*\s/.test(trimmed) && trimmed.length > 10 && summary.length === 0) {
          summary.push(trimmed);
        }
        // Capture XML/SVG titles
        if (/<title>/.test(trimmed) || /font-weight="bold"/.test(trimmed)) {
          const textMatch = trimmed.match(/>([^<]+)</);
          if (textMatch) summary.push(textMatch[1].trim());
        }
      }

      if (summary.length > 0) {
        const totalLines = lines.length;
        return `${summary.join(' | ')} (${totalLines} lines total)`.substring(0, MAX_SUMMARY_LENGTH);
      }

      // Fallback: file type + size
      return `${lines.length} lines written`;
    }

    if (toolName === 'Task') {
      // For Task (subagent), capture the description and subagent type
      const desc = toolInput.description || '';
      const type = toolInput.subagent_type || '';
      if (desc) return `[${type}] ${desc}`.substring(0, MAX_SUMMARY_LENGTH);
    }

    if (toolName === 'Bash') {
      const cmd = toolInput.command || '';
      const desc = toolInput.description || '';
      // Prefer description over raw command
      if (desc) return desc.substring(0, MAX_SUMMARY_LENGTH);
      return cmd.substring(0, MAX_SUMMARY_LENGTH);
    }
  } catch {
    return null;
  }

  return null;
}

// ============================================
// BREADCRUMB TRACKING
// ============================================

function updateBreadcrumbs(toolName, toolInput) {
  const rawPath = extractFilePath(toolName, toolInput);
  const relPath = toRelative(rawPath);
  const toolType = classifyTool(toolName);
  const domain = getWorkDomain(relPath);
  const summary = extractEditSummary(toolName, toolInput);
  const now = new Date().toISOString();

  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  let crumbs = {
    session_start: now,
    last_updated: now,
    tool_count: 0,
    last_checkpoint_at: 0,
    files_modified: [],
    files_read: [],
    work_domains: [],
    recent_operations: [],
  };

  try {
    if (fs.existsSync(BREADCRUMBS_FILE)) {
      const raw = fs.readFileSync(BREADCRUMBS_FILE, 'utf-8');
      crumbs = JSON.parse(raw);
    }
  } catch { /* start fresh */ }

  crumbs.last_updated = now;
  crumbs.tool_count = (crumbs.tool_count || 0) + 1;

  // Ensure arrays exist
  crumbs.files_modified = crumbs.files_modified || [];
  crumbs.files_read = crumbs.files_read || [];
  crumbs.work_domains = crumbs.work_domains || [];
  crumbs.recent_operations = crumbs.recent_operations || [];

  // Track file paths by type
  if (relPath && !/^(bash|task|glob|grep):/.test(relPath)) {
    if (toolType === 'write') {
      if (!crumbs.files_modified.includes(relPath)) {
        crumbs.files_modified.push(relPath);
        if (crumbs.files_modified.length > MAX_FILES_TRACKED) {
          crumbs.files_modified = crumbs.files_modified.slice(-MAX_FILES_TRACKED);
        }
      }
    } else if (toolType === 'read') {
      if (!crumbs.files_read.includes(relPath)) {
        crumbs.files_read.push(relPath);
        if (crumbs.files_read.length > MAX_FILES_TRACKED) {
          crumbs.files_read = crumbs.files_read.slice(-MAX_FILES_TRACKED);
        }
      }
    }
  }

  if (domain && !crumbs.work_domains.includes(domain)) {
    crumbs.work_domains.push(domain);
  }

  // Build operation entry WITH summary
  const op = { ts: now, tool: toolName, type: toolType };
  if (relPath) op.path = relPath;
  if (summary) op.summary = summary;
  crumbs.recent_operations.push(op);
  if (crumbs.recent_operations.length > MAX_RECENT_OPS) {
    crumbs.recent_operations = crumbs.recent_operations.slice(-MAX_RECENT_OPS);
  }

  try {
    fs.writeFileSync(BREADCRUMBS_FILE, JSON.stringify(crumbs, null, 2), 'utf-8');
  } catch { /* best-effort */ }

  return crumbs;
}

// ============================================
// CHECKPOINT ENFORCEMENT
// ============================================

/**
 * Check if it's time for a mandatory checkpoint and output the reminder.
 * Returns true if a checkpoint was triggered.
 */
function checkCheckpointDue(crumbs) {
  const toolCount = crumbs.tool_count || 0;
  const lastCheckpoint = crumbs.last_checkpoint_at || 0;
  const sinceLast = toolCount - lastCheckpoint;

  if (sinceLast < CHECKPOINT_INTERVAL) return false;

  // Build a summary of what happened since last checkpoint
  const recentWrites = crumbs.recent_operations
    .filter(op => op.type === 'write' && op.summary)
    .slice(-8);

  const recentTasks = crumbs.recent_operations
    .filter(op => op.type === 'task' && op.summary)
    .slice(-4);

  let activityHint = '';
  if (recentWrites.length > 0 || recentTasks.length > 0) {
    const hints = [];
    for (const op of [...recentWrites, ...recentTasks]) {
      const pathShort = op.path ? path.basename(op.path) : '';
      const desc = op.summary || pathShort;
      if (desc) hints.push(`  - ${op.tool} ${pathShort}: ${op.summary || ''}`);
    }
    if (hints.length > 0) {
      activityHint = `\n[CxMS] Recent activity to document:\n${hints.join('\n')}`;
    }
  }

  const modifiedFiles = (crumbs.files_modified || []).slice(-10);
  let fileHint = '';
  if (modifiedFiles.length > 0) {
    fileHint = `\n[CxMS] Files modified: ${modifiedFiles.join(', ')}`;
  }

  // NOTE: Customize the session file name below to match your project.
  // CxMS convention: PROJECT_Session.md (e.g., MyApp_Session.md)
  const sessionFile = 'PROJECT_Session.md';

  console.log(`[CxMS] ═══════════════════════════════════════════════════════════`);
  console.log(`[CxMS] MANDATORY CHECKPOINT — ${sinceLast} tool calls since last save.`);
  console.log(`[CxMS] Write a DETAILED checkpoint to ${sessionFile} NOW.`);
  console.log(`[CxMS]`);
  console.log(`[CxMS] Your checkpoint MUST include:`);
  console.log(`[CxMS]   1. WHAT you accomplished (specific deliverables, not vague summaries)`);
  console.log(`[CxMS]   2. KEY DECISIONS made and WHY`);
  console.log(`[CxMS]   3. FILES created/modified with descriptions of what changed`);
  console.log(`[CxMS]   4. CURRENT TASK and exact next steps`);
  console.log(`[CxMS]   5. RESUME PROMPT — what to tell the next session to continue`);
  if (activityHint) console.log(activityHint);
  if (fileHint) console.log(fileHint);
  console.log(`[CxMS]`);
  console.log(`[CxMS] This is NOT optional. Session state WILL BE LOST at compaction without it.`);
  console.log(`[CxMS] ═══════════════════════════════════════════════════════════`);

  // Update the checkpoint marker so we don't trigger again until next interval
  crumbs.last_checkpoint_at = toolCount;
  try {
    fs.writeFileSync(BREADCRUMBS_FILE, JSON.stringify(crumbs, null, 2), 'utf-8');
  } catch { /* best-effort */ }

  return true;
}

// ============================================
// CONTEXT MONITORING
// ============================================

function checkContextThresholds() {
  let contextStatus = {};
  try {
    if (fs.existsSync(CONTEXT_STATUS_FILE)) {
      let raw = fs.readFileSync(CONTEXT_STATUS_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      contextStatus = JSON.parse(raw);
    } else {
      return;
    }
  } catch {
    return;
  }

  const ctxPct = contextStatus.ctx_pct;
  if (ctxPct == null) return;

  // Guard: if ctx_pct > 100, it's garbage data from cumulative token counting.
  // Skip threshold warnings entirely — they'd fire false EMERGENCYs.
  if (ctxPct > 100) return;

  // Guard: if the statusline flagged this reading as unreliable, skip warnings.
  if (contextStatus.reliable === false) return;

  let checkState = { lastWarnLevel: null, lastCtxPct: 0, checkCount: 0 };
  try {
    if (fs.existsSync(CHECK_STATE_FILE)) {
      checkState = JSON.parse(fs.readFileSync(CHECK_STATE_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }

  checkState.checkCount = (checkState.checkCount || 0) + 1;

  // Detect compaction: if previous reading was high and current dropped significantly,
  // reset warning state so thresholds can re-trigger cleanly in the new context.
  const prevPct = checkState.lastCtxPct || 0;
  if (prevPct >= 60 && (prevPct - ctxPct) >= 25) {
    // Compaction detected — reset warning state
    checkState.lastWarnLevel = null;
  }

  checkState.lastCtxPct = ctxPct;

  let activeThreshold = null;
  for (const t of THRESHOLDS) {
    if (ctxPct >= t.pct) {
      activeThreshold = t;
      break;
    }
  }

  if (activeThreshold && activeThreshold.level !== checkState.lastWarnLevel) {
    const msg = activeThreshold.message.replace('{pct}', ctxPct);
    console.log(`[CxMS] ${msg}`);
    checkState.lastWarnLevel = activeThreshold.level;
  } else if (!activeThreshold && checkState.lastWarnLevel) {
    checkState.lastWarnLevel = null;
  }

  try {
    fs.writeFileSync(CHECK_STATE_FILE, JSON.stringify(checkState, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

// ============================================
// MAIN
// ============================================

async function main() {
  let hookInput = {};
  try {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf-8').trim();
    if (raw) hookInput = JSON.parse(raw);
  } catch { /* ignore */ }

  const toolName = hookInput.tool_name || 'unknown';
  const toolInput = hookInput.tool_input || {};

  // 1. Track breadcrumbs with edit summaries
  let crumbs = null;
  try {
    crumbs = updateBreadcrumbs(toolName, toolInput);
  } catch { /* best-effort */ }

  // 2. Check if mandatory checkpoint is due
  if (crumbs) {
    try {
      checkCheckpointDue(crumbs);
    } catch { /* best-effort */ }
  }

  // 3. Check context thresholds
  try {
    checkContextThresholds();
  } catch { /* never crash */ }
}

main().catch(() => {
  process.exit(0);
});
