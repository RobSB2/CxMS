#!/usr/bin/env node
/**
 * CxMS Context Warning Gate (v5.0)
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
 * v5.0 CHANGE: The 80% gate is now a ONE-TIME save prompt, not a hard stop.
 *   After the agent saves session state, all subsequent tools are approved.
 *   The PreCompact hook handles the actual compaction at 85%, and the
 *   compaction detection gate handles post-compaction recovery.
 *   This lets us collect real data on compaction recovery in production.
 *
 * Allowed tools at 80%+ (always, even before save):
 *   - Write/Edit to Session/checkpoint/recovery/breadcrumbs files
 *
 * Input (stdin): JSON from Claude Code PreToolUse event
 * Output (stdout): JSON with decision field
 *
 * Version: 5.0.0 -- One-time save gate replaces hard stop at 80%.
 *   Trust compaction recovery system instead of forcing new sessions.
 */

import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const CONTEXT_STATUS_FILE = path.join(CLAUDE_DIR, 'context-status.json');
const CHECK_STATE_FILE = path.join(CLAUDE_DIR, 'context-check-state.json');
const COMPACTION_GATE_FILE = path.join(CLAUDE_DIR, 'compaction-gate.json');
const STARTUP_STATE_FILE = path.join(CLAUDE_DIR, 'startup-state.json');
const CONTEXT_WARN_STATE_FILE = path.join(CLAUDE_DIR, 'context-warn-state.json');

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
  const filePath = (toolInput.file_path || '').replace(/\\/g, '/').toLowerCase();

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

  // Read context status
  let ctxPct = null;
  try {
    if (fs.existsSync(CONTEXT_STATUS_FILE)) {
      let raw = fs.readFileSync(CONTEXT_STATUS_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      const status = JSON.parse(raw);
      if (status.reliable !== false && status.ctx_pct != null && status.ctx_pct <= 100) {
        ctxPct = status.ctx_pct;
      }
    }
  } catch { /* ignore */ }

  if (ctxPct == null) { approve(); return; }

  // Read check state for compaction detection
  let prevPct = 0;
  try {
    if (fs.existsSync(CHECK_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(CHECK_STATE_FILE, 'utf-8'));
      prevPct = state.lastCtxPct || 0;
    }
  } catch { /* ignore */ }

  // --- COMPACTION DETECTION ---
  if (prevPct >= 60 && (prevPct - ctxPct) >= 25) {
    let alreadyFired = false;
    try {
      if (fs.existsSync(COMPACTION_GATE_FILE)) {
        const gate = JSON.parse(fs.readFileSync(COMPACTION_GATE_FILE, 'utf-8'));
        alreadyFired = gate.fired === true;
      }
    } catch { /* ignore */ }

    if (!alreadyFired) {
      try {
        fs.writeFileSync(COMPACTION_GATE_FILE, JSON.stringify({
          fired: true,
          at: new Date().toISOString(),
          fromPct: prevPct,
          toPct: ctxPct
        }, null, 2), 'utf-8');
      } catch { /* ignore */ }

      block(
        '[CxMS] COMPACTION DETECTED -- Context dropped from ' + prevPct + '% to ' + ctxPct + '%. ' +
        'Session state may be lost. BEFORE doing anything else: ' +
        '(1) Read .claude/compaction-recovery.md to restore session context. ' +
        '(2) Write a checkpoint to your project Session file confirming what you recovered. ' +
        '(3) Then resume normal work.'
      );
      return;
    }
  } else {
    try {
      if (fs.existsSync(COMPACTION_GATE_FILE)) {
        fs.unlinkSync(COMPACTION_GATE_FILE);
      }
    } catch { /* ignore */ }
    // Also reset the save-once warn state after compaction recovery
    try {
      if (fs.existsSync(CONTEXT_WARN_STATE_FILE)) {
        fs.unlinkSync(CONTEXT_WARN_STATE_FILE);
      }
    } catch { /* ignore */ }
  }

  // --- SAVE-ONCE GATE: Block ONCE at 80%+ to force session save, then approve ---
  if (ctxPct >= 80) {
    // Check if we already warned this session
    let alreadyWarned = false;
    try {
      if (fs.existsSync(CONTEXT_WARN_STATE_FILE)) {
        const warnState = JSON.parse(fs.readFileSync(CONTEXT_WARN_STATE_FILE, 'utf-8'));
        alreadyWarned = warnState.saved === true;
      }
    } catch { /* ignore */ }

    if (!alreadyWarned) {
      // First time hitting 80%: block once to force a session save
      try {
        fs.writeFileSync(CONTEXT_WARN_STATE_FILE, JSON.stringify({
          saved: true,
          at: new Date().toISOString(),
          ctx_pct: ctxPct
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
