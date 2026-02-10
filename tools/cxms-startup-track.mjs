#!/usr/bin/env node
/**
 * CxMS Startup Read Tracker (v1.1)
 *
 * PostToolUse hook -- matcher: ^Read$
 * Tracks which required startup files have been read. When all are done,
 * marks startup-state.json complete and emits confirmation via additionalContext.
 *
 * Fast paths:
 *   - No state file → exit immediately (~1ms)
 *   - State already complete → exit immediately (~5ms)
 *   - Read doesn't match required file → exit (~10ms)
 * Slow path:
 *   - Match + update state → ~15ms
 *
 * IMPORTANT: stdin must be consumed IMMEDIATELY at module load (before any
 * file I/O) to avoid pipe data loss on Windows. The stdinPromise is started
 * at the top level and awaited only when needed.
 *
 * Input (stdin): JSON from Claude Code PostToolUse event
 * Output (stdout): JSON with optional additionalContext
 *
 * Version: 1.1.0
 */

import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const STATE_FILE = path.join(CLAUDE_DIR, 'startup-state.json');

// ============================================
// STDIN: Start consuming IMMEDIATELY (before any file I/O)
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

// Start stdin read NOW -- before main() does any file I/O
const stdinPromise = readStdinFast(100);

// ============================================
// MAIN
// ============================================

async function main() {
  // Fast path: no state file → nothing to track
  if (!fs.existsSync(STATE_FILE)) return;

  // Read state
  let state;
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch { return; }

  // Fast path: already complete
  if (state.complete) return;

  // Await the stdin data (already being consumed since module load)
  let hookInput = {};
  try {
    const raw = await stdinPromise;
    if (raw) hookInput = JSON.parse(raw);
  } catch { return; }

  const toolInput = hookInput.tool_input || {};
  const filePath = toolInput.file_path || '';

  if (!filePath) return;

  // Normalize: extract just the filename for matching
  const fileName = path.basename(filePath);
  const requiredFiles = state.required_files || [];
  const readFiles = state.read_files || [];

  // Check if this file matches any required file not yet read
  const matchIndex = requiredFiles.findIndex(rf =>
    !readFiles.includes(rf) && fileName === path.basename(rf)
  );

  if (matchIndex === -1) return; // Not a required file or already read

  // Update state: mark this file as read
  readFiles.push(requiredFiles[matchIndex]);
  state.read_files = readFiles;

  const remaining = requiredFiles.filter(rf => !readFiles.includes(rf));

  if (remaining.length === 0) {
    // All required files read — mark complete
    state.complete = true;
    state.completed_at = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');

    // Emit confirmation
    process.stdout.write(JSON.stringify({
      additionalContext: '[CxMS] All startup files read. Enforcement gate lifted. Proceed normally.'
    }) + '\n');
  } else {
    // Save progress
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');

    process.stdout.write(JSON.stringify({
      additionalContext: `[CxMS] Startup progress: ${readFiles.length}/${requiredFiles.length} files read. Remaining: ${remaining.join(', ')}`
    }) + '\n');
  }
}

main().catch(() => {}).finally(() => {
  process.exit(0);
});
