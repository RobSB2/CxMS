#!/usr/bin/env node
/**
 * CxMS Context Warning Gate (v6.0)
 *
 * PreToolUse hook -- startup gate + context save-once gate + post-compaction recovery.
 *
 * Matcher: ^(Write|Edit|Bash|NotebookEdit)$ -- only fires for write/bash tools.
 * Read, Glob, Grep, AskUserQuestion, Task etc. are never intercepted.
 *
 * Behavior:
 *   1. Startup gate: if startup-state.json exists and complete=false → BLOCK
 *   2. ctx_pct < 80%: approve (tool proceeds normally)
 *   3. ctx_pct >= 80% (FIRST TIME): BLOCK once to force session save
 *   4. ctx_pct >= 80% (AFTER SAVE): APPROVE — trust compaction recovery
 *   5. Compaction detected: BLOCK first tool with recovery instructions
 *
 * v6.0 CHANGE: Per-session context status files.
 *   Uses session_id from Claude Code hook input to read per-session status file
 *   (context-status-{session_id}.json). Fixes concurrent session contamination
 *   where one session's context % would block a different session's hooks.
 *   Falls back to legacy context-status.json if no session_id available.
 *
 * Allowed tools at 80%+ (always, even before save):
 *   - Write/Edit to Session/checkpoint/recovery/breadcrumbs files
 *
 * Input (stdin): JSON from Claude Code PreToolUse event
 * Output (stdout): JSON with decision field
 *
 * Version: 6.0.0 -- Per-session isolation for concurrent session support.
 */

import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const STARTUP_STATE_FILE = path.join(CLAUDE_DIR, 'startup-state.json');

// Per-session file paths (set after parsing session_id from stdin)
function getSessionFiles(sessionId) {
  const suffix = sessionId ? `-${sessionId}` : '';
  return {
    contextStatus: path.join(CLAUDE_DIR, `context-status${suffix}.json`),
    checkState: path.join(CLAUDE_DIR, `context-check-state${suffix}.json`),
    compactionGate: path.join(CLAUDE_DIR, `compaction-gate${suffix}.json`),
    warnState: path.join(CLAUDE_DIR, `context-warn-state${suffix}.json`),
  };
}

function approve() {
  process.stdout.write(JSON.stringify({ decision: 'approve' }) + '\n');
}

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }) + '\n');
}

// ============================================
// STARTUP GATE CHECK (~5ms: existsSync + readFileSync + JSON.parse)
// ============================================

function checkStartupGate() {
  try {
    if (!fs.existsSync(STARTUP_STATE_FILE)) return null; // No gate
    const state = JSON.parse(fs.readFileSync(STARTUP_STATE_FILE, 'utf-8'));
    if (state.complete) return null; // Gate already lifted
    const required = state.required_files || [];
    const read = state.read_files || [];
    const remaining = required.filter(f => !read.includes(f));
    if (remaining.length === 0) return null; // All read (race condition safety)
    return remaining;
  } catch { return null; } // On error, don't block
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

async function main() {
  // Parse stdin for tool info
  let hookInput = {};
  try {
    const raw = await readStdinFast(100);
    if (raw) hookInput = JSON.parse(raw);
  } catch { /* ignore */ }

  const toolName = hookInput.tool_name || '';
  const toolInput = hookInput.tool_input || {};
  const sessionId = hookInput.session_id || '';
  const filePath = (toolInput.file_path || '').replace(/\\/g, '/').toLowerCase();

  // Get per-session file paths
  const files = getSessionFiles(sessionId);

  // Always allow writes to Session/checkpoint/recovery files
  if (toolName === 'Write' || toolName === 'Edit') {
    if (filePath.includes('session') || filePath.includes('checkpoint') ||
        filePath.includes('compaction') || filePath.includes('context-check-state') ||
        filePath.includes('breadcrumbs')) {
      approve();
      return;
    }
  }

  // --- STARTUP GATE: Block if required reads incomplete ---
  const remainingStartup = checkStartupGate();
  if (remainingStartup) {
    block(
      '[CxMS] STARTUP INCOMPLETE -- You must read all required startup files before using ' +
      toolName + '. Remaining: ' + remainingStartup.join(', ') + '. ' +
      'Read these files now, then this tool will be unblocked.'
    );
    return;
  }

  // Read context status (per-session file, fallback to legacy)
  let ctxPct = null;
  try {
    let statusFile = files.contextStatus;
    // If per-session file doesn't exist, try legacy
    if (!fs.existsSync(statusFile)) {
      statusFile = path.join(CLAUDE_DIR, 'context-status.json');
    }
    if (fs.existsSync(statusFile)) {
      let raw = fs.readFileSync(statusFile, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      const status = JSON.parse(raw);
      // If reading legacy file, only trust it if session_id matches or is absent
      if (statusFile.includes('context-status-') || !status.session_id || !sessionId || status.session_id === sessionId) {
        if (status.reliable !== false && status.ctx_pct != null && status.ctx_pct <= 100) {
          ctxPct = status.ctx_pct;
        }
      }
    }
  } catch { /* ignore */ }

  if (ctxPct == null) { approve(); return; }

  // Read check state for compaction detection (per-session)
  let prevPct = 0;
  try {
    let checkFile = files.checkState;
    // Fallback to legacy if per-session doesn't exist
    if (!fs.existsSync(checkFile)) {
      checkFile = path.join(CLAUDE_DIR, 'context-check-state.json');
    }
    if (fs.existsSync(checkFile)) {
      const state = JSON.parse(fs.readFileSync(checkFile, 'utf-8'));
      prevPct = state.lastCtxPct || 0;
    }
  } catch { /* ignore */ }

  // --- COMPACTION DETECTION ---
  if (prevPct >= 60 && (prevPct - ctxPct) >= 25) {
    let alreadyFired = false;
    try {
      if (fs.existsSync(files.compactionGate)) {
        const gate = JSON.parse(fs.readFileSync(files.compactionGate, 'utf-8'));
        alreadyFired = gate.fired === true;
      }
    } catch { /* ignore */ }

    if (!alreadyFired) {
      try {
        fs.writeFileSync(files.compactionGate, JSON.stringify({
          fired: true,
          at: new Date().toISOString(),
          fromPct: prevPct,
          toPct: ctxPct,
          session_id: sessionId
        }, null, 2), 'utf-8');
      } catch { /* ignore */ }

      block(
        '[CxMS] COMPACTION DETECTED -- Context dropped from ' + prevPct + '% to ' + ctxPct + '%. ' +
        'Session state may be lost. BEFORE doing anything else: ' +
        '(1) Read .claude/compaction-recovery.md to restore session context. ' +
        '(2) Write a checkpoint to your project Session.local.md confirming what you recovered. ' +
        '(3) Then resume normal work.'
      );
      return;
    }
  } else {
    try {
      if (fs.existsSync(files.compactionGate)) {
        fs.unlinkSync(files.compactionGate);
      }
    } catch { /* ignore */ }
    // Reset save-once warn state ONLY when below 80% (post-compaction recovery).
    // Do NOT delete when still at 80%+ — that erases the "already warned" flag
    // and causes the save-once gate to fire repeatedly instead of once. (v5.0.1 fix)
    if (ctxPct < 80) {
      try {
        if (fs.existsSync(files.warnState)) {
          fs.unlinkSync(files.warnState);
        }
      } catch { /* ignore */ }
    }
  }

  // --- SAVE-ONCE GATE: Block ONCE at 80%+ to force session save, then approve ---
  if (ctxPct >= 80) {
    // Check if we already warned this session
    let alreadyWarned = false;
    try {
      if (fs.existsSync(files.warnState)) {
        const warnState = JSON.parse(fs.readFileSync(files.warnState, 'utf-8'));
        alreadyWarned = warnState.saved === true;
      }
    } catch { /* ignore */ }

    if (!alreadyWarned) {
      // First time hitting 80%: block once to force a session save
      try {
        fs.writeFileSync(files.warnState, JSON.stringify({
          saved: true,
          at: new Date().toISOString(),
          ctx_pct: ctxPct,
          session_id: sessionId
        }, null, 2), 'utf-8');
      } catch { /* ignore */ }

      const buffer = 85 - ctxPct;
      block(
        '[CxMS] SAVE CHECKPOINT -- Context at ' + ctxPct + '% (' + buffer + '% buffer before auto-compaction at 85%). ' +
        'Save session state to your Session.local.md file NOW: ' +
        '(1) what was accomplished, (2) key decisions, (3) files modified, (4) current task, (5) resume prompt. ' +
        'After saving, CONTINUE WORKING — the compaction recovery system will handle the transition at 85%.'
      );
      return;
    }

    // Already warned and saved: approve — trust compaction recovery
    approve();
    return;
  }

  // Below 80%: approve
  approve();
}

main().catch(() => {
  approve();
}).finally(() => {
  process.exit(0);
});
