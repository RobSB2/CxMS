#!/usr/bin/env node
/**
 * CxMS Pre-Compaction Hook (v3.0)
 *
 * Fires BEFORE Claude Code auto-compacts context, saving critical session
 * state to files so it survives the compaction event.
 *
 * v3.0 CHANGES:
 *   - Reads breadcrumbs WITH edit summaries (captures WHAT changed, not just WHERE)
 *   - Reads file headers from disk for modified files (title, version, purpose)
 *   - "What Was Done" section with auto-extracted narrative from Write/Edit inputs
 *   - Combined with v3.0 context-check which forces periodic detailed checkpoints
 *
 * What it saves:
 *   1. BREADCRUMBS with edit summaries — what was done and why
 *   2. FILE HEADERS — title/version/purpose from each modified file
 *   3. Session.md TL;DR + latest checkpoint (may be stale, but still useful)
 *   4. Active tasks from Tasks.md
 *   5. Uncommitted git changes (modified + untracked)
 *
 * Output:
 *   .claude/compaction-recovery.md — Human-readable recovery file
 *   .claude/compaction-log.json — Append-only event log
 *   stdout — Message injected into Claude's post-compaction context
 *
 * Hook Configuration (.claude/settings.json):
 *   "PreCompact": [{ "hooks": [{
 *     "type": "command",
 *     "command": "node tools/cxms-pre-compact.mjs",
 *     "timeout": 30,
 *     "statusMessage": "Saving session state before compaction..."
 *   }]}]
 *
 * Input (stdin): JSON with { "trigger": "auto"|"manual" }
 * Output (stdout): Message injected into Claude's post-compaction context
 *
 * Version: 3.0.0
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
const BREADCRUMBS_FILE = path.join(CLAUDE_DIR, 'session-breadcrumbs.json');

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
// BREADCRUMB READING (v3.0 — with summaries + file headers)
// ============================================

function readBreadcrumbs() {
  try {
    if (fs.existsSync(BREADCRUMBS_FILE)) {
      const raw = fs.readFileSync(BREADCRUMBS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Read the first N lines of a file to extract title/purpose/context.
 * Only reads text files (.md, .mjs, .js, .json, .txt, .sh).
 * Returns null for binary/unknown files.
 */
function readFileHeader(filePath, maxLines = 8) {
  const textExtensions = ['.md', '.mjs', '.js', '.ts', '.json', '.txt', '.sh', '.yaml', '.yml', '.csv'];
  const ext = path.extname(filePath).toLowerCase();
  if (!textExtensions.includes(ext)) return null;

  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(PROJECT_DIR, filePath);

  try {
    if (!fs.existsSync(fullPath)) return null;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n').slice(0, maxLines);

    // Extract the meaningful bits: headings, version, purpose
    const meaningful = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Skip HTML comments, frontmatter delimiters
      if (trimmed.startsWith('<!--') || trimmed === '---' || trimmed === '```') continue;
      // Keep headings, version lines, purpose lines, JSDoc lines
      if (/^#{1,3}\s/.test(trimmed) ||
          /^\*\*Version/.test(trimmed) ||
          /^\*\*Purpose/.test(trimmed) ||
          /^\*\*Created/.test(trimmed) ||
          /^\*\s/.test(trimmed) ||
          /^\/\*\*/.test(trimmed) ||
          /^\/\//.test(trimmed)) {
        meaningful.push(trimmed);
      }
    }

    return meaningful.length > 0 ? meaningful.slice(0, 4).join(' | ') : null;
  } catch {
    return null;
  }
}

function formatBreadcrumbsForRecovery(crumbs) {
  if (!crumbs) return null;

  const lines = [];

  lines.push(`## Live Session Activity (Breadcrumbs)`);
  lines.push(``);
  lines.push(`> Auto-generated from PostToolUse breadcrumbs — this is the FRESHEST data.`);
  lines.push(`> Breadcrumbs include edit summaries showing WHAT changed, not just WHERE.`);
  lines.push(``);
  lines.push(`**Session started:** ${crumbs.session_start || 'unknown'}`);
  lines.push(`**Last tool call:** ${crumbs.last_updated || 'unknown'}`);
  lines.push(`**Total tool calls:** ${crumbs.tool_count || 0}`);
  lines.push(``);

  // Work domains
  if (crumbs.work_domains && crumbs.work_domains.length > 0) {
    lines.push(`### Work Domains`);
    for (const d of crumbs.work_domains) {
      lines.push(`- \`${d}\``);
    }
    lines.push(``);
  }

  // Files modified WITH headers read from disk
  if (crumbs.files_modified && crumbs.files_modified.length > 0) {
    lines.push(`### Files Modified This Session`);
    // Cap at 15 for header reading performance
    const filesToShow = crumbs.files_modified.slice(-15);
    for (const f of filesToShow) {
      const header = readFileHeader(f);
      if (header) {
        lines.push(`- \`${f}\` — ${header}`);
      } else {
        lines.push(`- \`${f}\``);
      }
    }
    if (crumbs.files_modified.length > 15) {
      lines.push(`- *(${crumbs.files_modified.length - 15} more...)*`);
    }
    lines.push(``);
  }

  // Files read
  if (crumbs.files_read && crumbs.files_read.length > 0) {
    lines.push(`### Files Read This Session`);
    const readFiles = crumbs.files_read.slice(-15);
    for (const f of readFiles) {
      lines.push(`- \`${f}\``);
    }
    if (crumbs.files_read.length > 15) {
      lines.push(`- *(${crumbs.files_read.length - 15} more...)*`);
    }
    lines.push(``);
  }

  // Recent operations WITH summaries — this is the narrative
  const opsWithSummaries = (crumbs.recent_operations || [])
    .filter(op => op.summary)
    .slice(-20);

  if (opsWithSummaries.length > 0) {
    lines.push(`### What Was Done (Edit Summaries)`);
    lines.push(``);
    lines.push(`> These summaries are auto-extracted from Write/Edit tool inputs.`);
    lines.push(`> They capture WHAT changed, not just which file was touched.`);
    lines.push(``);
    for (const op of opsWithSummaries) {
      const time = op.ts ? op.ts.split('T')[1]?.split('.')[0] || '' : '';
      const pathShort = op.path ? path.basename(op.path) : '';
      lines.push(`- **${time}** | ${op.tool} \`${pathShort}\`: ${op.summary}`);
    }
    lines.push(``);
  }

  // Full recent operations timeline
  if (crumbs.recent_operations && crumbs.recent_operations.length > 0) {
    lines.push(`### Last ${Math.min(crumbs.recent_operations.length, 15)} Operations`);
    const recentOps = crumbs.recent_operations.slice(-15).reverse();
    for (const op of recentOps) {
      const time = op.ts ? op.ts.split('T')[1]?.split('.')[0] || '' : '';
      const pathInfo = op.path ? ` → \`${op.path}\`` : '';
      const summaryInfo = op.summary ? ` — ${op.summary.substring(0, 100)}` : '';
      lines.push(`${time} | **${op.tool}** (${op.type})${pathInfo}${summaryInfo}`);
    }
    lines.push(``);
  }

  return lines.join('\n');
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

  // Read breadcrumbs (v3.0 — this is the fresh data)
  const breadcrumbs = readBreadcrumbs();
  const breadcrumbSection = formatBreadcrumbsForRecovery(breadcrumbs);

  // Find and read CxMS files
  const sessionFile = findFile(SESSION_FILE_PATTERNS);
  const tasksFile = findFile(TASKS_FILE_PATTERNS);

  const tldr = sessionFile ? readTLDR(sessionFile) : null;
  const checkpoint = sessionFile ? readLatestCheckpoint(sessionFile) : null;
  const activeTasks = tasksFile ? readActiveTasks(tasksFile) : null;

  // Get uncommitted file changes (cross-platform null device)
  const nullDev = process.platform === 'win32' ? '2>nul' : '2>/dev/null';

  let uncommittedFiles = null;
  try {
    uncommittedFiles = execSync(`git diff --name-only ${nullDev}`, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim() || null;
  } catch { /* ignore */ }

  // Also get untracked files (new files not yet committed)
  let untrackedFiles = null;
  try {
    untrackedFiles = execSync(`git ls-files --others --exclude-standard ${nullDev}`, {
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
    `**Hook version:** 3.0.0`,
    ``,
    `> This file was automatically saved by the CxMS PreCompact hook before context was compacted.`,
    `> Read this file to recover session state.`,
    ``,
    `---`,
    ``,
  ];

  // BREADCRUMBS FIRST — this is the freshest data
  if (breadcrumbSection) {
    recoveryLines.push(breadcrumbSection, `---`, ``);
  }

  // Session TL;DR (may be stale, but provides long-term context)
  if (tldr) {
    recoveryLines.push(`## Session State (from Session.md — may be stale)`, ``, tldr, ``, `---`, ``);
  }

  // Latest checkpoint (may be stale)
  if (checkpoint) {
    recoveryLines.push(`## Latest Checkpoint (from Session.md)`, ``, checkpoint, ``, `---`, ``);
  }

  // Active tasks
  if (activeTasks) {
    recoveryLines.push(`## Active Tasks`, ``, activeTasks, ``, `---`, ``);
  }

  // Uncommitted changes (combined modified + untracked)
  if (uncommittedFiles || untrackedFiles) {
    recoveryLines.push(`## Uncommitted Changes`, ``);
    if (uncommittedFiles) {
      recoveryLines.push(`### Modified`, '', '```', uncommittedFiles, '```', ``);
    }
    if (untrackedFiles) {
      // Cap untracked list at 30 entries
      const untrackedList = untrackedFiles.split('\n');
      const capped = untrackedList.slice(0, 30).join('\n');
      recoveryLines.push(`### Untracked (new files)`, '', '```', capped);
      if (untrackedList.length > 30) {
        recoveryLines.push(`... and ${untrackedList.length - 30} more`);
      }
      recoveryLines.push('```', ``);
    }
    recoveryLines.push(`---`, ``);
  }

  recoveryLines.push(
    `## Recovery Instructions`,
    ``,
    `1. Read this file to understand where the session was`,
    `2. The "Live Session Activity" section above is the MOST CURRENT data`,
    `3. Read the Session file for longer-term context: ${sessionFile ? path.basename(sessionFile) : 'PROJECT_Session.md'}`,
    `4. Read the Tasks file for pending work: ${tasksFile ? path.basename(tasksFile) : 'PROJECT_Tasks.md'}`,
    `5. Continue from the latest activity — prioritize breadcrumb data over stale checkpoints`,
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
    breadcrumbs_available: !!breadcrumbs,
    tool_count_at_compaction: breadcrumbs?.tool_count || null,
    files_modified_count: breadcrumbs?.files_modified?.length || 0,
    hook_version: '3.0.0',
  };

  let compactionLog = [];
  try {
    if (fs.existsSync(COMPACTION_LOG_FILE)) {
      let raw = fs.readFileSync(COMPACTION_LOG_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      const existing = JSON.parse(raw);
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
  if (breadcrumbs) {
    console.log(`[CxMS] Breadcrumbs captured: ${breadcrumbs.tool_count} tool calls, ${breadcrumbs.files_modified?.length || 0} files modified, ${breadcrumbs.files_read?.length || 0} files read.`);
  }
  if (sessionFile) {
    console.log(`[CxMS] Session file: ${path.basename(sessionFile)}`);
  }
  if (activeTasks) {
    console.log(`[CxMS] Active tasks preserved in recovery file.`);
  }
  console.log(`[CxMS] IMPORTANT: Read .claude/compaction-recovery.md to recover full session context.`);
}

main().catch(err => {
  // Hook must not crash — fail silently with a note
  console.error(`[CxMS Pre-Compact Hook Error] ${err.message}`);
}).finally(() => {
  // Force clean exit on Windows — without this, Node can linger
  // keeping the stdout pipe open, which blocks Claude Code's UI
  process.exit(0);
});
