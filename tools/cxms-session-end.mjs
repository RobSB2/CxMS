#!/usr/bin/env node
/**
 * CxMS Session End Hook
 *
 * Fires when a Claude Code session ends, performing automated cleanup:
 *   1. Reads session metadata from stdin (session_id, reason, transcript_path)
 *   2. Updates [PROJECT]_Session.md with session-end timestamp
 *   3. Runs telemetry submission (cxms-report.mjs --auto --quiet) if available
 *   4. Logs the session end event to .claude/session-log.json
 *   5. Outputs a summary to stdout
 *
 * Requirements:
 *   - CxMS Session file in the project root
 *   - Statusline configured to write .claude/context-status.json
 *   - See: https://github.com/RobSB2/CxMS
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
 * Version: 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

function readContextStatus() {
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
    const nullDev = process.platform === 'win32' ? '2>nul' : '2>/dev/null';
    const status = execSync(`git status --porcelain ${nullDev}`, {
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
// MAIN
// ============================================

async function main() {
  // Read hook input from stdin
  let hookInput = {};
  try {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf-8').trim();
    if (raw) hookInput = JSON.parse(raw);
  } catch { /* ignore parse errors */ }

  const reason = hookInput.reason || 'unknown';
  const contextStatus = readContextStatus();
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

  // 5. Output summary to stdout
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
  process.exit(0); // Exit 0 so we don't block session exit
});
