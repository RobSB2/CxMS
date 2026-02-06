#!/usr/bin/env node
/**
 * CxMS Context Check Hook
 *
 * Fires after every tool use (PostToolUse) to monitor context consumption.
 * Runs async so it doesn't block the agent.
 *
 * What it does:
 *   1. Reads .claude/context-status.json (written by statusline)
 *   2. Checks ctx_pct against thresholds
 *   3. Outputs warnings to stdout (injected into Claude's context)
 *
 * Thresholds:
 *   65% - WARN: "Context at 65%. 20% buffer remains."
 *   75% - CHECKPOINT: "Auto-checkpoint needed. Write to Session.md."
 *   80% - STOP: "Full session save. Do NOT continue until confirmed."
 *   83% - EMERGENCY: "Save NOW. Compaction imminent."
 *
 * Requirements:
 *   - Statusline must be configured to write .claude/context-status.json
 *   - See: https://github.com/RobSB2/CxMS
 *
 * Hook Configuration (.claude/settings.json):
 *   {
 *     "hooks": {
 *       "PostToolUse": [{
 *         "hooks": [{
 *           "type": "command",
 *           "command": "node tools/cxms-context-check.mjs",
 *           "async": true
 *         }]
 *       }]
 *     }
 *   }
 *
 * Version: 1.0.0
 */

import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const CONTEXT_STATUS_FILE = path.join(CLAUDE_DIR, 'context-status.json');
const CHECK_STATE_FILE = path.join(CLAUDE_DIR, 'context-check-state.json');

// Thresholds - only warn once per threshold crossing
const THRESHOLDS = [
  { pct: 83, level: 'EMERGENCY', message: 'EMERGENCY: Context at {pct}%. Compaction imminent. Save session state NOW.' },
  { pct: 80, level: 'STOP', message: 'STOP: Context at {pct}%. 5% buffer. Full session save needed. Do NOT continue until user confirms.' },
  { pct: 75, level: 'CHECKPOINT', message: 'CHECKPOINT: Context at {pct}%. 10% buffer. Write checkpoint to Session.md immediately.' },
  { pct: 65, level: 'WARN', message: 'Context at {pct}%. 20% buffer remains before auto-compaction at 85%.' },
];

function main() {
  // Read context status (handle BOM from PowerShell)
  let contextStatus = {};
  try {
    if (fs.existsSync(CONTEXT_STATUS_FILE)) {
      let raw = fs.readFileSync(CONTEXT_STATUS_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      contextStatus = JSON.parse(raw);
    } else {
      // No status file yet — statusline hasn't written it
      return;
    }
  } catch {
    return;
  }

  const ctxPct = contextStatus.ctx_pct;
  if (ctxPct == null) return;

  // Read previous check state (to avoid repeating warnings)
  let checkState = { lastWarnLevel: null, lastCtxPct: 0, checkCount: 0 };
  try {
    if (fs.existsSync(CHECK_STATE_FILE)) {
      checkState = JSON.parse(fs.readFileSync(CHECK_STATE_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }

  checkState.checkCount = (checkState.checkCount || 0) + 1;
  checkState.lastCtxPct = ctxPct;

  // Find the highest threshold we've crossed
  let activeThreshold = null;
  for (const t of THRESHOLDS) {
    if (ctxPct >= t.pct) {
      activeThreshold = t;
      break; // Thresholds are sorted highest first
    }
  }

  // Only output if we've crossed a NEW threshold (or re-crossed after drop)
  if (activeThreshold && activeThreshold.level !== checkState.lastWarnLevel) {
    const msg = activeThreshold.message.replace('{pct}', ctxPct);
    console.log(`[CxMS] ${msg}`);
    checkState.lastWarnLevel = activeThreshold.level;
  } else if (!activeThreshold && checkState.lastWarnLevel) {
    // Context dropped below all thresholds (e.g., after compaction)
    checkState.lastWarnLevel = null;
  }

  // Write updated state
  try {
    fs.writeFileSync(CHECK_STATE_FILE, JSON.stringify(checkState, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

main();
