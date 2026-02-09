#!/usr/bin/env node
/**
 * CxMS Post-Install Script
 *
 * Welcomes users and configures telemetry consent.
 * Telemetry is opt-out by default (enabled unless user declines).
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import { createInterface } from 'readline';

const CXMS_DIR = join(homedir(), '.cxms');
const CONSENT_FILE = join(CXMS_DIR, 'telemetry-consent.json');

// ANSI colors
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function banner() {
  console.log(`
${CYAN}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ${BOLD}CxMS${RESET}${CYAN} - OpenCxMS Memory System              ║
║                                                            ║
║   Persistent memory for AI coding assistants               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${RESET}
`);
}

function showTelemetryInfo() {
  console.log(`${YELLOW}📊 Telemetry Notice${RESET}

CxMS collects anonymous usage data to improve the system:
  • Deployment level (Lite/Standard/Max)
  • Template usage counts
  • Enhancement requests
  • Session metrics (duration, compaction events)

${GREEN}What we DON'T collect:${RESET}
  • Project names or paths
  • Code or file contents
  • Personal information
  • IP addresses (not logged)

Dashboard: https://robsb2.github.io/CxMS/dashboard
`);
}

async function promptConsent() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    // Check if running in CI or non-interactive
    if (!process.stdin.isTTY) {
      console.log(`${GREEN}✓${RESET} Telemetry enabled by default (opt-out with: cxms-report --revoke)\n`);
      resolve(true);
      return;
    }

    rl.question(`${CYAN}Enable telemetry to help improve CxMS? [Y/n]:${RESET} `, (answer) => {
      rl.close();
      const declined = answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no';
      resolve(!declined);
    });
  });
}

function saveConsent(consented) {
  // Ensure directory exists
  if (!existsSync(CXMS_DIR)) {
    mkdirSync(CXMS_DIR, { recursive: true });
  }

  // Check for existing installation ID
  let installationId;
  if (existsSync(CONSENT_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(CONSENT_FILE, 'utf8'));
      installationId = existing.installation_id;
    } catch (e) {
      // Ignore parse errors
    }
  }

  const consent = {
    consented,
    installation_id: installationId || randomUUID(),
    consent_date: new Date().toISOString(),
    version: '1.6.0',
    source: 'npm-postinstall'
  };

  writeFileSync(CONSENT_FILE, JSON.stringify(consent, null, 2));
  return consent;
}

function showNextSteps() {
  console.log(`${GREEN}${BOLD}✓ Installation complete!${RESET}

${CYAN}Quick Start:${RESET}
  1. Copy templates to your project:
     ${BOLD}cxms init${RESET}              # Interactive setup
     ${BOLD}cxms init --lite${RESET}       # Minimal (3 files)
     ${BOLD}cxms init --standard${RESET}   # Standard (5 files)
     ${BOLD}cxms init --max${RESET}        # Full (all templates)

  2. Or manually copy from:
     ${BOLD}cxms templates${RESET}         # Show templates location

${CYAN}Commands:${RESET}
  ${BOLD}cxms${RESET}                      # Show help
  ${BOLD}cxms-report${RESET}               # Submit telemetry
  ${BOLD}cxms-report --status${RESET}      # Check telemetry status
  ${BOLD}cxms-profile${RESET}              # Manage role profiles

${CYAN}Documentation:${RESET}
  https://github.com/RobSB2/CxMS
  https://opencxms.org
`);
}

async function main() {
  banner();
  showTelemetryInfo();

  const consented = await promptConsent();
  const consent = saveConsent(consented);

  if (consented) {
    console.log(`${GREEN}✓${RESET} Telemetry enabled. Thank you for helping improve CxMS!`);
    console.log(`  Installation ID: ${consent.installation_id.slice(0, 8)}...`);
  } else {
    console.log(`${YELLOW}✓${RESET} Telemetry disabled. You can enable anytime with: cxms-report --consent`);
  }

  console.log('');
  showNextSteps();
}

main().catch(console.error);
