#!/usr/bin/env node
/**
 * CxMS Session Start Hook (v1.0)
 *
 * Fires at session start. Creates startup enforcement state,
 * reads cross-repo coordination messages, and outputs startup banner.
 *
 * Actions:
 *   1. Read .claude/cxms-config.json for project settings
 *   2. Create .claude/startup-state.json (complete: false, required files list)
 *   3. Clear stale session breadcrumbs from previous session
 *   4. Read coordination file, output pending messages + update alerts
 *   5. Output startup banner with required file list
 *   6. Check for compaction recovery (existing behavior)
 *
 * Output: stdout (injected into Claude's initial context)
 *
 * Version: 1.0.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const CONFIG_FILE = path.join(CLAUDE_DIR, 'cxms-config.json');
const STARTUP_STATE_FILE = path.join(CLAUDE_DIR, 'startup-state.json');
const BREADCRUMBS_FILE = path.join(CLAUDE_DIR, 'session-breadcrumbs.json');
const COMPACTION_GATE_FILE = path.join(CLAUDE_DIR, 'compaction-gate.json');
const RECOVERY_FILE = path.join(CLAUDE_DIR, 'compaction-recovery.md');

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
// STARTUP STATE
// ============================================

function createStartupState(config) {
  const required = config.startup_required_reads || [];
  const state = {
    complete: required.length === 0,
    created_at: new Date().toISOString(),
    required_files: required,
    files_read: [],
    remaining: [...required],
  };
  writeJson(STARTUP_STATE_FILE, state);
  return state;
}

// ============================================
// COORDINATION
// ============================================

function readCoordination(config) {
  const coordPath = config.coordination_file;
  if (!coordPath) return null;

  // Resolve ~ to home directory
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
// CLEANUP
// ============================================

function clearStaleBreadcrumbs() {
  // Reset breadcrumbs for fresh session tracking
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

  // 2. Create startup enforcement state
  const startupState = createStartupState(config);

  // 3. Clear stale breadcrumbs
  clearStaleBreadcrumbs();

  // 4. Banner header
  output.push(`[CxMS] ═══ SESSION START: ${projectName} ═══`);
  output.push('[CxMS] MEMORY.md is auto-loaded. Read CLAUDE.md next.');

  // 5. Startup enforcement notice
  if (startupState.remaining.length > 0) {
    output.push('[CxMS] ═══ STARTUP ENFORCEMENT ACTIVE ═══');
    output.push('[CxMS] You MUST read these files before any other work:');
    startupState.remaining.forEach((f, i) => {
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
      output.push('[CxMS]   Check the CxMS public repo for updated hook scripts.');
    }

    if (siblings.length > 0) {
      output.push('[CxMS] Sibling instances:');
      siblings.forEach(s => output.push(s));
    }

    // Update our timestamp in the coordination file
    updateCoordinationTimestamp(config);
  }

  // 7. Compaction recovery check (existing behavior)
  if (fs.existsSync(RECOVERY_FILE)) {
    output.push('[CxMS] ═══ COMPACTION RECOVERY AVAILABLE ═══');
    output.push('[CxMS] Recovery file exists at .claude/compaction-recovery.md -- READ IT NOW.');
  }

  // Output everything
  console.log(output.join('\n'));
}

try {
  main();
} catch (err) {
  // Fallback: minimal banner if anything fails
  console.log('[CxMS] ═══ SESSION START ═══');
  console.log('[CxMS] MEMORY.md is auto-loaded. Read CLAUDE.md next.');
  console.log(`[CxMS] Session start hook error: ${err.message}`);
}
