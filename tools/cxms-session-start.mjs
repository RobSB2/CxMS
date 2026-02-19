#!/usr/bin/env node
/**
 * CxMS Session Start Hook (v4.0)
 *
 * Fires at session start. Outputs startup banner with required file list,
 * reads cross-repo coordination messages, clears stale breadcrumbs,
 * and registers this session in the coordination file for fleet awareness.
 *
 * v4.0: Total Recall v2 — Session ID support for cross-instance coordination.
 *   - Reads session_id from stdin (same pattern as session-end)
 *   - Per-session state file cleanup (doesn't destroy concurrent sessions)
 *   - Registers session in coordination file `active_sessions` array
 *   - Detects concurrent sessions on same project
 *   - Prunes stale sessions (completed >1hr, active >4hr)
 *   - Consolidated coordination read-modify-write (one operation, not two)
 *   - Mixed read_by format support (strings + objects)
 *   - Schema auto-migration 1.0 → 1.1
 *
 * Output: stdout (injected into Claude's initial context)
 *
 * Version: 4.0.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const CONFIG_FILE = path.join(CLAUDE_DIR, 'cxms-config.json');
const BREADCRUMBS_FILE = path.join(CLAUDE_DIR, 'session-breadcrumbs.json');
const STARTUP_STATE_FILE = path.join(CLAUDE_DIR, 'startup-state.json');
const RECOVERY_FILE = path.join(CLAUDE_DIR, 'compaction-recovery.md');

// Legacy state files (non-session-specific)
const LEGACY_STATE_FILES = [
  'compaction-gate.json',
  'context-check-state.json',
  'context-warn-state.json',
];

// ============================================
// UTILITIES
// ============================================

function readJson(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

function writeJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch { return false; }
}

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
// COORDINATION (consolidated read-modify-write)
// ============================================

function getUnreadMessages(coord, projectName) {
  if (!coord || !coord.messages) return [];
  return coord.messages.filter(msg => {
    const isTarget = msg.to && (msg.to.includes(projectName) || msg.to.includes('all'));
    // Handle mixed read_by: strings ("LPR") and objects ({project, session_id, read_at})
    const isUnread = !msg.read_by || !msg.read_by.some(entry =>
      typeof entry === 'string' ? entry === projectName : entry.project === projectName
    );
    return isTarget && isUnread;
  });
}

function checkForUpdates(coord, config) {
  if (!coord || !coord.latest_tool_version) return null;
  const local = config.tool_version || '0.0.0';
  const latest = coord.latest_tool_version;
  if (latest !== local) {
    return { local, latest };
  }
  return null;
}

function getInstanceSummaries(coord, projectName) {
  if (!coord || !coord.instances) return [];
  const summaries = [];
  for (const [name, inst] of Object.entries(coord.instances)) {
    if (name === projectName) continue;
    const lastSession = inst.last_session
      ? new Date(inst.last_session).toLocaleDateString()
      : 'never';
    summaries.push(`  ${name}: v${inst.tool_version || '?'} (last: ${lastSession})`);
  }
  return summaries;
}

/** Prune stale sessions from active_sessions. Returns pruned array. */
function pruneActiveSessions(sessions) {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const FOUR_HOURS = 4 * ONE_HOUR;

  return sessions.filter(s => {
    const lastActivity = new Date(s.last_activity || s.started).getTime();
    if (s.status === 'completed') {
      // Completed sessions: keep for 1 hour (recent reference), then drop
      return (now - lastActivity) < ONE_HOUR;
    }
    // Active sessions: safety net at 4 hours (stale/crashed)
    return (now - lastActivity) < FOUR_HOURS;
  });
}

/** Detect concurrent sessions on the same project (excluding this session). */
function detectConcurrentSessions(sessions, projectName, thisSessionId) {
  return sessions.filter(s =>
    s.project === projectName &&
    s.session_id !== thisSessionId &&
    s.status === 'active'
  );
}

/**
 * Consolidated coordination update on session start.
 * One read-modify-write: updates timestamp, registers session, prunes stale,
 * and returns data needed for banner output.
 */
function updateCoordinationOnStart(config, sessionId, hookInput) {
  const coordPath = config.coordination_file;
  if (!coordPath) return null;
  const resolved = coordPath.replace(/^~/, os.homedir());
  const coord = readJson(resolved);
  if (!coord) return null;

  const projectName = config.project_name;
  const now = new Date().toISOString();

  // Auto-migrate schema 1.0 → 1.1
  if (!coord.active_sessions) {
    coord.active_sessions = [];
    coord.schema_version = '1.1';
  }

  // Update instance timestamp
  if (coord.instances && coord.instances[projectName]) {
    coord.instances[projectName].last_session = now;
    coord.instances[projectName].cxms_version = config.cxms_version;
    coord.instances[projectName].tool_version = config.tool_version;
  }

  // Prune stale sessions
  coord.active_sessions = pruneActiveSessions(coord.active_sessions);

  // Register this session (or update if already exists from a restart)
  if (sessionId) {
    const existing = coord.active_sessions.findIndex(s => s.session_id === sessionId);
    const entry = {
      session_id: sessionId,
      project: projectName,
      started: now,
      last_activity: now,
      context_pct: null,
      model: hookInput.model || null,
      status: 'active',
    };
    if (existing >= 0) {
      coord.active_sessions[existing] = entry;
    } else {
      coord.active_sessions.push(entry);
    }
  }

  // Gather output data before writing
  const unread = getUnreadMessages(coord, projectName);
  const update = checkForUpdates(coord, config);
  const siblings = getInstanceSummaries(coord, projectName);
  const concurrent = sessionId
    ? detectConcurrentSessions(coord.active_sessions, projectName, sessionId)
    : [];

  // Write back
  coord.last_updated = now;
  writeJson(resolved, coord);

  return { unread, update, siblings, concurrent };
}

// ============================================
// STARTUP ENFORCEMENT
// ============================================

function createStartupState(requiredFiles) {
  if (!requiredFiles || requiredFiles.length === 0) return;
  const state = {
    complete: false,
    created_at: new Date().toISOString(),
    required_files: requiredFiles,
    read_files: [],
  };
  writeJson(STARTUP_STATE_FILE, state);
}

// ============================================
// CLEANUP
// ============================================

function clearStaleSessionState(sessionId) {
  // Fresh breadcrumbs for this session
  const freshCrumbs = {
    session_start: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    tool_count: 0,
    last_checkpoint_at: 0,
    files_modified: [],
    files_read: [],
    work_domains: [],
    recent_operations: [],
  };
  writeJson(BREADCRUMBS_FILE, freshCrumbs);

  // Clear THIS session's per-session state files (if session_id available)
  if (sessionId) {
    const perSessionFiles = [
      `compaction-gate-${sessionId}.json`,
      `context-check-state-${sessionId}.json`,
      `context-warn-state-${sessionId}.json`,
      `context-status-${sessionId}.json`,
    ];
    for (const name of perSessionFiles) {
      try {
        const f = path.join(CLAUDE_DIR, name);
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch { /* ignore */ }
    }
  }

  // Always clear legacy (non-suffixed) state files for backward compat.
  // These are safe to clear — if another session is using per-session files,
  // it won't read these. If it's using legacy files, it's already stale.
  for (const name of LEGACY_STATE_FILES) {
    try {
      const f = path.join(CLAUDE_DIR, name);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch { /* ignore */ }
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const output = [];

  // 0. Read hook input from stdin (session_id, etc.)
  let hookInput = {};
  try {
    const raw = await readStdinFast(100);
    if (raw) hookInput = JSON.parse(raw);
  } catch { /* ignore parse errors */ }

  const sessionId = hookInput.session_id || '';

  // 1. Read project config
  const config = readJson(CONFIG_FILE) || {
    project_name: path.basename(PROJECT_DIR),
    startup_required_reads: [],
    coordination_file: null,
  };

  const projectName = config.project_name || path.basename(PROJECT_DIR);

  // 2. Create startup enforcement gate
  const required = config.startup_required_reads || [];
  createStartupState(required);

  // 3. Clear stale session state (per-session + legacy files)
  clearStaleSessionState(sessionId);

  // 4. Banner header
  output.push(`[CxMS] ═══ SESSION START: ${projectName} ═══`);
  output.push('[CxMS] MEMORY.md is auto-loaded. Read CLAUDE.md next.');

  // 5. Required reads list (enforced by startup gate)
  if (required.length > 0) {
    output.push('[CxMS] ═══ STARTUP ENFORCEMENT ACTIVE ═══');
    output.push('[CxMS] You MUST read these files before any other work:');
    required.forEach((f, i) => {
      output.push(`[CxMS]   (${i + 1}) ${f}`);
    });
    output.push('[CxMS] Non-read tools will be BLOCKED until all files are read.');
  }

  // 6. Consolidated coordination: messages, updates, siblings, session registration
  const coordResult = updateCoordinationOnStart(config, sessionId, hookInput);
  if (coordResult) {
    const { unread, update, siblings, concurrent } = coordResult;

    if (unread.length > 0) {
      output.push('[CxMS] ═══ COORDINATION MESSAGES ═══');
      for (const msg of unread) {
        output.push(`[CxMS] From ${msg.from}: ${msg.subject}`);
        if (msg.body) output.push(`[CxMS]   ${msg.body}`);
      }
    }

    if (update) {
      output.push(`[CxMS] \u26a0 UPDATE AVAILABLE: Tools v${update.latest} (you have v${update.local})`);
      output.push('[CxMS]   Check the CxMS public repo for updated hook scripts.');
    }

    if (siblings.length > 0) {
      output.push('[CxMS] Sibling instances:');
      siblings.forEach(s => output.push(s));
    }

    // Concurrent session detection
    if (concurrent.length > 0) {
      output.push('[CxMS] ═══ CONCURRENT SESSIONS DETECTED ═══');
      for (const s of concurrent) {
        const age = Math.round((Date.now() - new Date(s.started).getTime()) / 60000);
        const ctx = s.context_pct != null ? `${s.context_pct}%` : '?%';
        output.push(`[CxMS]   ${s.project} session ${s.session_id.substring(0, 8)}... (age: ${age}min, ctx: ${ctx})`);
      }
      output.push('[CxMS]   Coordinate carefully — per-session isolation is active.');
    }
  }

  // 7. Compaction recovery check
  if (fs.existsSync(RECOVERY_FILE)) {
    output.push('[CxMS] ═══ COMPACTION RECOVERY AVAILABLE ═══');
    output.push('[CxMS] Recovery file exists at .claude/compaction-recovery.md -- READ IT NOW.');
  }

  // 8. MBR reference (project-specific)
  const mbrFile = path.join(PROJECT_DIR, 'drafts', 'OCF_Master_Context_Index.local.md');
  if (fs.existsSync(mbrFile)) {
    output.push('[CxMS] MBR (slim): OCF_Master_Context_Index.local.md (~120 lines)');
    output.push('[CxMS] Reference index: OCF_Master_Reference_Index.local.md (on demand only)');
  }

  console.log(output.join('\n'));
}

main().catch(err => {
  console.log('[CxMS] ═══ SESSION START ═══');
  console.log('[CxMS] MEMORY.md is auto-loaded. Read CLAUDE.md next.');
  console.log(`[CxMS] Session start hook error: ${err.message}`);
}).finally(() => {
  process.exit(0);
});
