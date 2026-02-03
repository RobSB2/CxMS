#!/usr/bin/env node

/**
 * cxms-cascade.mjs - Cascading Configuration Manager
 * Version: 1.0.0
 *
 * Manages CSS-like cascading configuration for AI agent config files.
 * Supports inheritance from GLOBAL → WORKSPACE → PROJECT levels.
 *
 * Usage:
 *   node cxms-cascade.mjs show              # Show effective (merged) config
 *   node cxms-cascade.mjs chain             # Show inheritance chain
 *   node cxms-cascade.mjs enable            # Enable cascading on existing project
 *   node cxms-cascade.mjs validate          # Validate config syntax
 *   node cxms-cascade.mjs init              # Initialize with inheritance prompt
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

const VERSION = '1.0.0';

// Configuration file names by tool
const TOOL_CONFIGS = {
  'claude-code': 'CLAUDE.md',
  'cursor': '.cursorrules',
  'copilot': '.github/copilot-instructions.md',
  'windsurf': '.windsurfrules',
  'aider': 'CONVENTIONS.md'
};

// Section marker regex
const SECTION_MARKER_REGEX = /^##\s*\[?(REQUIRED|INHERIT|OVERRIDE|DEFAULT)?\]?\s*(.+)$/;
const HEADER_REGEX = /<!--\s*@cxms-config\s*([\s\S]*?)-->/;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function c(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

// ============================================================================
// Config Discovery
// ============================================================================

function getGlobalConfigDir() {
  return path.join(os.homedir(), '.cxms');
}

function getGlobalConfigPath(tool = 'claude-code') {
  return path.join(getGlobalConfigDir(), TOOL_CONFIGS[tool] || 'CLAUDE.md');
}

function findWorkspaceRoot(startDir) {
  let current = startDir;
  const root = path.parse(current).root;

  while (current !== root) {
    // Check for .git directory (git repo root)
    if (fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    // Check for .cxms directory (explicit CxMS workspace marker)
    if (fs.existsSync(path.join(current, '.cxms', 'config.json'))) {
      return current;
    }
    current = path.dirname(current);
  }

  return null;
}

function discoverConfigChain(projectDir, tool = 'claude-code') {
  const configFile = TOOL_CONFIGS[tool] || 'CLAUDE.md';
  const chain = [];

  // 1. Global config
  const globalPath = getGlobalConfigPath(tool);
  if (fs.existsSync(globalPath)) {
    chain.push({
      level: 'GLOBAL',
      path: globalPath,
      exists: true
    });
  } else {
    chain.push({
      level: 'GLOBAL',
      path: globalPath,
      exists: false
    });
  }

  // 2. Workspace config
  const workspaceRoot = findWorkspaceRoot(projectDir);
  if (workspaceRoot && workspaceRoot !== projectDir) {
    const workspacePath = path.join(workspaceRoot, configFile);
    chain.push({
      level: 'WORKSPACE',
      path: workspacePath,
      exists: fs.existsSync(workspacePath)
    });
  }

  // 3. Project config
  const projectPath = path.join(projectDir, configFile);
  chain.push({
    level: 'PROJECT',
    path: projectPath,
    exists: fs.existsSync(projectPath)
  });

  return chain;
}

// ============================================================================
// Config Parsing
// ============================================================================

function parseConfigHeader(content) {
  const match = content.match(HEADER_REGEX);
  if (!match) {
    return { inherits: 'auto' }; // Default to auto inheritance
  }

  const headerContent = match[1];
  const config = {};

  // Parse key: value pairs
  const lines = headerContent.split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      config[key.trim()] = valueParts.join(':').trim();
    }
  }

  return config;
}

function parseConfigSections(content) {
  const sections = [];
  const lines = content.split('\n');

  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const match = line.match(/^##\s*(\[(?:REQUIRED|INHERIT|OVERRIDE|DEFAULT)\])?\s*(.+)$/);

    if (match) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }

      // Start new section
      const marker = match[1] ? match[1].replace(/[\[\]]/g, '') : 'DEFAULT';
      const title = match[2].trim();

      currentSection = {
        marker,
        title,
        fullHeader: line,
        content: ''
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

function parseConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const header = parseConfigHeader(content);
  const sections = parseConfigSections(content);

  return {
    path: filePath,
    content,
    header,
    sections
  };
}

// ============================================================================
// Config Merging
// ============================================================================

function mergeTable(parentTable, childTable) {
  // Parse markdown tables and merge by first column (key)
  const parseTable = (text) => {
    const rows = {};
    const lines = text.split('\n').filter(l => l.startsWith('|'));

    if (lines.length < 2) return rows;

    // Skip header and separator
    for (let i = 2; i < lines.length; i++) {
      const cols = lines[i].split('|').map(c => c.trim()).filter(c => c);
      if (cols.length >= 2) {
        rows[cols[0]] = cols.slice(1);
      }
    }
    return rows;
  };

  const parentRows = parseTable(parentTable);
  const childRows = parseTable(childTable);

  // Merge: child overwrites parent for same keys
  return { ...parentRows, ...childRows };
}

function mergeList(parentList, childList) {
  // Extract list items and merge
  const extractItems = (text) => {
    return text.split('\n')
      .filter(l => l.match(/^[-*]\s/))
      .map(l => l.replace(/^[-*]\s+/, '').trim());
  };

  const parentItems = extractItems(parentList);
  const childItems = extractItems(childList);

  // Deduplicate while preserving order
  const seen = new Set();
  const merged = [];

  for (const item of [...parentItems, ...childItems]) {
    if (!seen.has(item)) {
      seen.add(item);
      merged.push(item);
    }
  }

  return merged;
}

function mergeSections(parentSections, childSections) {
  const result = [];
  const processed = new Set();

  // First, process parent sections
  for (const parent of parentSections) {
    const child = childSections.find(s => s.title === parent.title);

    if (parent.marker === 'REQUIRED') {
      // Cannot be overridden
      result.push({
        ...parent,
        source: 'parent (locked)',
        locked: true
      });
      processed.add(parent.title);
    } else if (child) {
      // Child has same section
      if (child.marker === 'OVERRIDE' || parent.marker === 'DEFAULT') {
        // Child replaces parent
        result.push({
          ...child,
          source: 'child (override)'
        });
      } else if (child.marker === 'INHERIT' || parent.marker === 'INHERIT') {
        // Merge content
        const mergedContent = parent.content + '\n\n---\n\n' + child.content;
        result.push({
          ...parent,
          content: mergedContent,
          source: 'merged'
        });
      } else {
        // Default: child wins
        result.push({
          ...child,
          source: 'child'
        });
      }
      processed.add(parent.title);
    } else {
      // Only in parent
      result.push({
        ...parent,
        source: 'parent'
      });
      processed.add(parent.title);
    }
  }

  // Add child-only sections
  for (const child of childSections) {
    if (!processed.has(child.title)) {
      result.push({
        ...child,
        source: 'child (new)'
      });
    }
  }

  return result;
}

function mergeConfigs(configs) {
  // configs is array from GLOBAL to PROJECT (least to most specific)
  const validConfigs = configs.filter(c => c !== null);

  if (validConfigs.length === 0) {
    return null;
  }

  if (validConfigs.length === 1) {
    return validConfigs[0];
  }

  // Merge progressively
  let merged = validConfigs[0];

  for (let i = 1; i < validConfigs.length; i++) {
    const child = validConfigs[i];

    // Check if child opts out of inheritance
    if (child.header.inherits === 'none') {
      merged = child;
      continue;
    }

    // Merge sections
    const mergedSections = mergeSections(merged.sections, child.sections);

    merged = {
      path: child.path,
      header: { ...merged.header, ...child.header },
      sections: mergedSections,
      sources: [...(merged.sources || [merged.path]), child.path]
    };
  }

  return merged;
}

// ============================================================================
// Commands
// ============================================================================

function showChain(projectDir = process.cwd()) {
  console.log(c('bright', '\nConfiguration Inheritance Chain'));
  console.log('='.repeat(50));
  console.log();

  const chain = discoverConfigChain(projectDir);

  console.log(`${'Level'.padEnd(12)} ${'Location'.padEnd(50)} Status`);
  console.log(`${'-'.repeat(12)} ${'-'.repeat(50)} ${'-'.repeat(10)}`);

  for (const item of chain) {
    const status = item.exists ? c('green', '✓ Found') : c('dim', '✗ Not found');
    const pathDisplay = item.path.length > 48
      ? '...' + item.path.slice(-45)
      : item.path;
    console.log(`${item.level.padEnd(12)} ${pathDisplay.padEnd(50)} ${status}`);
  }

  console.log();

  // Show section summary for found configs
  const foundConfigs = chain.filter(c => c.exists);
  if (foundConfigs.length > 0) {
    console.log(c('bright', 'Sections by source:'));
    console.log();

    for (const item of foundConfigs) {
      const config = parseConfig(item.path);
      if (config && config.sections.length > 0) {
        console.log(`  ${c('cyan', item.level)}:`);
        for (const section of config.sections.slice(0, 5)) {
          const marker = section.marker !== 'DEFAULT' ? c('yellow', `[${section.marker}]`) : '';
          console.log(`    - ${section.title} ${marker}`);
        }
        if (config.sections.length > 5) {
          console.log(`    ${c('dim', `... and ${config.sections.length - 5} more`)}`);
        }
      }
    }
  }

  console.log();
}

function showEffective(projectDir = process.cwd()) {
  console.log(c('bright', '\n# Effective Configuration'));
  console.log(c('dim', `# Generated: ${new Date().toISOString()}`));

  const chain = discoverConfigChain(projectDir);
  const configs = chain.map(c => c.exists ? parseConfig(c.path) : null);
  const merged = mergeConfigs(configs.filter(c => c !== null));

  if (!merged) {
    console.log(c('red', '\nNo configuration files found.'));
    console.log('Run `cxms cascade init` to create one.');
    return;
  }

  const sources = merged.sources || [merged.path];
  console.log(c('dim', `# Sources: ${sources.map(s => path.basename(path.dirname(s))).join(' → ')}`));
  console.log();

  // Output merged sections
  for (const section of merged.sections) {
    const markerDisplay = section.marker !== 'DEFAULT' ? `[${section.marker}] ` : '';
    console.log(`## ${markerDisplay}${section.title}`);

    if (section.source) {
      console.log(c('dim', `<!-- Source: ${section.source} -->`));
    }
    if (section.locked) {
      console.log(c('yellow', '<!-- LOCKED: Cannot be overridden -->'));
    }
    console.log();
    console.log(section.content);
    console.log();
  }
}

function auditConfig(projectDir = process.cwd()) {
  console.log(c('bright', '\n╔════════════════════════════════════════════════════════════╗'));
  console.log(c('bright', '║           CxMS Configuration Audit Report                  ║'));
  console.log(c('bright', '╚════════════════════════════════════════════════════════════╝'));
  console.log();
  console.log(c('dim', `Generated: ${new Date().toISOString()}`));
  console.log(c('dim', `Project: ${projectDir}`));
  console.log();

  const chain = discoverConfigChain(projectDir);
  const configs = chain.filter(c => c.exists).map(c => ({
    ...c,
    config: parseConfig(c.path)
  }));

  if (configs.length === 0) {
    console.log(c('red', 'No configuration files found.'));
    return;
  }

  // Build section map across all configs
  const sectionMap = new Map(); // title -> [{level, marker, content, path}]

  for (const { level, path: configPath, config } of configs) {
    for (const section of config.sections) {
      if (!sectionMap.has(section.title)) {
        sectionMap.set(section.title, []);
      }
      sectionMap.get(section.title).push({
        level,
        marker: section.marker,
        content: section.content,
        path: configPath
      });
    }
  }

  // Analyze conflicts and overrides
  const conflicts = [];
  const overrides = [];
  const inherited = [];
  const locked = [];
  const unique = [];

  for (const [title, occurrences] of sectionMap) {
    if (occurrences.length === 1) {
      unique.push({ title, ...occurrences[0] });
      continue;
    }

    // Multiple occurrences - check for conflicts
    const hasRequired = occurrences.some(o => o.marker === 'REQUIRED');
    const hasOverride = occurrences.some(o => o.marker === 'OVERRIDE');
    const hasInherit = occurrences.some(o => o.marker === 'INHERIT');

    // REQUIRED in parent, child tries to override
    const requiredParent = occurrences.find(o => o.marker === 'REQUIRED' && o.level !== 'PROJECT');
    const childVersion = occurrences.find(o => o.level === 'PROJECT');

    if (requiredParent && childVersion && childVersion.marker !== 'INHERIT') {
      conflicts.push({
        title,
        type: 'REQUIRED_OVERRIDE_ATTEMPT',
        parent: requiredParent,
        child: childVersion,
        message: `Child attempts to override REQUIRED section`
      });
      locked.push({ title, ...requiredParent });
    } else if (hasRequired) {
      locked.push({ title, ...occurrences.find(o => o.marker === 'REQUIRED') });
    } else if (hasOverride) {
      const child = occurrences.find(o => o.marker === 'OVERRIDE');
      const parent = occurrences.find(o => o.level !== child.level);
      overrides.push({
        title,
        child,
        parent,
        message: `Child OVERRIDES parent`
      });
    } else if (hasInherit) {
      inherited.push({
        title,
        sources: occurrences
      });
    } else {
      // Default behavior - child wins
      const child = occurrences[occurrences.length - 1];
      const parent = occurrences[0];
      overrides.push({
        title,
        child,
        parent,
        message: `Child replaces parent (default behavior)`
      });
    }
  }

  // Report: Config Sources
  console.log(c('bright', '┌─ Configuration Sources ─────────────────────────────────────┐'));
  console.log();
  for (const { level, path: configPath, config } of configs) {
    const sectionCount = config.sections.length;
    const markers = config.sections.reduce((acc, s) => {
      acc[s.marker] = (acc[s.marker] || 0) + 1;
      return acc;
    }, {});
    const markerSummary = Object.entries(markers).map(([k, v]) => `${k}:${v}`).join(', ');

    console.log(`  ${c('cyan', level.padEnd(10))} ${configPath}`);
    console.log(`             ${c('dim', `${sectionCount} sections (${markerSummary})`)}`);
  }
  console.log();

  // Report: Conflicts (ERRORS)
  if (conflicts.length > 0) {
    console.log(c('red', '┌─ ⛔ CONFLICTS (Errors) ──────────────────────────────────────┐'));
    console.log();
    for (const conflict of conflicts) {
      console.log(`  ${c('red', '✗')} ${c('bright', conflict.title)}`);
      console.log(`    ${c('red', conflict.message)}`);
      console.log(`    ${c('dim', 'Parent:')} ${conflict.parent.level} [${conflict.parent.marker}]`);
      console.log(`    ${c('dim', 'Child:')}  ${conflict.child.level} [${conflict.child.marker}]`);
      console.log();
    }
  }

  // Report: Locked Sections
  if (locked.length > 0) {
    console.log(c('yellow', '┌─ 🔒 LOCKED Sections (Cannot Override) ──────────────────────┐'));
    console.log();
    for (const section of locked) {
      console.log(`  ${c('yellow', '⚡')} ${c('bright', section.title)}`);
      console.log(`    ${c('dim', 'Source:')} ${section.level}`);
      console.log(`    ${c('dim', 'Preview:')} ${section.content.substring(0, 80).replace(/\n/g, ' ')}...`);
      console.log();
    }
  }

  // Report: Overrides
  if (overrides.length > 0) {
    console.log(c('magenta', '┌─ ⬆️  OVERRIDES (Child Replaces Parent) ─────────────────────┐'));
    console.log();
    for (const override of overrides) {
      console.log(`  ${c('magenta', '↳')} ${c('bright', override.title)}`);
      console.log(`    ${c('dim', 'Winner:')} ${override.child.level} [${override.child.marker}]`);
      console.log(`    ${c('dim', 'Hidden:')} ${override.parent.level} [${override.parent.marker}]`);

      // Show what's different
      const parentPreview = override.parent.content.substring(0, 60).replace(/\n/g, ' ');
      const childPreview = override.child.content.substring(0, 60).replace(/\n/g, ' ');
      console.log(`    ${c('dim', 'Was:')} "${parentPreview}..."`);
      console.log(`    ${c('dim', 'Now:')} "${childPreview}..."`);
      console.log();
    }
  }

  // Report: Inherited (Merged)
  if (inherited.length > 0) {
    console.log(c('green', '┌─ 🔗 INHERITED (Merged Sections) ────────────────────────────┐'));
    console.log();
    for (const section of inherited) {
      console.log(`  ${c('green', '+')} ${c('bright', section.title)}`);
      console.log(`    ${c('dim', 'Sources:')} ${section.sources.map(s => s.level).join(' + ')}`);
      console.log();
    }
  }

  // Report: Unique Sections
  if (unique.length > 0) {
    console.log(c('blue', '┌─ 📄 UNIQUE Sections (Single Source) ────────────────────────┐'));
    console.log();
    const byLevel = {};
    for (const section of unique) {
      if (!byLevel[section.level]) byLevel[section.level] = [];
      byLevel[section.level].push(section.title);
    }
    for (const [level, titles] of Object.entries(byLevel)) {
      console.log(`  ${c('cyan', level)}:`);
      for (const title of titles) {
        console.log(`    - ${title}`);
      }
    }
    console.log();
  }

  // Summary
  console.log(c('bright', '┌─ Summary ────────────────────────────────────────────────────┐'));
  console.log();
  console.log(`  Total sections across all configs: ${sectionMap.size}`);
  console.log(`  ${c('red', `Conflicts: ${conflicts.length}`)}`);
  console.log(`  ${c('yellow', `Locked (REQUIRED): ${locked.length}`)}`);
  console.log(`  ${c('magenta', `Overrides: ${overrides.length}`)}`);
  console.log(`  ${c('green', `Inherited (merged): ${inherited.length}`)}`);
  console.log(`  ${c('blue', `Unique: ${unique.length}`)}`);
  console.log();

  if (conflicts.length > 0) {
    console.log(c('red', '  ⛔ Configuration has conflicts that should be resolved!'));
    console.log(c('dim', '     Child configs cannot override [REQUIRED] sections.'));
  } else {
    console.log(c('green', '  ✓ No conflicts detected'));
  }

  console.log();

  return {
    conflicts,
    overrides,
    inherited,
    locked,
    unique
  };
}

function validateConfig(projectDir = process.cwd()) {
  console.log(c('bright', '\nValidating Configuration'));
  console.log('='.repeat(50));
  console.log();

  const chain = discoverConfigChain(projectDir);
  let hasErrors = false;
  let hasWarnings = false;

  for (const item of chain) {
    if (!item.exists) continue;

    console.log(`${c('cyan', item.level)}: ${item.path}`);

    const config = parseConfig(item.path);

    // Check for valid header
    if (!config.content.includes('@cxms-config')) {
      console.log(c('yellow', '  ⚠ No @cxms-config header found (using defaults)'));
      hasWarnings = true;
    }

    // Check sections
    let hasRequired = false;
    let sectionCount = 0;

    for (const section of config.sections) {
      sectionCount++;

      if (section.marker === 'REQUIRED') {
        hasRequired = true;
      }

      // Check for empty sections
      if (!section.content.trim()) {
        console.log(c('yellow', `  ⚠ Empty section: ${section.title}`));
        hasWarnings = true;
      }
    }

    console.log(c('green', `  ✓ ${sectionCount} sections parsed`));

    if (item.level === 'GLOBAL' && !hasRequired) {
      console.log(c('dim', '  ℹ Consider adding [REQUIRED] sections for critical directives'));
    }

    console.log();
  }

  // Check for inheritance issues
  const foundConfigs = chain.filter(c => c.exists);
  if (foundConfigs.length > 1) {
    console.log(c('bright', 'Inheritance check:'));

    const projectConfig = parseConfig(chain[chain.length - 1].path);
    if (projectConfig && projectConfig.header.inherits === 'none') {
      console.log(c('yellow', '  ⚠ Project config has inherits: none - parent configs ignored'));
      hasWarnings = true;
    } else {
      console.log(c('green', '  ✓ Cascading enabled'));
    }
    console.log();
  }

  // Summary
  if (hasErrors) {
    console.log(c('red', '✗ Validation failed with errors'));
    process.exit(1);
  } else if (hasWarnings) {
    console.log(c('yellow', '⚠ Validation passed with warnings'));
  } else {
    console.log(c('green', '✓ Validation passed'));
  }
}

async function enableCascading(projectDir = process.cwd()) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log(c('bright', '\nEnabling Cascading Configuration'));
  console.log('='.repeat(50));
  console.log();

  const chain = discoverConfigChain(projectDir);
  const projectConfig = chain[chain.length - 1];

  if (!projectConfig.exists) {
    console.log(c('red', 'No project CLAUDE.md found.'));
    console.log('Run `cxms cascade init` to create one with cascading.');
    rl.close();
    return;
  }

  // Show found parent configs
  const parents = chain.filter(c => c.exists && c.level !== 'PROJECT');

  if (parents.length === 0) {
    console.log(c('yellow', 'No parent configs found to inherit from.'));
    console.log('You can create a global config at: ' + getGlobalConfigPath());
    rl.close();
    return;
  }

  console.log('Found parent configs:');
  for (const p of parents) {
    console.log(`  ${c('green', '├──')} ${p.path} (${p.level})`);
  }
  console.log();

  // Read current config
  const config = parseConfig(projectConfig.path);

  // Check if already has cascading header
  if (config.content.includes('@cxms-config')) {
    console.log(c('yellow', 'This config already has a @cxms-config header.'));
    const proceed = await question('Overwrite inheritance settings? (y/n) ');
    if (proceed.toLowerCase() !== 'y') {
      rl.close();
      return;
    }
  }

  // Ask inheritance preference
  console.log('\nInheritance mode:');
  console.log('  (a) auto - inherit all parent configs [Recommended]');
  console.log('  (b) none - standalone, no inheritance');

  const mode = await question('\nChoice (a/b): ');
  const inherits = mode.toLowerCase() === 'b' ? 'none' : 'auto';

  // Build new header
  const header = `<!--
@cxms-config
inherits: ${inherits}
version: 1.0
updated: ${new Date().toISOString().split('T')[0]}
-->

`;

  // Update file
  let newContent = config.content;

  if (config.content.includes('@cxms-config')) {
    // Replace existing header
    newContent = config.content.replace(HEADER_REGEX, header.trim());
  } else {
    // Add header after first line (title)
    const lines = config.content.split('\n');
    const titleEnd = lines.findIndex((l, i) => i > 0 && l.startsWith('#')) || 1;
    lines.splice(titleEnd, 0, '', header.trim(), '');
    newContent = lines.join('\n');
  }

  fs.writeFileSync(projectConfig.path, newContent);

  console.log(c('green', '\n✓ Updated ' + projectConfig.path));
  console.log(`  Inheritance: ${inherits}`);
  console.log('\nRun `cxms cascade show` to see effective config.');

  rl.close();
}

async function initWithCascade(projectDir = process.cwd()) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log(c('bright', '\nCxMS Project Initialization'));
  console.log('='.repeat(50));
  console.log();

  // Check for existing config
  const configPath = path.join(projectDir, 'CLAUDE.md');
  if (fs.existsSync(configPath)) {
    console.log(c('yellow', 'CLAUDE.md already exists in this directory.'));
    const proceed = await question('Run `cxms cascade enable` instead? (y/n) ');
    if (proceed.toLowerCase() === 'y') {
      rl.close();
      await enableCascading(projectDir);
      return;
    }
    rl.close();
    return;
  }

  // Discover parent configs
  const chain = discoverConfigChain(projectDir);
  const parents = chain.filter(c => c.exists && c.level !== 'PROJECT');

  console.log(c('bright', '[1] Configuration Inheritance\n'));

  if (parents.length > 0) {
    console.log('    Detected parent configs:');
    for (const p of parents) {
      const config = parseConfig(p.path);
      const sectionSummary = config.sections.slice(0, 3).map(s => s.title).join(', ');
      console.log(`    ${c('green', '├──')} ${p.path} (${p.level})`);
      console.log(`    │   └── ${c('dim', sectionSummary)}`);
    }
    console.log();
    console.log('    How should this project inherit?');
    console.log();
    console.log('    > (a) Full cascade - inherit all parents [Recommended]');
    console.log('      (b) None - standalone project');
  } else {
    console.log('    No parent configs found.');
    console.log('    Creating standalone configuration.');
  }

  const inheritChoice = parents.length > 0
    ? await question('\n    Choice (a/b): ')
    : 'b';

  const inherits = inheritChoice.toLowerCase() === 'b' ? 'none' : 'auto';

  // Ask for project name
  const projectName = path.basename(projectDir);
  console.log(c('bright', '\n[2] Project Details\n'));
  const name = await question(`    Project name [${projectName}]: `) || projectName;

  // Create config
  const configContent = `# CLAUDE.md

<!--
@cxms-config
inherits: ${inherits}
version: 1.0
created: ${new Date().toISOString().split('T')[0]}
-->

**Project:** ${name}
**CxMS Version:** 1.6
**Deployment Level:** Standard

---

## [OVERRIDE] Project Overview

This is the ${name} project.

---

## [INHERIT] Session Requirements

${inherits === 'auto' ? '<!-- Inherits from parent configs -->' : `Before ending, update ${name}_Session.md with:
- What was accomplished
- Current state
- Next steps`}

---

## [DEFAULT] Development Notes

Add project-specific notes here.
`;

  fs.writeFileSync(configPath, configContent);

  console.log(c('green', '\n✓ Created CLAUDE.md'));
  console.log(`  Inheritance: ${inherits}`);

  if (inherits === 'auto') {
    console.log('\nRun `cxms cascade show` to see effective config.');
  }

  rl.close();
}

// ============================================================================
// Main
// ============================================================================

function showHelp() {
  console.log(`
${c('bright', 'cxms-cascade')} - Cascading Configuration Manager v${VERSION}

${c('bright', 'USAGE')}
  node cxms-cascade.mjs <command> [options]

${c('bright', 'COMMANDS')}
  show              Show effective (merged) configuration
  chain             Show inheritance chain and sources
  audit             Audit configs: conflicts, overrides, locked sections
  enable            Enable cascading on existing project
  init              Initialize new project with cascading
  validate          Validate configuration syntax

${c('bright', 'OPTIONS')}
  --help, -h        Show this help
  --version, -v     Show version
  --dir <path>      Project directory (default: current)

${c('bright', 'EXAMPLES')}
  # Show merged config for current directory
  node cxms-cascade.mjs show

  # Show inheritance chain
  node cxms-cascade.mjs chain

  # Audit for conflicts and overrides (recommended on startup)
  node cxms-cascade.mjs audit

  # Enable cascading on existing project
  node cxms-cascade.mjs enable

  # Initialize new project
  cd my-project && node cxms-cascade.mjs init

${c('bright', 'HIERARCHY')}
  GLOBAL     ~/.cxms/CLAUDE.md
  WORKSPACE  {repo-root}/CLAUDE.md
  PROJECT    {project}/CLAUDE.md

${c('bright', 'SECTION MARKERS')}
  [REQUIRED]  Cannot be overridden by child configs
  [INHERIT]   Merge with parent (additive)
  [OVERRIDE]  Replace parent section entirely
  [DEFAULT]   Can be overridden (default behavior)
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`cxms-cascade v${VERSION}`);
    return;
  }

  // Parse --dir option
  let projectDir = process.cwd();
  const dirIndex = args.indexOf('--dir');
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    projectDir = path.resolve(args[dirIndex + 1]);
  }

  const command = args[0];

  switch (command) {
    case 'show':
      showEffective(projectDir);
      break;
    case 'chain':
      showChain(projectDir);
      break;
    case 'audit':
      auditConfig(projectDir);
      break;
    case 'enable':
      await enableCascading(projectDir);
      break;
    case 'init':
      await initWithCascade(projectDir);
      break;
    case 'validate':
      validateConfig(projectDir);
      break;
    default:
      console.log(c('red', `Unknown command: ${command}`));
      console.log('Run with --help for usage.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(c('red', 'Error: ' + err.message));
  process.exit(1);
});
