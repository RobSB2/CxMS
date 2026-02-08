#!/usr/bin/env node
/**
 * CxMS Memory Bridge (v1.0)
 *
 * Bridges CxMS session state into Claude Code's native memory system.
 * Claude Code auto-loads the first 200 lines of MEMORY.md at every session
 * start -- zero tool calls needed, the model just HAS it.
 *
 * This module provides shared functions for SessionEnd and PreCompact hooks
 * to write curated session state into MEMORY.md.
 *
 * Memory Structure (all fits in ~80 lines, well under 200 limit):
 *
 *   ## Project          -- Static identity (paths, entity, founder)
 *   ## Last Session     -- Auto-updated by hooks (most recent session state)
 *   ## Pending Tasks    -- Auto-updated from Tasks.md
 *   ## Key Decisions    -- Curated (user adds via /remember, hooks preserve)
 *   ## Persistent Facts -- Curated (user adds via /remember, hooks preserve)
 *
 * Version: 1.0.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// ============================================
// PATH RESOLUTION
// ============================================

/**
 * Compute Claude Code's memory directory for a project.
 * Claude Code stores memory at: ~/.claude/projects/<slug>/memory/
 * where <slug> is the project path with : and \ replaced by -
 *
 * Example: C:\Users\Rob\AI\Project -> C--Users-Rob-AI-Project
 */
export function getMemoryDir(projectDir) {
  const slug = projectDir
    .replace(/[:\\/]/g, '-')
    .replace(/^-/, '');

  return path.join(os.homedir(), '.claude', 'projects', slug, 'memory');
}

/**
 * Get the full path to MEMORY.md for a project.
 */
export function getMemoryPath(projectDir) {
  return path.join(getMemoryDir(projectDir), 'MEMORY.md');
}

// ============================================
// MEMORY READ/WRITE
// ============================================

/**
 * Read MEMORY.md and parse it into sections keyed by ## headers.
 * Returns { sections: Map<header, content>, raw: string }
 */
export function readMemory(memoryPath) {
  const result = { sections: new Map(), raw: '' };

  if (!fs.existsSync(memoryPath)) return result;

  const content = fs.readFileSync(memoryPath, 'utf-8');
  result.raw = content;

  const lines = content.split('\n');
  let currentHeader = '_preamble';
  let currentLines = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentLines.length > 0 || currentHeader !== '_preamble') {
        result.sections.set(currentHeader, currentLines.join('\n'));
      }
      currentHeader = line;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  // Save last section
  if (currentLines.length > 0 || currentHeader !== '_preamble') {
    result.sections.set(currentHeader, currentLines.join('\n'));
  }

  return result;
}

/**
 * Write MEMORY.md from sections map, preserving order.
 * Auto-managed sections (Last Session, Pending Tasks) are updated.
 * User-curated sections (Key Decisions, Persistent Facts) are preserved.
 */
export function writeMemory(memoryPath, sections) {
  const memoryDir = path.dirname(memoryPath);
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  const parts = [];
  for (const [header, content] of sections) {
    if (header === '_preamble') {
      parts.push(content);
    } else {
      parts.push(header);
      parts.push(content);
    }
  }

  fs.writeFileSync(memoryPath, parts.join('\n'), 'utf-8');
}

// ============================================
// SECTION BUILDERS
// ============================================

/**
 * Build the static Project section.
 * Only created on first run -- never overwritten.
 */
export function buildProjectSection(projectDir) {
  // Read session/tasks file names from config if available
  let sessionFile = 'PROJECT_Session.md';
  let tasksFile = 'PROJECT_Tasks.md';
  try {
    const configPath = path.join(projectDir, '.claude', 'cxms-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      sessionFile = config.session_file || sessionFile;
      tasksFile = config.tasks_file || tasksFile;
    }
  } catch { /* ignore */ }

  return [
    '',
    '- **Session file:** ' + sessionFile,
    '- **Tasks file:** ' + tasksFile,
    '- **Project dir:** ' + projectDir,
    '',
  ].join('\n');
}

/**
 * Build the Last Session section from hook data.
 * Called by SessionEnd and PreCompact hooks.
 */
export function buildLastSessionSection(data) {
  const lines = [''];

  lines.push('**Updated:** ' + new Date().toISOString());

  if (data.ctxPct != null) {
    lines.push('**Context:** ' + data.ctxPct + '%' +
      (data.model ? ' | **Model:** ' + data.model : ''));
  }

  if (data.trigger) {
    lines.push('**Trigger:** ' + data.trigger);
  }

  if (data.reason) {
    lines.push('**Exit:** ' + data.reason);
  }

  if (data.currentTask) {
    lines.push('**Last task:** ' + data.currentTask);
  }

  if (data.accomplished && data.accomplished.length > 0) {
    lines.push('');
    lines.push('**Accomplished:**');
    for (const item of data.accomplished.slice(0, 8)) {
      lines.push('- ' + item);
    }
  }

  if (data.filesModified && data.filesModified.length > 0) {
    lines.push('');
    lines.push('**Files:** ' + data.filesModified.slice(0, 10).join(', '));
  }

  if (data.resumeHint) {
    lines.push('');
    lines.push('**Resume:** ' + data.resumeHint);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Build Pending Tasks section from Tasks.md.
 */
export function buildPendingTasksSection(tasksFilePath) {
  if (!tasksFilePath || !fs.existsSync(tasksFilePath)) return null;

  try {
    const content = fs.readFileSync(tasksFilePath, 'utf-8');
    const lines = content.split('\n');
    const tasks = [];

    let capturing = false;
    for (const line of lines) {
      if (line.includes('## Active Tasks') || line.includes('## Pending')) {
        capturing = true;
        continue;
      }
      if (capturing) {
        if (line.startsWith('## Completed') || line.startsWith('## Task Template')) break;
        if (line.startsWith('### TASK-')) {
          const statusLine = lines[lines.indexOf(line) + 1] || '';
          const priorityLine = lines[lines.indexOf(line) + 2] || '';
          const status = statusLine.match(/\*\*Status:\*\*\s*(.*)/)?.[1] || '';
          const priority = priorityLine.match(/\*\*Priority:\*\*\s*(.*)/)?.[1] || '';
          const taskName = line.replace('### ', '');
          tasks.push('- ' + taskName + (priority ? ' (' + priority + ')' : '') +
            (status ? ' -- ' + status : ''));
        }
        if (tasks.length >= 5) break;
      }
    }

    if (tasks.length === 0) return null;
    return '\n' + tasks.join('\n') + '\n';
  } catch {
    return null;
  }
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

/**
 * Update MEMORY.md with current session state.
 * Preserves user-curated sections, updates auto-managed sections.
 *
 * @param {string} projectDir - Project root directory
 * @param {object} sessionData - Data for Last Session section
 * @param {string|null} tasksFilePath - Path to Tasks.md (optional)
 */
export function updateMemory(projectDir, sessionData, tasksFilePath) {
  const memoryPath = getMemoryPath(projectDir);
  const memory = readMemory(memoryPath);
  const sections = memory.sections;

  // Ensure preamble exists
  if (!sections.has('_preamble')) {
    const projName = path.basename(projectDir);
    sections.set('_preamble', '# CxMS Memory: ' + projName + '\n');
  }

  // Ensure Project section exists (only created on first run)
  if (!sections.has('## Project')) {
    sections.set('## Project', buildProjectSection(projectDir));
  }

  // Always update Last Session
  sections.set('## Last Session', buildLastSessionSection(sessionData));

  // Update Pending Tasks if we have a tasks file
  const tasksContent = buildPendingTasksSection(tasksFilePath);
  if (tasksContent) {
    sections.set('## Pending Tasks', tasksContent);
  }

  // Ensure user-curated sections exist (create empty if missing)
  if (!sections.has('## Key Decisions')) {
    sections.set('## Key Decisions', '\n*Add decisions here with /remember or by editing this file.*\n');
  }
  if (!sections.has('## Persistent Facts')) {
    sections.set('## Persistent Facts', '\n*Add persistent facts here with /remember or by editing this file.*\n');
  }

  // Enforce section order
  const orderedSections = new Map();
  const sectionOrder = [
    '_preamble',
    '## Project',
    '## Last Session',
    '## Pending Tasks',
    '## Key Decisions',
    '## Persistent Facts',
  ];

  for (const key of sectionOrder) {
    if (sections.has(key)) {
      orderedSections.set(key, sections.get(key));
    }
  }

  // Append any extra sections the user added (preserve unknown sections)
  for (const [key, val] of sections) {
    if (!orderedSections.has(key)) {
      orderedSections.set(key, val);
    }
  }

  writeMemory(memoryPath, orderedSections);
  return memoryPath;
}
