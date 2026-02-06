#!/usr/bin/env node
/**
 * CxMS Pre-Compaction Hook
 *
 * Fires BEFORE Claude Code auto-compacts context, saving critical session
 * state to files so it survives the compaction event.
 *
 * What it does:
 *   1. Reads current context status from .claude/context-status.json
 *   2. Reads current session state from [PROJECT]_Session.md (TL;DR + latest checkpoint)
 *   3. Reads current tasks from [PROJECT]_Tasks.md
 *   4. Writes a recovery file (.claude/compaction-recovery.md) with:
 *      - What was being worked on
 *      - Key file references
 *      - Continuation instructions
 *   5. Outputs a warning message to stdout (injected into Claude's context)
 *
 * Requirements:
 *   - CxMS Session and/or Tasks files in the project root
 *   - Statusline configured to write .claude/context-status.json
 *   - See: https://github.com/RobSB2/CxMS
 *
 * Hook Configuration (.claude/settings.json):
 *   {
 *     "hooks": {
 *       "PreCompact": [{
 *         "hooks": [{
 *           "type": "command",
 *           "command": "node tools/cxms-pre-compact.mjs",
 *           "statusMessage": "Saving session state before compaction..."
 *         }]
 *       }]
 *     }
 *   }
 *
 * Input (stdin): JSON with { "trigger": "auto"|"manual" }
 * Output (stdout): Message injected into Claude's post-compaction context
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
const RECOVERY_FILE = path.join(CLAUDE_DIR, 'compaction-recovery.md');
const CONTEXT_STATUS_FILE = path.join(CLAUDE_DIR, 'context-status.json');
const COMPACTION_LOG_FILE = path.join(CLAUDE_DIR, 'compaction-log.json');

// CxMS file patterns to look for (in priority order)
const SESSION_FILE_PATTERNS = [
  '*_Session.local.md',
  '*_Session.md',
];

const TASKS_FILE_PATTERNS = [
  '*_Tasks.md',
];

// ============================================
// UTILITIES
// ============================================

function findFile(patterns) {
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      // Glob-like search in project root
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

function readFileSection(filePath, startMarker, endMarker, maxLines = 50) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let capturing = false;
  let captured = [];

  for (const line of lines) {
    if (startMarker && line.includes(startMarker)) {
      capturing = true;
      captured.push(line);
      continue;
    }
    if (capturing) {
      if (endMarker && line.includes(endMarker)) {
        break;
      }
      captured.push(line);
      if (captured.length >= maxLines) break;
    }
  }

  return captured.length > 0 ? captured.join('\n') : null;
}

function readTLDR(filePath) {
  return readFileSection(filePath, '## TL;DR', '---', 30);
}

function readLatestCheckpoint(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  // Find the most recent session checkpoint (first ## Session N header after TL;DR)
  const match = content.match(/## Session \d+ Checkpoint[\s\S]*?(?=\n---|\n## Session \d+ (?:Checkpoint|Summary))/);
  if (match) {
    // Truncate if too long
    const lines = match[0].split('\n');
    return lines.slice(0, 60).join('\n');
  }
  return null;
}

function readActiveTasks(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let capturing = false;
  let captured = [];
  let taskCount = 0;

  for (const line of lines) {
    if (line.includes('## Active Tasks') || line.includes('## Pending')) {
      capturing = true;
      continue;
    }
    if (capturing) {
      if (line.startsWith('## Completed') || line.startsWith('## Task Template')) {
        break;
      }
      // Only capture task headers and status lines
      if (line.startsWith('### TASK-') || line.startsWith('**Status:**') || line.startsWith('**Priority:**')) {
        captured.push(line);
        if (line.startsWith('### TASK-')) taskCount++;
      }
    }
    if (taskCount >= 5) break; // Cap at 5 tasks
  }

  return captured.length > 0 ? captured.join('\n') : null;
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

  const trigger = hookInput.trigger || 'unknown';
  const timestamp = new Date().toISOString();

  // Ensure .claude directory exists
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  // Read context status (handle BOM from PowerShell)
  let contextStatus = {};
  try {
    if (fs.existsSync(CONTEXT_STATUS_FILE)) {
      let raw = fs.readFileSync(CONTEXT_STATUS_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      contextStatus = JSON.parse(raw);
    }
  } catch { /* ignore */ }

  // Find and read CxMS files
  const sessionFile = findFile(SESSION_FILE_PATTERNS);
  const tasksFile = findFile(TASKS_FILE_PATTERNS);

  const tldr = sessionFile ? readTLDR(sessionFile) : null;
  const checkpoint = sessionFile ? readLatestCheckpoint(sessionFile) : null;
  const activeTasks = tasksFile ? readActiveTasks(tasksFile) : null;

  // Get uncommitted file changes
  let uncommittedFiles = null;
  try {
    const nullDev = process.platform === 'win32' ? '2>nul' : '2>/dev/null';
    uncommittedFiles = execSync(`git diff --name-only ${nullDev}`, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim() || null;
  } catch { /* ignore */ }

  // ============================================
  // BUILD RECOVERY FILE
  // ============================================

  const recoveryLines = [
    `# CxMS Compaction Recovery`,
    ``,
    `**Auto-generated:** ${timestamp}`,
    `**Trigger:** ${trigger}`,
    `**Context at compaction:** ${contextStatus.ctx_pct || 'unknown'}%`,
    ``,
    `> This file was automatically saved by the CxMS PreCompact hook before context was compacted.`,
    `> Read this file to recover session state.`,
    ``,
    `---`,
    ``,
  ];

  if (tldr) {
    recoveryLines.push(`## Session State (TL;DR)`, ``, tldr, ``, `---`, ``);
  }

  if (checkpoint) {
    recoveryLines.push(`## Latest Checkpoint`, ``, checkpoint, ``, `---`, ``);
  }

  if (activeTasks) {
    recoveryLines.push(`## Active Tasks`, ``, activeTasks, ``, `---`, ``);
  }

  if (uncommittedFiles) {
    recoveryLines.push(
      `## Uncommitted Changes`,
      ``,
      '```',
      uncommittedFiles,
      '```',
      ``,
      `---`,
      ``
    );
  }

  recoveryLines.push(
    `## Recovery Instructions`,
    ``,
    `1. Read this file to understand where the session was`,
    `2. Read the Session file for full context: ${sessionFile ? path.basename(sessionFile) : 'unknown'}`,
    `3. Read the Tasks file for pending work: ${tasksFile ? path.basename(tasksFile) : 'unknown'}`,
    `4. Continue from the latest checkpoint above`,
    ``
  );

  // Write recovery file
  fs.writeFileSync(RECOVERY_FILE, recoveryLines.join('\n'), 'utf-8');

  // ============================================
  // LOG COMPACTION EVENT
  // ============================================

  const compactionEvent = {
    timestamp,
    trigger,
    ctx_pct_at_compaction: contextStatus.ctx_pct || null,
    model: contextStatus.model || null,
    recovery_file: RECOVERY_FILE,
    session_file: sessionFile ? path.basename(sessionFile) : null,
    hook_version: '1.0.0',
  };

  let compactionLog = [];
  try {
    if (fs.existsSync(COMPACTION_LOG_FILE)) {
      const existing = JSON.parse(fs.readFileSync(COMPACTION_LOG_FILE, 'utf-8'));
      compactionLog = Array.isArray(existing) ? existing : [existing];
    }
  } catch { /* ignore */ }

  compactionLog.push(compactionEvent);

  // Keep last 50 events to avoid unbounded growth
  if (compactionLog.length > 50) {
    compactionLog = compactionLog.slice(-50);
  }

  fs.writeFileSync(COMPACTION_LOG_FILE, JSON.stringify(compactionLog, null, 2), 'utf-8');

  // ============================================
  // OUTPUT TO STDOUT (injected into Claude's context)
  // ============================================

  console.log(`[CxMS] Compaction detected (${trigger}). Session state saved to .claude/compaction-recovery.md`);
  console.log(`[CxMS] Context was at ${contextStatus.ctx_pct || '?'}% before compaction.`);
  if (sessionFile) {
    console.log(`[CxMS] Session file: ${path.basename(sessionFile)}`);
  }
  if (activeTasks) {
    console.log(`[CxMS] Active tasks preserved in recovery file.`);
  }
}

main().catch(err => {
  // Hook must not crash — fail silently with a note
  console.error(`[CxMS Pre-Compact Hook Error] ${err.message}`);
  process.exit(0); // Exit 0 so we don't block compaction
});
