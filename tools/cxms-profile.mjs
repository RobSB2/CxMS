#!/usr/bin/env node

/**
 * CxMS Profile Manager
 * Version: 1.1.0
 *
 * CLI tool for managing CxMS role-based deployment profiles.
 *
 * Usage:
 *   node cxms-profile.mjs list              # List available profiles
 *   node cxms-profile.mjs info <profile>    # Show profile details
 *   node cxms-profile.mjs install <profile> # Install profile globally
 *   node cxms-profile.mjs init [--profile]  # Initialize project with profile
 *   node cxms-profile.mjs export <profile> --format <fmt>  # Export to other AI tools
 *   node cxms-profile.mjs check             # Check for profile updates
 *   node cxms-profile.mjs status            # Show installed profiles
 *
 * Export Formats:
 *   cursorrules     - Cursor AI (.cursorrules)
 *   copilot         - GitHub Copilot (.github/copilot-instructions.md)
 *   windsurfrules   - Windsurf (.windsurfrules)
 *   aider           - Aider (CONVENTIONS.md)
 *   all             - All formats at once
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERSION = '1.1.0';
const CXMS_HOME = join(homedir(), '.cxms');
const PROFILES_HOME = join(CXMS_HOME, 'profiles');
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'profiles');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};

function log(msg) { console.log(msg); }
function success(msg) { console.log(`${colors.green}✓${colors.reset} ${msg}`); }
function warn(msg) { console.log(`${colors.yellow}!${colors.reset} ${msg}`); }
function error(msg) { console.log(`${colors.red}✗${colors.reset} ${msg}`); }
function heading(msg) { console.log(`\n${colors.bold}${msg}${colors.reset}`); }

/**
 * Load the MANIFEST.json from templates
 */
function loadManifest() {
  const manifestPath = join(TEMPLATES_DIR, 'MANIFEST.json');
  if (!existsSync(manifestPath)) {
    error(`Manifest not found at ${manifestPath}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(manifestPath, 'utf-8'));
}

/**
 * Get installed profile info
 */
function getInstalledProfile(profileId) {
  const installedPath = join(PROFILES_HOME, profileId, 'installed.json');
  if (existsSync(installedPath)) {
    return JSON.parse(readFileSync(installedPath, 'utf-8'));
  }
  return null;
}

/**
 * List available profiles
 */
function listProfiles() {
  const manifest = loadManifest();

  heading('Available CxMS Profiles');
  log('');

  for (const profile of manifest.profiles) {
    const installed = getInstalledProfile(profile.id);
    const status = installed ? `${colors.green}[installed]${colors.reset}` :
                   profile.status === 'planned' ? `${colors.dim}[planned]${colors.reset}` : '';

    log(`${colors.bold}${profile.id}${colors.reset} ${status}`);
    log(`  ${profile.name}`);
    log(`  ${colors.dim}${profile.description.split('.')[0]}.${colors.reset}`);

    if (profile.tools.global.length > 0) {
      log(`  Tools: ${profile.tools.global.join(', ')}`);
    }
    if (profile.tools.mcp_servers.length > 0) {
      log(`  MCP: ${profile.tools.mcp_servers.join(', ')}`);
    }
    log('');
  }

  log(`${colors.dim}Use 'cxms-profile info <profile>' for details${colors.reset}`);
  log(`${colors.dim}Use 'cxms-profile install <profile>' to install${colors.reset}`);
}

/**
 * Show profile details
 */
function showProfileInfo(profileId) {
  const manifest = loadManifest();
  const profile = manifest.profiles.find(p => p.id === profileId);

  if (!profile) {
    error(`Profile '${profileId}' not found`);
    log(`\nAvailable profiles: ${manifest.profiles.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  const installed = getInstalledProfile(profileId);

  heading(`Profile: ${profile.name}`);
  log('');
  log(`ID:          ${profile.id}`);
  log(`Status:      ${profile.status}${installed ? ' (installed)' : ''}`);
  log(`Description: ${profile.description}`);
  log('');

  heading('Tools');
  if (profile.tools.global.length > 0) {
    log(`Global npm packages: ${profile.tools.global.join(', ')}`);
  }
  if (profile.tools.mcp_servers.length > 0) {
    log(`MCP servers: ${profile.tools.mcp_servers.join(', ')}`);
  }
  if (profile.tools.anthropic_skills.length > 0) {
    log(`Anthropic skills: ${profile.tools.anthropic_skills.join(', ')}`);
  }
  log('');

  heading('Context Templates');
  log(`Recommended contexts: ${profile.contexts.join(', ')}`);
  log('');

  heading('Files');
  for (const file of profile.files) {
    log(`  - ${file}`);
  }
  log('');

  if (installed) {
    heading('Installation Info');
    log(`Installed: ${installed.installed_at}`);
    log(`Version:   ${installed.version}`);
    log(`Browsers:  ${installed.browsers_path}`);
  } else {
    log(`${colors.dim}Run 'cxms-profile install ${profileId}' to install${colors.reset}`);
  }
}

/**
 * Install a profile globally
 */
async function installProfile(profileId) {
  const manifest = loadManifest();
  const profile = manifest.profiles.find(p => p.id === profileId);

  if (!profile) {
    error(`Profile '${profileId}' not found`);
    process.exit(1);
  }

  if (profile.status === 'planned') {
    error(`Profile '${profileId}' is planned but not yet implemented`);
    process.exit(1);
  }

  const profileDir = join(TEMPLATES_DIR, profileId);
  const isWindows = process.platform === 'win32';
  const installScript = isWindows ? 'install.ps1' : 'install.sh';
  const scriptPath = join(profileDir, installScript);

  if (!existsSync(scriptPath)) {
    error(`Install script not found: ${scriptPath}`);
    process.exit(1);
  }

  heading(`Installing profile: ${profile.name}`);
  log('');
  log(`This will install:`);
  if (profile.tools.global.length > 0) {
    log(`  - Global tools: ${profile.tools.global.join(', ')}`);
  }
  if (profile.tools.mcp_servers.length > 0) {
    log(`  - MCP servers: ${profile.tools.mcp_servers.join(', ')}`);
  }
  log('');

  // Run the install script
  if (isWindows) {
    log(`Running: powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
    const child = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        copyProfileFiles(profileId, profile);
      } else {
        error(`Installation failed with code ${code}`);
        process.exit(code);
      }
    });
  } else {
    log(`Running: bash "${scriptPath}"`);
    const child = spawn('bash', [scriptPath], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        copyProfileFiles(profileId, profile);
      } else {
        error(`Installation failed with code ${code}`);
        process.exit(code);
      }
    });
  }
}

/**
 * Copy profile files to ~/.cxms/profiles
 */
function copyProfileFiles(profileId, profile) {
  const sourceDir = join(TEMPLATES_DIR, profileId);
  const destDir = join(PROFILES_HOME, profileId);

  // Ensure destination exists
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  // Copy key files
  const filesToCopy = ['SKILL.md', 'CLAUDE_EXTENSION.md', 'settings.json'];
  for (const file of filesToCopy) {
    const src = join(sourceDir, file);
    const dest = join(destDir, file);
    if (existsSync(src)) {
      copyFileSync(src, dest);
    }
  }

  success(`Profile files copied to ${destDir}`);
}

/**
 * Initialize a project with profile(s)
 */
function initProject(profiles) {
  const cxmsDir = join(process.cwd(), 'cxms');
  const profileJsonPath = join(cxmsDir, 'profile.json');

  // Create cxms directory
  if (!existsSync(cxmsDir)) {
    mkdirSync(cxmsDir, { recursive: true });
  }

  // Create or update profile.json
  let profileConfig = {
    profiles: [],
    merge_strategy: 'last-wins',
    overrides: {}
  };

  if (existsSync(profileJsonPath)) {
    profileConfig = JSON.parse(readFileSync(profileJsonPath, 'utf-8'));
  }

  // Add profiles
  for (const profileId of profiles) {
    if (!profileConfig.profiles.includes(profileId)) {
      profileConfig.profiles.push(profileId);
    }
  }

  writeFileSync(profileJsonPath, JSON.stringify(profileConfig, null, 2));
  success(`Created ${profileJsonPath}`);

  // Copy CLAUDE_EXTENSION files
  const manifest = loadManifest();
  let extensionContent = '# Profile Extensions\n\n';
  extensionContent += 'The following role-specific guidance has been loaded:\n\n';

  for (const profileId of profiles) {
    const profile = manifest.profiles.find(p => p.id === profileId);
    if (!profile) {
      warn(`Profile '${profileId}' not found, skipping`);
      continue;
    }

    const extensionPath = join(PROFILES_HOME, profileId, 'CLAUDE_EXTENSION.md');
    if (existsSync(extensionPath)) {
      const content = readFileSync(extensionPath, 'utf-8');
      extensionContent += `---\n\n## Profile: ${profile.name}\n\n`;
      extensionContent += content + '\n\n';
    } else {
      warn(`Extension not found for ${profileId}, is it installed?`);
    }
  }

  const localExtPath = join(cxmsDir, 'CLAUDE_EXTENSION.md');
  writeFileSync(localExtPath, extensionContent);
  success(`Created ${localExtPath}`);

  log('');
  log('Add this to your CLAUDE.md:');
  log('');
  log(`${colors.dim}## Profile Configuration${colors.reset}`);
  log(`${colors.dim}**Profiles:** ${profiles.join(', ')}${colors.reset}`);
  log(`${colors.dim}See ./cxms/CLAUDE_EXTENSION.md for role-specific guidance.${colors.reset}`);
}

/**
 * Show status of installed profiles
 */
function showStatus() {
  const manifest = loadManifest();

  heading('Installed Profiles');
  log('');

  let hasInstalled = false;
  for (const profile of manifest.profiles) {
    const installed = getInstalledProfile(profile.id);
    if (installed) {
      hasInstalled = true;
      log(`${colors.green}●${colors.reset} ${profile.id} v${installed.version}`);
      log(`  Installed: ${installed.installed_at}`);
      if (installed.tools) {
        log(`  Tools: ${Object.keys(installed.tools).join(', ')}`);
      }
      log('');
    }
  }

  if (!hasInstalled) {
    log('No profiles installed yet.');
    log(`\nRun 'cxms-profile list' to see available profiles.`);
  }
}

/**
 * Check for profile updates
 */
function checkUpdates() {
  const manifest = loadManifest();

  heading('Profile Update Check');
  log('');

  let updatesAvailable = false;
  for (const profile of manifest.profiles) {
    const installed = getInstalledProfile(profile.id);
    if (installed) {
      // In a real implementation, this would fetch remote version
      // For now, compare against manifest version in SKILL.md
      const skillPath = join(TEMPLATES_DIR, profile.id, 'SKILL.md');
      if (existsSync(skillPath)) {
        const skillContent = readFileSync(skillPath, 'utf-8');
        const versionMatch = skillContent.match(/profile_version:\s*["']?([^"'\n]+)/);
        const latestVersion = versionMatch ? versionMatch[1] : installed.version;

        if (latestVersion !== installed.version) {
          updatesAvailable = true;
          log(`${colors.yellow}↑${colors.reset} ${profile.id}: ${installed.version} → ${latestVersion}`);
        } else {
          log(`${colors.green}✓${colors.reset} ${profile.id}: ${installed.version} (current)`);
        }
      }
    }
  }

  log('');
  if (updatesAvailable) {
    log(`Run 'cxms-profile install <profile>' to update`);
  } else {
    log('All profiles are up to date.');
  }
}

/**
 * Export Formats Configuration
 */
const EXPORT_FORMATS = {
  cursorrules: {
    filename: '.cursorrules',
    description: 'Cursor AI rules file',
    outputDir: '.'
  },
  copilot: {
    filename: 'copilot-instructions.md',
    description: 'GitHub Copilot instructions',
    outputDir: '.github'
  },
  windsurfrules: {
    filename: '.windsurfrules',
    description: 'Windsurf AI rules file',
    outputDir: '.'
  },
  aider: {
    filename: 'CONVENTIONS.md',
    description: 'Aider conventions file',
    outputDir: '.'
  }
};

/**
 * Transform CLAUDE_EXTENSION.md content to Cursor rules format
 */
function transformToCursorRules(content, profile) {
  let output = [];

  // Header
  output.push(`# Cursor Rules - ${profile.name}`);
  output.push(`# Generated by CxMS Profile Export`);
  output.push(`# Profile: ${profile.id} v${profile.version || '1.0.0'}`);
  output.push('');

  // Extract role context
  const roleMatch = content.match(/## Role Context\s*\n([\s\S]*?)(?=\n## |$)/);
  if (roleMatch) {
    output.push('## Role');
    output.push('');
    output.push(roleMatch[1].trim());
    output.push('');
  }

  // Extract pre-approved operations as rules
  const opsMatch = content.match(/## Pre-Approved Operations\s*\n([\s\S]*?)(?=\n## |$)/);
  if (opsMatch) {
    output.push('## Approved Commands');
    output.push('');
    // Parse table and convert to bullet list
    const tableLines = opsMatch[1].split('\n').filter(l => l.includes('|') && !l.includes('---'));
    for (const line of tableLines.slice(1)) { // Skip header
      const cols = line.split('|').map(c => c.trim()).filter(c => c);
      if (cols.length >= 2) {
        // Remove existing backticks to avoid doubling
        const cmd = cols[1].replace(/`/g, '');
        output.push(`- ${cols[0]}: \`${cmd}\``);
      }
    }
    output.push('');
  }

  // Extract framework patterns
  const frameworkMatch = content.match(/## Framework-Specific Patterns\s*\n([\s\S]*?)(?=\n## |$)/);
  if (frameworkMatch) {
    output.push('## Framework Patterns');
    output.push('');
    output.push(frameworkMatch[1].trim());
    output.push('');
  }

  // Extract security checklist
  const securityMatch = content.match(/## Security Checklist\s*\n([\s\S]*?)(?=\n## |$)/);
  if (securityMatch) {
    output.push('## Security');
    output.push('');
    output.push(securityMatch[1].trim());
    output.push('');
  }

  // Extract quick reference
  const quickRefMatch = content.match(/## Quick Reference\s*\n([\s\S]*?)(?=\n## |$)/);
  if (quickRefMatch) {
    output.push('## Commands');
    output.push('');
    output.push(quickRefMatch[1].trim());
    output.push('');
  }

  return output.join('\n');
}

/**
 * Transform CLAUDE_EXTENSION.md content to GitHub Copilot instructions format
 */
function transformToCopilotInstructions(content, profile) {
  let output = [];

  // Header
  output.push(`# GitHub Copilot Instructions`);
  output.push('');
  output.push(`> Generated by CxMS Profile Export`);
  output.push(`> Profile: ${profile.name} (${profile.id})`);
  output.push('');

  // Extract role context
  const roleMatch = content.match(/## Role Context\s*\n([\s\S]*?)(?=\n## |$)/);
  if (roleMatch) {
    output.push('## Context');
    output.push('');
    output.push(roleMatch[1].trim());
    output.push('');
  }

  // Extract testing strategy
  const testMatch = content.match(/## Testing Strategy\s*\n([\s\S]*?)(?=\n## (?!.*Test)|$)/);
  if (testMatch) {
    output.push('## Testing');
    output.push('');
    // Simplify - remove ASCII art
    const simplified = testMatch[1].replace(/```[\s\S]*?```/g, '').trim();
    output.push(simplified);
    output.push('');
  }

  // Extract framework patterns
  const frameworkMatch = content.match(/## Framework-Specific Patterns\s*\n([\s\S]*?)(?=\n## |$)/);
  if (frameworkMatch) {
    output.push('## Coding Standards');
    output.push('');
    output.push(frameworkMatch[1].trim());
    output.push('');
  }

  // Extract security
  const securityMatch = content.match(/## Security Checklist\s*\n([\s\S]*?)(?=\n## |$)/);
  if (securityMatch) {
    output.push('## Security Requirements');
    output.push('');
    output.push(securityMatch[1].trim());
    output.push('');
  }

  // Extract performance
  const perfMatch = content.match(/## Performance Considerations\s*\n([\s\S]*?)(?=\n## |$)/);
  if (perfMatch) {
    output.push('## Performance');
    output.push('');
    output.push(perfMatch[1].trim());
    output.push('');
  }

  return output.join('\n');
}

/**
 * Transform CLAUDE_EXTENSION.md content to Windsurf rules format
 * Windsurf format is similar to Cursor
 */
function transformToWindsurfRules(content, profile) {
  let output = [];

  // Header
  output.push(`# Windsurf Rules`);
  output.push(`# Profile: ${profile.name}`);
  output.push(`# Generated by CxMS`);
  output.push('');

  // Role context
  const roleMatch = content.match(/## Role Context\s*\n([\s\S]*?)(?=\n## |$)/);
  if (roleMatch) {
    output.push('You are assisting with web development.');
    output.push('');
    output.push(roleMatch[1].trim());
    output.push('');
  }

  // Framework patterns as rules
  const frameworkMatch = content.match(/## Framework-Specific Patterns\s*\n([\s\S]*?)(?=\n## |$)/);
  if (frameworkMatch) {
    output.push('---');
    output.push('');
    output.push('## Code Style');
    output.push('');
    output.push(frameworkMatch[1].trim());
    output.push('');
  }

  // Security as rules
  const securityMatch = content.match(/## Security Checklist\s*\n([\s\S]*?)(?=\n## |$)/);
  if (securityMatch) {
    output.push('---');
    output.push('');
    output.push('## Security Rules');
    output.push('');
    output.push(securityMatch[1].trim());
    output.push('');
  }

  // Commands reference
  const quickRefMatch = content.match(/## Quick Reference\s*\n([\s\S]*?)(?=\n## |$)/);
  if (quickRefMatch) {
    output.push('---');
    output.push('');
    output.push('## Available Commands');
    output.push('');
    output.push(quickRefMatch[1].trim());
    output.push('');
  }

  return output.join('\n');
}

/**
 * Transform CLAUDE_EXTENSION.md content to Aider CONVENTIONS.md format
 */
function transformToAiderConventions(content, profile) {
  let output = [];

  // Header
  output.push(`# Project Conventions`);
  output.push('');
  output.push(`This file defines coding conventions for AI assistants.`);
  output.push(`Generated by CxMS from profile: ${profile.id}`);
  output.push('');

  // Role context becomes intro
  const roleMatch = content.match(/## Role Context\s*\n([\s\S]*?)(?=\n## |$)/);
  if (roleMatch) {
    output.push('## Overview');
    output.push('');
    output.push(roleMatch[1].trim());
    output.push('');
  }

  // Framework patterns
  const frameworkMatch = content.match(/## Framework-Specific Patterns\s*\n([\s\S]*?)(?=\n## |$)/);
  if (frameworkMatch) {
    output.push('## Code Conventions');
    output.push('');
    output.push(frameworkMatch[1].trim());
    output.push('');
  }

  // Testing
  const testMatch = content.match(/## Testing Strategy\s*\n([\s\S]*?)(?=\n## (?!.*Test)|$)/);
  if (testMatch) {
    output.push('## Testing Conventions');
    output.push('');
    const simplified = testMatch[1].replace(/```[\s\S]*?```/g, '').trim();
    output.push(simplified);
    output.push('');
  }

  // Security
  const securityMatch = content.match(/## Security Checklist\s*\n([\s\S]*?)(?=\n## |$)/);
  if (securityMatch) {
    output.push('## Security Conventions');
    output.push('');
    output.push(securityMatch[1].trim());
    output.push('');
  }

  return output.join('\n');
}

/**
 * Export a profile to specified format(s)
 */
function exportProfile(profileId, format, outputPath) {
  const manifest = loadManifest();
  const profile = manifest.profiles.find(p => p.id === profileId);

  if (!profile) {
    error(`Profile '${profileId}' not found`);
    log(`\nAvailable profiles: ${manifest.profiles.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  // Check if profile is installed or use template
  let extensionPath = join(PROFILES_HOME, profileId, 'CLAUDE_EXTENSION.md');
  if (!existsSync(extensionPath)) {
    extensionPath = join(TEMPLATES_DIR, profileId, 'CLAUDE_EXTENSION.md');
  }

  if (!existsSync(extensionPath)) {
    error(`CLAUDE_EXTENSION.md not found for profile '${profileId}'`);
    log(`Run 'cxms-profile install ${profileId}' first, or check if profile exists.`);
    process.exit(1);
  }

  const content = readFileSync(extensionPath, 'utf-8');
  const baseOutputPath = outputPath || process.cwd();

  // Determine which formats to export
  const formats = format === 'all' ? Object.keys(EXPORT_FORMATS) : [format];

  heading(`Exporting profile: ${profile.name}`);
  log('');

  for (const fmt of formats) {
    if (!EXPORT_FORMATS[fmt]) {
      error(`Unknown format: ${fmt}`);
      log(`Available formats: ${Object.keys(EXPORT_FORMATS).join(', ')}, all`);
      continue;
    }

    const formatConfig = EXPORT_FORMATS[fmt];
    let transformed;

    // Apply the appropriate transformer
    switch (fmt) {
      case 'cursorrules':
        transformed = transformToCursorRules(content, profile);
        break;
      case 'copilot':
        transformed = transformToCopilotInstructions(content, profile);
        break;
      case 'windsurfrules':
        transformed = transformToWindsurfRules(content, profile);
        break;
      case 'aider':
        transformed = transformToAiderConventions(content, profile);
        break;
    }

    // Determine output path
    const outputDir = join(baseOutputPath, formatConfig.outputDir);
    const outputFile = join(outputDir, formatConfig.filename);

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Write the file
    writeFileSync(outputFile, transformed);
    success(`${formatConfig.description}: ${outputFile}`);
  }

  log('');
  log(`${colors.dim}Files generated in: ${baseOutputPath}${colors.reset}`);
}

/**
 * Show help
 */
function showHelp() {
  log(`
${colors.bold}CxMS Profile Manager v${VERSION}${colors.reset}

${colors.bold}Usage:${colors.reset}
  cxms-profile <command> [options]

${colors.bold}Commands:${colors.reset}
  list                    List available profiles
  info <profile>          Show profile details
  install <profile>       Install profile globally
  init --profile <p1,p2>  Initialize project with profile(s)
  export <profile> --format <fmt>  Export profile to other AI tools
  status                  Show installed profiles
  check                   Check for profile updates
  help                    Show this help message

${colors.bold}Export Formats:${colors.reset}
  cursorrules             Cursor AI (.cursorrules)
  copilot                 GitHub Copilot (.github/copilot-instructions.md)
  windsurfrules           Windsurf (.windsurfrules)
  aider                   Aider (CONVENTIONS.md)
  all                     Export all formats at once

${colors.bold}Examples:${colors.reset}
  cxms-profile list
  cxms-profile install web-developer
  cxms-profile init --profile web-developer,technical-writer
  cxms-profile export web-developer --format cursorrules
  cxms-profile export web-developer --format all
  cxms-profile check

${colors.bold}Profile Location:${colors.reset}
  Global:  ~/.cxms/profiles/
  Project: ./cxms/profile.json

${colors.dim}Part of CxMS - Agent Context Management System${colors.reset}
`);
}

// Main entry point
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    listProfiles();
    break;

  case 'info':
    if (!args[1]) {
      error('Profile name required');
      log('Usage: cxms-profile info <profile>');
      process.exit(1);
    }
    showProfileInfo(args[1]);
    break;

  case 'install':
    if (!args[1]) {
      error('Profile name required');
      log('Usage: cxms-profile install <profile>');
      process.exit(1);
    }
    installProfile(args[1]);
    break;

  case 'init':
    const profileArg = args.find(a => a.startsWith('--profile'));
    let profiles = [];
    if (profileArg) {
      const idx = args.indexOf(profileArg);
      if (profileArg.includes('=')) {
        profiles = profileArg.split('=')[1].split(',');
      } else if (args[idx + 1]) {
        profiles = args[idx + 1].split(',');
      }
    }
    if (profiles.length === 0) {
      error('Profile(s) required');
      log('Usage: cxms-profile init --profile web-developer');
      process.exit(1);
    }
    initProject(profiles);
    break;

  case 'status':
    showStatus();
    break;

  case 'check':
    checkUpdates();
    break;

  case 'export':
    if (!args[1]) {
      error('Profile name required');
      log('Usage: cxms-profile export <profile> --format <format>');
      process.exit(1);
    }
    const exportProfileId = args[1];
    const formatArg = args.find(a => a.startsWith('--format'));
    let exportFormat = 'all';
    if (formatArg) {
      const idx = args.indexOf(formatArg);
      if (formatArg.includes('=')) {
        exportFormat = formatArg.split('=')[1];
      } else if (args[idx + 1]) {
        exportFormat = args[idx + 1];
      }
    }
    const outputArg = args.find(a => a.startsWith('--output'));
    let exportOutput = null;
    if (outputArg) {
      const idx = args.indexOf(outputArg);
      if (outputArg.includes('=')) {
        exportOutput = outputArg.split('=')[1];
      } else if (args[idx + 1]) {
        exportOutput = args[idx + 1];
      }
    }
    exportProfile(exportProfileId, exportFormat, exportOutput);
    break;

  case 'help':
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;

  default:
    error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
