#!/usr/bin/env node
/**
 * CxMS CLI - OpenCxMS Memory System
 *
 * Main entry point for the cxms command.
 *
 * Usage:
 *   cxms init [--lite|--standard|--max]  Initialize CxMS in current directory
 *   cxms templates                        Show templates location
 *   cxms version                          Show version
 *   cxms help                             Show help
 */

import { existsSync, readdirSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, '..');
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

// ANSI colors
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const VERSION = '1.6.0';

function showHelp() {
  console.log(`
${CYAN}${BOLD}CxMS${RESET} - OpenCxMS Memory System v${VERSION}

${BOLD}Usage:${RESET}
  cxms <command> [options]

${BOLD}Commands:${RESET}
  ${GREEN}init${RESET}        Initialize CxMS in current directory
              --lite      Minimal setup (CLAUDE.md, Session, Tasks)
              --standard  Standard setup (+ Context, Prompt History)
              --max       Full setup (all templates)
              --project   Project name (default: directory name)

  ${GREEN}templates${RESET}   Show templates directory location

  ${GREEN}version${RESET}     Show version information

  ${GREEN}help${RESET}        Show this help message

${BOLD}Related Commands:${RESET}
  ${CYAN}cxms-report${RESET}   Telemetry and feedback submission
  ${CYAN}cxms-profile${RESET}  Role-based profile management

${BOLD}Quick Start:${RESET}
  cd your-project
  cxms init --standard --project MyProject

${BOLD}Documentation:${RESET}
  https://github.com/RobSB2/CxMS
  https://opencxms.org
`);
}

function showVersion() {
  console.log(`CxMS v${VERSION}`);
  console.log(`Templates: ${TEMPLATES_DIR}`);
}

function showTemplates() {
  console.log(`${CYAN}Templates Location:${RESET} ${TEMPLATES_DIR}`);
  console.log('');

  const categories = ['core', 'logs', 'docs', 'multi-agent', 'multi-tool'];
  for (const cat of categories) {
    const catDir = join(TEMPLATES_DIR, cat);
    if (existsSync(catDir)) {
      const files = readdirSync(catDir).filter(f => f.endsWith('.template') || f.endsWith('.md'));
      if (files.length > 0) {
        console.log(`${GREEN}${cat}/${RESET}`);
        files.forEach(f => console.log(`  ${f}`));
        console.log('');
      }
    }
  }
}

function initProject(level, projectName) {
  const cwd = process.cwd();
  projectName = projectName || cwd.split(/[/\\]/).pop();

  console.log(`${CYAN}Initializing CxMS (${level}) for: ${projectName}${RESET}\n`);

  // Define files per level
  const levels = {
    lite: [
      'core/CLAUDE.md.template',
      'core/PROJECT_Session.md.template',
      'core/PROJECT_Tasks.md.template'
    ],
    standard: [
      'core/CLAUDE.md.template',
      'core/PROJECT_Session.md.template',
      'core/PROJECT_Tasks.md.template',
      'core/PROJECT_Context.md.template',
      'core/PROJECT_Prompt_History.md.template',
      'core/PROJECT_Approvals.md.template'
    ],
    max: [
      'core/CLAUDE.md.template',
      'core/PROJECT_Session.md.template',
      'core/PROJECT_Tasks.md.template',
      'core/PROJECT_Context.md.template',
      'core/PROJECT_Prompt_History.md.template',
      'core/PROJECT_Approvals.md.template',
      'logs/PROJECT_Activity_Log.md.template',
      'logs/PROJECT_Decision_Log.md.template',
      'logs/PROJECT_Issue_Log.md.template'
    ]
  };

  const files = levels[level] || levels.standard;
  let created = 0;
  let skipped = 0;

  for (const templatePath of files) {
    const srcPath = join(TEMPLATES_DIR, templatePath);
    const fileName = templatePath.split('/').pop().replace('.template', '').replace('PROJECT', projectName);
    const destPath = join(cwd, fileName);

    if (!existsSync(srcPath)) {
      console.log(`${YELLOW}⚠${RESET} Template not found: ${templatePath}`);
      continue;
    }

    if (existsSync(destPath)) {
      console.log(`${YELLOW}⊘${RESET} Skipped (exists): ${fileName}`);
      skipped++;
      continue;
    }

    try {
      let content = readFileSync(srcPath, 'utf8');
      // Replace [PROJECT] placeholders
      content = content.replace(/\[PROJECT\]/g, projectName);
      writeFileSync(destPath, content);
      console.log(`${GREEN}✓${RESET} Created: ${fileName}`);
      created++;
    } catch (err) {
      console.log(`${RED}✗${RESET} Error creating ${fileName}: ${err.message}`);
    }
  }

  console.log(`\n${GREEN}Done!${RESET} Created ${created} files, skipped ${skipped} existing.`);

  if (created > 0) {
    console.log(`\n${CYAN}Next steps:${RESET}`);
    console.log(`  1. Edit CLAUDE.md with your project details`);
    console.log(`  2. Start a session: "Read CLAUDE.md and ${projectName}_Session.md"`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      let level = 'standard';
      let projectName = null;

      if (args.includes('--lite')) level = 'lite';
      if (args.includes('--standard')) level = 'standard';
      if (args.includes('--max')) level = 'max';

      const projectIdx = args.indexOf('--project');
      if (projectIdx !== -1 && args[projectIdx + 1]) {
        projectName = args[projectIdx + 1];
      }

      await initProject(level, projectName);
      break;

    case 'templates':
      showTemplates();
      break;

    case 'version':
    case '-v':
    case '--version':
      showVersion();
      break;

    case 'help':
    case '-h':
    case '--help':
    default:
      showHelp();
      break;
  }
}

main().catch(console.error);
