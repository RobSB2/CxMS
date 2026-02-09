#!/usr/bin/env node
/**
 * CxMS Context Warning Gate (v2.0)
 *
 * PreToolUse hook -- STARTUP ENFORCEMENT + EMERGENCY tool gate + post-compaction recovery.
 *
 * Why PreToolUse?
 *   PostToolUse stdout is ONLY visible in verbose mode (Ctrl+O).
 *   PreToolUse with decision:"block" feeds the reason directly to the model
 *   as the tool result. This is GUARANTEED to reach the model.
 *
 * Behavior:
 *   - Startup incomplete: BLOCK non-read tools until startup files are read
 *   - ctx_pct < 80%: approve (tool proceeds normally)
 *   - ctx_pct >= 80%: BLOCK tool (except Session writes + Reads)
 *   - Compaction detected: BLOCK first tool with recovery instructions
 *
 * Allowed tools at 80%+:
 *   - Read (needed for recovery / context gathering)
 *   - Write/Edit to Session files (needed for emergency saves)
 *   - AskUserQuestion (needed for user communication)
 *
 * Input (stdin): JSON from Claude Code PreToolUse event
 * Output (stdout): JSON with decision field
 *
 * Version: 2.0.0
 */

import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const CONTEXT_STATUS_FILE = path.join(CLAUDE_DIR, 'context-status.json');
const CHECK_STATE_FILE = path.join(CLAUDE_DIR, 'context-check-state.json');
const COMPACTION_GATE_FILE = path.join(CLAUDE_DIR, 'compaction-gate.json');
const STARTUP_STATE_FILE = path.join(CLAUDE_DIR, 'startup-state.json');
const CONFIG_FILE = path.join(CLAUDE_DIR, 'cxms-config.json');

function getSessionFile() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return config.session_file || 'PROJECT_Session.md';
    }
  } catch { /* ignore */ }
  return 'PROJECT_Session.md';
}

// Tools allowed through during startup enforcement
const STARTUP_ALLOWED_TOOLS = ['Read', 'Glob', 'Grep', 'AskUserQuestion'];

function checkStartupComplete(toolName) {
  try {
    if (!fs.existsSync(STARTUP_STATE_FILE)) return true; // No state file = no enforcement
    const state = JSON.parse(fs.readFileSync(STARTUP_STATE_FILE, 'utf-8'));
    if (state.complete === true) return true;
    if (STARTUP_ALLOWED_TOOLS.includes(toolName)) return true;
    return false;
  } catch {
    return true; // If state file is corrupt, don't block
  }
}

function getStartupRemaining() {
  try {
    const state = JSON.parse(fs.readFileSync(STARTUP_STATE_FILE, 'utf-8'));
    return state.remaining || state.required_files || [];
  } catch {
    return [];
  }
}

function approve() {
  process.stdout.write(JSON.stringify({ decision: 'approve' }) + '\n');
}

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }) + '\n');
}

async function main() {
  // Parse stdin for tool info
  let hookInput = {};
  try {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf-8').trim();
    if (raw) hookInput = JSON.parse(raw);
  } catch { /* ignore */ }

  const toolName = hookInput.tool_name || '';
  const toolInput = hookInput.tool_input || {};
  const filePath = (toolInput.file_path || '').replace(/\\/g, '/').toLowerCase();

  // --- STARTUP ENFORCEMENT (checked FIRST, before everything else) ---
  if (!checkStartupComplete(toolName)) {
    const remaining = getStartupRemaining();
    block(
      '[CxMS] STARTUP INCOMPLETE -- You MUST read these files before doing any work:\n' +
      remaining.map((f, i) => `  (${i + 1}) ${f}`).join('\n') + '\n' +
      'Use the Read tool to read each file now. Non-read tools are BLOCKED until startup is complete.'
    );
    return;
  }

  // Always allow Read (needed for recovery and context gathering)
  if (toolName === 'Read') { approve(); return; }

  // Always allow user communication
  if (toolName === 'AskUserQuestion') { approve(); return; }

  // Always allow writes to Session/checkpoint/recovery files
  if (toolName === 'Write' || toolName === 'Edit') {
    if (filePath.includes('session') || filePath.includes('checkpoint') ||
        filePath.includes('compaction') || filePath.includes('context-check-state') ||
        filePath.includes('breadcrumbs')) {
      approve();
      return;
    }
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
  // If ctx_pct dropped 25+ points from previous reading, compaction likely occurred.
  // Use a one-shot gate file so we only block ONCE after compaction.
  if (prevPct >= 60 && (prevPct - ctxPct) >= 25) {
    let alreadyFired = false;
    try {
      if (fs.existsSync(COMPACTION_GATE_FILE)) {
        const gate = JSON.parse(fs.readFileSync(COMPACTION_GATE_FILE, 'utf-8'));
        alreadyFired = gate.fired === true;
      }
    } catch { /* ignore */ }

    if (!alreadyFired) {
      // Write gate file so we don't block again
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
        '(2) Write a checkpoint to ' + getSessionFile() + ' confirming what you recovered. ' +
        '(3) Then resume normal work.'
      );
      return;
    }
  } else {
    // Context is normal -- clear the compaction gate for next time
    try {
      if (fs.existsSync(COMPACTION_GATE_FILE)) {
        fs.unlinkSync(COMPACTION_GATE_FILE);
      }
    } catch { /* ignore */ }
  }

  // --- STOP GATE: Block at 80%+ ---
  if (ctxPct >= 80) {
    const buffer = 85 - ctxPct;
    block(
      '[CxMS] STOP -- Context at ' + ctxPct + '% (' + buffer + '% buffer before auto-compaction at 85%). ' +
      'Do NOT execute any more tools until you save full session state to ' + getSessionFile() + '. ' +
      'Include: (1) what was accomplished, (2) key decisions, (3) files modified, (4) current task, (5) resume prompt. ' +
      'Then tell the user: "Session saved. Context at ' + ctxPct + '%. Recommend starting a new session."'
    );
    return;
  }

  // Below 80%: approve
  approve();
}

main().catch(() => {
  approve();
}).finally(() => {
  // Force clean exit on Windows — without this, Node can linger
  // keeping the stdout pipe open, which blocks Claude Code's UI
  process.exit(0);
});
