#!/usr/bin/env node
/**
 * CxMS Session End Hook
 *
 * Fires when a Claude Code session ends, performing automated cleanup:
 *   1. Reads session metadata from stdin (session_id, reason, transcript_path)
 *   2. Updates Session.local.md with session-end timestamp
 *   3. Runs telemetry submission (cxms-report.mjs --auto --quiet)
 *   4. Logs the session end event to .claude/session-log.json
 *   5. Outputs a summary to stdout
 *
 * Hook Configuration (.claude/settings.json):
 *   {
 *     "hooks": {
 *       "SessionEnd": [{
 *         "hooks": [{
 *           "type": "command",
 *           "command": "node tools/cxms-session-end.mjs",
 *           "timeout": 30,
 *           "statusMessage": "Saving session state..."
 *         }]
 *       }]
 *     }
 *   }
 *
 * Input (stdin): JSON with:
 *   { "session_id", "transcript_path", "cwd", "reason", "hook_event_name" }
 *
 * reason values: "clear", "logout", "prompt_input_exit",
 *                "bypass_permissions_disabled", "other"
 *
 * Output (stdout): Summary message (informational only — cannot block exit)
 *
 * Version: 2.2.0 -- Total Recall v2: Session lifecycle tracking.
 *   - Marks session as "completed" in coordination file active_sessions
 *   - Per-session read_by on messages ({project, session_id, read_at})
 *   - Prunes stale active_sessions (completed >1hr, active >4hr)
 *   - Cleans up per-session state files on exit
 *   - Reads per-session context-status file when session_id available
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { updateMemory } from './cxms-memory-bridge.mjs';

// ============================================
// CONFIGURATION
// ============================================

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const SESSION_LOG_FILE = path.join(CLAUDE_DIR, 'session-log.json');
const CONTEXT_STATUS_FILE = path.join(CLAUDE_DIR, 'context-status.json');

// CxMS Session file patterns (same as pre-compact hook)
const SESSION_FILE_PATTERNS = [
  '*_Session.local.md',
  '*_Session.md',
  'PROJECT_Session.local.md',
];

// ============================================
// UTILITIES
// ============================================

function findFile(patterns) {
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const prefix = pattern.split('*')[0];
      const suffix = pattern.split('*').pop();
      try {
        const files = fs.readdirSync(PROJECT_DIR);
        const match = files.find(f =>
          f.startsWith(prefix) && f.endsWith(suffix)
        );
        if (match) return path.join(PROJECT_DIR, match);
      } catch { /* ignore */ }
    } else {
      const fullPath = path.join(PROJECT_DIR, pattern);
      if (fs.existsSync(fullPath)) return fullPath;
    }
  }
  return null;
}

function readContextStatus(sessionId) {
  // Try per-session file first (v2.0.5+ with session isolation)
  if (sessionId) {
    const perSessionFile = path.join(CLAUDE_DIR, `context-status-${sessionId}.json`);
    try {
      if (fs.existsSync(perSessionFile)) {
        let raw = fs.readFileSync(perSessionFile, 'utf-8');
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        return JSON.parse(raw);
      }
    } catch { /* fall through to legacy */ }
  }
  // Legacy fallback
  try {
    if (fs.existsSync(CONTEXT_STATUS_FILE)) {
      let raw = fs.readFileSync(CONTEXT_STATUS_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return {};
}

function getReasonLabel(reason) {
  const labels = {
    'clear': 'User cleared session (/clear)',
    'logout': 'User logged out',
    'prompt_input_exit': 'User exited (Ctrl+C or /exit)',
    'bypass_permissions_disabled': 'Bypass permissions disabled',
    'other': 'Session ended',
  };
  return labels[reason] || `Session ended (${reason})`;
}

// ============================================
// SESSION.MD UPDATE
// ============================================

function updateSessionFile(sessionFile, hookInput, contextStatus) {
  if (!sessionFile || !fs.existsSync(sessionFile)) return false;

  const content = fs.readFileSync(sessionFile, 'utf-8');
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const ctxPct = contextStatus.ctx_pct || '?';
  const reason = getReasonLabel(hookInput.reason || 'other');

  // Build the session-end marker line
  const endMarker = `**Session ended:** ${timestamp} | Context: ${ctxPct}% | ${reason}`;

  // Strategy: Insert the end marker after the most recent "## Session N Checkpoint" header
  // Look for the first line after the checkpoint header that is a blank line followed by ---
  // or just append after the header block

  const lines = content.split('\n');

  // Idempotency: if a "**Session ended:**" line already exists anywhere, replace it
  const existingIdx = lines.findIndex(l => l.startsWith('**Session ended:**'));
  if (existingIdx >= 0) {
    lines[existingIdx] = endMarker;
    fs.writeFileSync(sessionFile, lines.join('\n'), 'utf-8');
    return true;
  }

  // Find the last "**Context:**" line in the most recent checkpoint (insert after it)
  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('**Context:**') || lines[i].startsWith('**Context at')) {
      insertIndex = i;
      // Don't break — we want the LAST one (most recent checkpoint)
    }
  }

  if (insertIndex >= 0) {
    lines.splice(insertIndex + 1, 0, endMarker);
    fs.writeFileSync(sessionFile, lines.join('\n'), 'utf-8');
    return true;
  }

  // Fallback: find "## TL;DR" and insert before it
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## TL;DR')) {
      lines.splice(i, 0, endMarker);
      fs.writeFileSync(sessionFile, lines.join('\n'), 'utf-8');
      return true;
    }
  }

  return false;
}

// ============================================
// TELEMETRY
// ============================================

function runTelemetry() {
  const reportScript = path.join(PROJECT_DIR, 'tools', 'cxms-report.mjs');
  if (!fs.existsSync(reportScript)) return false;

  try {
    execSync(`node "${reportScript}" --auto --quiet`, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 15000, // 15s max for telemetry
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// SESSION LOG
// ============================================

function logSessionEnd(hookInput, contextStatus, sessionFile, telemetryOk) {
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  const event = {
    timestamp: new Date().toISOString(),
    event: 'session_end',
    session_id: hookInput.session_id || null,
    reason: hookInput.reason || 'unknown',
    ctx_pct: contextStatus.ctx_pct || null,
    model: contextStatus.model || null,
    session_file: sessionFile ? path.basename(sessionFile) : null,
    telemetry_submitted: telemetryOk,
    hook_version: '1.0.0',
  };

  let log = [];
  try {
    if (fs.existsSync(SESSION_LOG_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSION_LOG_FILE, 'utf-8'));
      log = Array.isArray(existing) ? existing : [existing];
    }
  } catch { /* ignore */ }

  log.push(event);

  // Keep last 50 session events to avoid unbounded growth
  if (log.length > 50) {
    log = log.slice(-50);
  }

  fs.writeFileSync(SESSION_LOG_FILE, JSON.stringify(log, null, 2), 'utf-8');
}

// ============================================
// UNCOMMITTED CHANGES CHECK
// ============================================

function getUncommittedCount() {
  try {
    const status = execSync('git status --porcelain 2>nul', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    if (!status) return 0;
    return status.split('\n').length;
  } catch {
    return -1; // Unknown
  }
}

// ============================================
// COORDINATION FILE UPDATE
// ============================================

const CONFIG_FILE = path.join(CLAUDE_DIR, 'cxms-config.json');

function updateCoordinationFile(breadcrumbs, hookInput, contextStatus) {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return;
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const coordPath = config.coordination_file;
    if (!coordPath) return;

    const resolved = coordPath.replace(/^~/, os.homedir());
    if (!fs.existsSync(resolved)) return;

    const coord = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
    const projectName = config.project_name;
    const sessionId = (hookInput && hookInput.session_id) || '';
    const now = new Date().toISOString();

    if (coord.instances && coord.instances[projectName]) {
      coord.instances[projectName].last_session = now;
      coord.instances[projectName].cxms_version = config.cxms_version;
      coord.instances[projectName].tool_version = config.tool_version;

      // Build summary from breadcrumbs
      if (breadcrumbs) {
        const writes = (breadcrumbs.recent_operations || [])
          .filter(op => op.type === 'write' && op.summary)
          .slice(-3)
          .map(op => op.summary)
          .join('; ');
        if (writes) {
          coord.instances[projectName].last_session_summary = writes.substring(0, 200);
        }
      }
    }

    // Mark messages as read (per-session read_by for v1.1+)
    if (coord.messages) {
      for (const msg of coord.messages) {
        if (msg.to && (msg.to.includes(projectName) || msg.to.includes('all'))) {
          msg.read_by = msg.read_by || [];
          // Check if already read by this project (handle mixed string + object format)
          const alreadyRead = msg.read_by.some(entry =>
            typeof entry === 'string' ? entry === projectName : entry.project === projectName
          );
          if (!alreadyRead) {
            if (sessionId) {
              // Per-session read_by (v1.1 format)
              msg.read_by.push({
                project: projectName,
                session_id: sessionId,
                read_at: now,
              });
            } else {
              // Legacy string format
              msg.read_by.push(projectName);
            }
          }
        }
      }
    }

    // Mark this session as completed in active_sessions
    if (coord.active_sessions && sessionId) {
      const idx = coord.active_sessions.findIndex(s => s.session_id === sessionId);
      if (idx >= 0) {
        coord.active_sessions[idx].status = 'completed';
        coord.active_sessions[idx].last_activity = now;
        coord.active_sessions[idx].context_pct = (contextStatus && contextStatus.ctx_pct) || null;
        coord.active_sessions[idx].model = (contextStatus && contextStatus.model) || null;
      }

      // Prune stale sessions (completed >1hr, active >4hr)
      const ONE_HOUR = 60 * 60 * 1000;
      const FOUR_HOURS = 4 * ONE_HOUR;
      const nowMs = Date.now();
      coord.active_sessions = coord.active_sessions.filter(s => {
        const lastActivity = new Date(s.last_activity || s.started).getTime();
        if (s.status === 'completed') return (nowMs - lastActivity) < ONE_HOUR;
        return (nowMs - lastActivity) < FOUR_HOURS;
      });
    }

    coord.last_updated = now;
    fs.writeFileSync(resolved, JSON.stringify(coord, null, 2), 'utf-8');
  } catch { /* best-effort */ }
}

// ============================================
// MAIN
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

async function main() {
  // Read hook input from stdin (resolve on first chunk, 100ms timeout)
  let hookInput = {};
  try {
    const raw = await readStdinFast(100);
    if (raw) hookInput = JSON.parse(raw);
  } catch { /* ignore parse errors */ }

  const reason = hookInput.reason || 'unknown';
  const sessionId = hookInput.session_id || '';
  const contextStatus = readContextStatus(sessionId);
  const ctxPct = contextStatus.ctx_pct;

  // Find Session file
  const sessionFile = findFile(SESSION_FILE_PATTERNS);

  // 1. Update Session.md with end timestamp
  const sessionUpdated = updateSessionFile(sessionFile, hookInput, contextStatus);

  // 2. Run telemetry
  const telemetryOk = runTelemetry();

  // 3. Log session end event
  logSessionEnd(hookInput, contextStatus, sessionFile, telemetryOk);

  // 4. Check for uncommitted changes
  const uncommittedCount = getUncommittedCount();

  // 5. Update coordination file (session lifecycle + per-session read_by)
  try {
    const bcPath = path.join(CLAUDE_DIR, 'session-breadcrumbs.json');
    const bc = fs.existsSync(bcPath) ? JSON.parse(fs.readFileSync(bcPath, 'utf-8')) : null;
    updateCoordinationFile(bc, hookInput, contextStatus);
  } catch { /* best-effort */ }

  // 6. Update Claude Code memory (MEMORY.md) with session state
  try {
    const breadcrumbs = JSON.parse(
      fs.readFileSync(path.join(CLAUDE_DIR, 'session-breadcrumbs.json'), 'utf-8')
    );
    const accomplished = (breadcrumbs.recent_operations || [])
      .filter(op => op.type === 'write' && op.summary)
      .slice(-8)
      .map(op => {
        const f = op.path ? path.basename(op.path) : '';
        return op.summary ? (f + ': ' + op.summary).substring(0, 120) : f;
      });

    const tasksFile = findFile(['*_Tasks.md', 'PROJECT_Tasks.md']);

    updateMemory(PROJECT_DIR, {
      ctxPct: ctxPct,
      model: contextStatus.model || null,
      reason: getReasonLabel(reason),
      trigger: 'session-end',
      filesModified: breadcrumbs.files_modified || [],
      accomplished,
    }, tasksFile);
  } catch { /* best-effort -- memory bridge failure must not block exit */ }

  // 7. Clean up per-session state files (this session is done)
  if (sessionId) {
    const perSessionFiles = [
      `context-check-state-${sessionId}.json`,
      `context-warn-state-${sessionId}.json`,
      `compaction-gate-${sessionId}.json`,
      `context-status-${sessionId}.json`,
    ];
    for (const name of perSessionFiles) {
      try {
        const f = path.join(CLAUDE_DIR, name);
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch { /* ignore */ }
    }
  }

  // 8. Output summary to stdout
  console.log(`[CxMS] Session ended: ${getReasonLabel(reason)}`);
  if (ctxPct != null) {
    console.log(`[CxMS] Final context: ${ctxPct}%`);
  }
  if (sessionUpdated) {
    console.log(`[CxMS] Session file updated: ${path.basename(sessionFile)}`);
  }
  if (telemetryOk) {
    console.log(`[CxMS] Telemetry submitted.`);
  }
  if (uncommittedCount > 0) {
    console.log(`[CxMS] WARNING: ${uncommittedCount} uncommitted file(s). Consider committing before closing.`);
  }
}

main().catch(err => {
  // Hook must not crash — fail silently with a note
  console.error(`[CxMS Session End Hook Error] ${err.message}`);
}).finally(() => {
  // Force clean exit on Windows — without this, Node can linger
  // keeping the stdout pipe open, which blocks Claude Code's UI
  process.exit(0);
});
