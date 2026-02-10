#!/usr/bin/env node
/**
 * CxMS Session Start Hook (v3.0)
 *
 * Fires at session start. Outputs startup banner with required file list,
 * reads cross-repo coordination messages, and clears stale breadcrumbs.
 * Creates startup-state.json gate for enforcement by PostToolUse tracker
 * and PreToolUse blocker.
 *
 * v3.0: Restored startup-state.json creation for hard enforcement.
 *   PostToolUse(^Read$) tracks progress; PreToolUse(^Write|Edit|Bash$) blocks
 *   until all required files are read. Performance: ~80ms total overhead
 *   via matcher-based filtering and 100ms resolve-on-first-chunk stdin.
 *
 * Output: stdout (injected into Claude's initial context)
 *
 * Version: 3.0.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const CONFIG_FILE = path.join(CLAUDE_DIR, 'cxms-config.json');
const BREADCRUMBS_FILE = path.join(CLAUDE_DIR, 'session-breadcrumbs.json');
const COMPACTION_GATE_FILE = path.join(CLAUDE_DIR, 'compaction-gate.json');
const RECOVERY_FILE = path.join(CLAUDE_DIR, 'compaction-recovery.md');
const STARTUP_STATE_FILE = path.join(CLAUDE_DIR, 'startup-state.json');

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

// ============================================
// COORDINATION
// ============================================

function readCoordination(config) {
  const coordPath = config.coordination_file;
  if (!coordPath) return null;
  const resolved = coordPath.replace(/^~/, os.homedir());
  return readJson(resolved);
}

function getUnreadMessages(coord, projectName) {
  if (!coord || !coord.messages) return [];
  return coord.messages.filter(msg => {
    const isTarget = msg.to && (msg.to.includes(projectName) || msg.to.includes('all'));
    const isUnread = !msg.read_by || !msg.read_by.includes(projectName);
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

function updateCoordinationTimestamp(config) {
  const coordPath = config.coordination_file;
  if (!coordPath) return;
  const resolved = coordPath.replace(/^~/, os.homedir());
  const coord = readJson(resolved);
  if (!coord || !coord.instances) return;

  const projectName = config.project_name;
  if (coord.instances[projectName]) {
    coord.instances[projectName].last_session = new Date().toISOString();
    coord.instances[projectName].cxms_version = config.cxms_version;
    coord.instances[projectName].tool_version = config.tool_version;
    coord.last_updated = new Date().toISOString();
    writeJson(resolved, coord);
  }
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

function clearStaleBreadcrumbs() {
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

  // Clear compaction gate from previous session
  try {
    if (fs.existsSync(COMPACTION_GATE_FILE)) {
      fs.unlinkSync(COMPACTION_GATE_FILE);
    }
  } catch { /* ignore */ }
}

// ============================================
// MAIN
// ============================================

function main() {
  const output = [];

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

  // 3. Clear stale breadcrumbs
  clearStaleBreadcrumbs();

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

  // 6. Coordination: messages and updates
  const coord = readCoordination(config);
  if (coord) {
    const unread = getUnreadMessages(coord, projectName);
    const update = checkForUpdates(coord, config);
    const siblings = getInstanceSummaries(coord, projectName);

    if (unread.length > 0) {
      output.push('[CxMS] ═══ COORDINATION MESSAGES ═══');
      for (const msg of unread) {
        output.push(`[CxMS] From ${msg.from}: ${msg.subject}`);
        if (msg.body) output.push(`[CxMS]   ${msg.body}`);
      }
    }

    if (update) {
      output.push(`[CxMS] ⚠ UPDATE AVAILABLE: Tools v${update.latest} (you have v${update.local})`);
      output.push('[CxMS]   Check the public CxMS repo for updated hook scripts.');
    }

    if (siblings.length > 0) {
      output.push('[CxMS] Sibling instances:');
      siblings.forEach(s => output.push(s));
    }

    updateCoordinationTimestamp(config);
  }

  // 7. Compaction recovery check
  if (fs.existsSync(RECOVERY_FILE)) {
    output.push('[CxMS] ═══ COMPACTION RECOVERY AVAILABLE ═══');
    output.push('[CxMS] Recovery file exists at .claude/compaction-recovery.md -- READ IT NOW.');
  }

  console.log(output.join('\n'));
}

try {
  main();
} catch (err) {
  console.log('[CxMS] ═══ SESSION START ═══');
  console.log('[CxMS] MEMORY.md is auto-loaded. Read CLAUDE.md next.');
  console.log(`[CxMS] Session start hook error: ${err.message}`);
} finally {
  process.exit(0);
}
