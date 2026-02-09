#!/usr/bin/env node
/**
 * CxMS Context Check + Breadcrumb Tracker + Checkpoint Enforcer (v6.0)
 *
 * PostToolUse hook that does THREE things:
 *
 *   1. CONTEXT MONITORING -- Outputs warnings at threshold crossings
 *   2. BREADCRUMB TRACKING -- Records tool calls with edit summaries
 *   3. CHECKPOINT ENFORCEMENT -- Every N tool calls, outputs a MANDATORY
 *      checkpoint reminder that forces the agent to write detailed session
 *      state to Session.md. This is STRUCTURAL enforcement, not a directive.
 *
 * Matcher: ^(Write|Edit|Bash|NotebookEdit)$ -- only fires for write/bash tools.
 * Read, Glob, Grep, AskUserQuestion, Task etc. are never intercepted.
 * This means ZERO spawns during startup (all startup actions are Reads).
 *
 * CRITICAL NOTE (v4.0+):
 *   PostToolUse console.log() is ONLY shown in verbose mode (Ctrl+O).
 *   To communicate with the model, we output JSON with additionalContext.
 *
 * Input (stdin): JSON from Claude Code PostToolUse event
 * Output (stdout): JSON with additionalContext for model-visible warnings
 * Output (stderr): Same warnings for terminal verbose mode
 *
 * Files written:
 *   .claude/context-check-state.json -- Threshold + checkpoint state
 *   .claude/session-breadcrumbs.json -- Rolling breadcrumb trail with edit summaries
 *
 * Version: 6.0.0 -- Removed startup completion detection (handled by SessionStart
 *   instructions). Matcher limits spawns to write/bash tools only.
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

// Context thresholds -- only warn once per crossing
// 80%+ is handled by PreToolUse gate (cxms-context-warn.mjs) which blocks tools.
// PostToolUse only needs to warn at levels BELOW the gate threshold.
const THRESHOLDS = [
  { pct: 75, level: 'CHECKPOINT', message: 'CHECKPOINT: Context at {pct}%. 10% buffer. Write checkpoint to Session.md immediately.' },
  { pct: 65, level: 'WARN', message: 'Context at {pct}%. 20% buffer remains before auto-compaction at 85%.' },
];

// ============================================
// MODEL MESSAGE COLLECTOR
// ============================================

const modelMessages = [];

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
 */
function extractEditSummary(toolName, toolInput) {
  if (!toolInput) return null;

  try {
    if (toolName === 'Edit') {
      const newStr = toolInput.new_string || '';
      if (!newStr) return null;

      const lines = newStr.split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) return null;

      const heading = lines.find(l => /^#{1,4}\s/.test(l));
      if (heading) {
        return heading.trim().substring(0, MAX_SUMMARY_LENGTH);
      }

      if (lines.length <= 3) {
        return lines.join(' | ').substring(0, MAX_SUMMARY_LENGTH);
      }

      return `${lines[0].trim().substring(0, 150)} (+${lines.length} lines)`;
    }

    if (toolName === 'Write') {
      const content = toolInput.content || '';
      if (!content) return null;

      const lines = content.split('\n');
      const summary = [];

      for (const line of lines.slice(0, 10)) {
        const trimmed = line.trim();
        if (/^#{1,3}\s/.test(trimmed)) {
          summary.push(trimmed);
          if (summary.length >= 2) break;
        }
        if (/^\*\s/.test(trimmed) && trimmed.length > 10 && summary.length === 0) {
          summary.push(trimmed);
        }
        if (/<title>/.test(trimmed) || /font-weight="bold"/.test(trimmed)) {
          const textMatch = trimmed.match(/>([^<]+)</);
          if (textMatch) summary.push(textMatch[1].trim());
        }
      }

      if (summary.length > 0) {
        const totalLines = lines.length;
        return `${summary.join(' | ')} (${totalLines} lines total)`.substring(0, MAX_SUMMARY_LENGTH);
      }

      return `${lines.length} lines written`;
    }

    if (toolName === 'Task') {
      const desc = toolInput.description || '';
      const type = toolInput.subagent_type || '';
      if (desc) return `[${type}] ${desc}`.substring(0, MAX_SUMMARY_LENGTH);
    }

    if (toolName === 'Bash') {
      const cmd = toolInput.command || '';
      const desc = toolInput.description || '';
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

function checkCheckpointDue(crumbs) {
  const toolCount = crumbs.tool_count || 0;
  const lastCheckpoint = crumbs.last_checkpoint_at || 0;
  const sinceLast = toolCount - lastCheckpoint;

  if (sinceLast < CHECKPOINT_INTERVAL) return false;

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
      if (op.summary || pathShort) hints.push(`  - ${op.tool} ${pathShort}: ${op.summary || ''}`);
    }
    if (hints.length > 0) {
      activityHint = '\nRecent activity to document:\n' + hints.join('\n');
    }
  }

  const modifiedFiles = (crumbs.files_modified || []).slice(-10);
  let fileHint = '';
  if (modifiedFiles.length > 0) {
    fileHint = '\nFiles modified: ' + modifiedFiles.join(', ');
  }

  modelMessages.push(
    '[CxMS] MANDATORY CHECKPOINT -- ' + sinceLast + ' tool calls since last save.',
    '[CxMS] Write a DETAILED checkpoint to your project Session file NOW.',
    '[CxMS] Include: (1) accomplishments, (2) key decisions, (3) files modified, (4) current task, (5) resume prompt.'
  );
  if (activityHint) modelMessages.push('[CxMS]' + activityHint);
  if (fileHint) modelMessages.push('[CxMS]' + fileHint);
  modelMessages.push('[CxMS] This is NOT optional. Session state WILL BE LOST at compaction without it.');

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
  if (ctxPct > 100) return;
  if (contextStatus.reliable === false) return;

  let checkState = { lastWarnLevel: null, lastCtxPct: 0, checkCount: 0 };
  try {
    if (fs.existsSync(CHECK_STATE_FILE)) {
      checkState = JSON.parse(fs.readFileSync(CHECK_STATE_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }

  checkState.checkCount = (checkState.checkCount || 0) + 1;

  // Detect compaction
  const prevPct = checkState.lastCtxPct || 0;
  if (prevPct >= 60 && (prevPct - ctxPct) >= 25) {
    checkState.lastWarnLevel = null;
    modelMessages.push(
      '[CxMS] COMPACTION DETECTED -- Context dropped from ' + prevPct + '% to ' + ctxPct + '%.',
      '[CxMS] Session state may have been lost. Read .claude/compaction-recovery.md to restore context.',
      '[CxMS] Then write a checkpoint to your project Session file confirming recovery.'
    );
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
    modelMessages.push('[CxMS] ' + msg);
    checkState.lastWarnLevel = activeThreshold.level;
  } else if (!activeThreshold && checkState.lastWarnLevel) {
    checkState.lastWarnLevel = null;
  }

  try {
    fs.writeFileSync(CHECK_STATE_FILE, JSON.stringify(checkState, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

// ============================================
// STDIN HELPER (with timeout for Windows pipe issues)
// ============================================

function readStdinFast(timeoutMs = 100) {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;
    const done = (result) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };
    const timer = setTimeout(() => done(data), timeoutMs);
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => {
      data += chunk;
      clearTimeout(timer);
      done(data);
    });
    process.stdin.on('end', () => { clearTimeout(timer); done(data); });
    process.stdin.on('error', () => { clearTimeout(timer); done(''); });
    process.stdin.resume();
  });
}

// ============================================
// OUTPUT HELPER
// ============================================

function outputModelMessages() {
  if (modelMessages.length > 0) {
    const filtered = modelMessages.filter(m => m && m.length > 0);
    if (filtered.length > 0) {
      const context = filtered.join('\n');
      process.stderr.write(context + '\n');
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: context
        }
      };
      process.stdout.write(JSON.stringify(output) + '\n');
    }
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  // Parse stdin (with timeout to prevent Windows pipe hanging)
  let hookInput = {};
  try {
    const raw = await readStdinFast(100);
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

  // 4. Output any accumulated model messages
  outputModelMessages();
}

main().catch(() => {
  // noop - don't crash
}).finally(() => {
  process.exit(0);
});
