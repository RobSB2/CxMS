#!/usr/bin/env node

/**
 * CxMS Profile Manager
 * Version: 1.0.0
 *
 * CLI tool for managing CxMS role-based deployment profiles.
 *
 * Usage:
 *   node cxms-profile.mjs list              # List available profiles
 *   node cxms-profile.mjs info <profile>    # Show profile details
 *   node cxms-profile.mjs install <profile> # Install profile globally
 *   node cxms-profile.mjs init [--profile]  # Initialize project with profile
 *   node cxms-profile.mjs check             # Check for profile updates
 *   node cxms-profile.mjs status            # Show installed profiles
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERSION = '1.0.0';
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
  status                  Show installed profiles
  check                   Check for profile updates
  help                    Show this help message

${colors.bold}Examples:${colors.reset}
  cxms-profile list
  cxms-profile install web-developer
  cxms-profile init --profile web-developer,technical-writer
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
