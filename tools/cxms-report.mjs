#!/usr/bin/env node
/**
 * CxMS Telemetry Reporter
 *
 * Collects anonymous usage metrics from CxMS projects to help improve the system.
 *
 * Usage:
 *   node cxms-report.mjs              # Default mode
 *   node cxms-report.mjs --dry-run    # Preview without sending
 *   node cxms-report.mjs --full       # Comprehensive survey
 *   node cxms-report.mjs --help       # Show help
 *
 * Version: 1.0.0
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import https from 'https';
import crypto from 'crypto';
import os from 'os';

// ============================================
// CONFIGURATION
// ============================================

const CLIENT_VERSION = '1.0.0';
const SUPABASE_URL = 'https://pubuchklneufckmvatmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1YnVjaGtsbmV1ZmNrbXZhdG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDE1NDUsImV4cCI6MjA4NDg3NzU0NX0.K3xZJ5zi8xoJvEWTnGvLIlxkSu5ecpsslKICcXpTM2A';

// CxMS file patterns
const CXMS_FILES = {
  claude_md: { exact: 'CLAUDE.md' },
  session_md: { suffix: '_Session.md' },
  tasks_md: { suffix: '_Tasks.md' },
  context_md: { suffix: '_Context.md' },
  prompt_history_md: { suffix: '_Prompt_History.md' },
  activity_log_md: { suffix: '_Activity_Log.md' },
  decision_log_md: { suffix: '_Decision_Log.md' },
  issue_log_md: { suffix: '_Issue_Log.md' },
  deployment_md: { suffix: '_Deployment.md' },
  performance_log_md: { suffix: '_Performance_Log.md' },
  compaction_log_md: { suffix: '_Compaction_Log.md' },
  plan_md: { suffix: '_Plan.md' },
  inventory_md: { suffix: '_Inventory.md' },
  strategy_md: { suffix: '_Strategy.md' },
  exceptions_md: { suffix: '_Exceptions.md' },
  prompt_library_md: { suffix: '_Prompt_Library.md' },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(msg) {
  console.log(msg);
}

function logSection(title) {
  log(`\n${'─'.repeat(50)}`);
  log(`  ${title}`);
  log('─'.repeat(50));
}

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function askChoice(question, options) {
  log(question);
  options.forEach((opt, i) => log(`  ${i + 1}. ${opt}`));
  const answer = await ask('Enter number (or press Enter to skip): ');
  const idx = parseInt(answer) - 1;
  if (idx >= 0 && idx < options.length) {
    return options[idx];
  }
  return null;
}

function getOrCreateInstallationId(cwd) {
  const cxmsDir = path.join(cwd, '.cxms');
  const idFile = path.join(cxmsDir, '.telemetry_id');

  if (fs.existsSync(idFile)) {
    return fs.readFileSync(idFile, 'utf-8').trim();
  }

  const id = crypto.randomUUID();

  if (!fs.existsSync(cxmsDir)) {
    fs.mkdirSync(cxmsDir, { recursive: true });
  }

  fs.writeFileSync(idFile, id);

  // Add to .gitignore if exists
  const gitignore = path.join(cwd, '.gitignore');
  if (fs.existsSync(gitignore)) {
    const content = fs.readFileSync(gitignore, 'utf-8');
    if (!content.includes('.cxms/.telemetry_id')) {
      fs.appendFileSync(gitignore, '\n# CxMS telemetry ID (anonymous)\n.cxms/.telemetry_id\n');
    }
  }

  return id;
}

function getSubmissionNumber(cwd) {
  const countFile = path.join(cwd, '.cxms', '.submission_count');
  let count = 1;

  if (fs.existsSync(countFile)) {
    count = parseInt(fs.readFileSync(countFile, 'utf-8').trim()) + 1;
  }

  fs.writeFileSync(countFile, count.toString());
  return count;
}

// ============================================
// FILE DISCOVERY
// ============================================

function discoverFiles(cwd) {
  const found = {};
  const allFiles = fs.readdirSync(cwd);

  for (const [key, pattern] of Object.entries(CXMS_FILES)) {
    if (pattern.exact) {
      if (allFiles.includes(pattern.exact)) {
        found[key] = path.join(cwd, pattern.exact);
      }
    } else if (pattern.suffix) {
      const match = allFiles.find(f => f.endsWith(pattern.suffix));
      if (match) {
        found[key] = path.join(cwd, match);
      }
    }
  }

  return found;
}

// ============================================
// DATA EXTRACTION
// ============================================

function extractFromClaudeMd(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return {};

  const content = fs.readFileSync(filepath, 'utf-8');
  const data = {};

  // Extract version
  const versionMatch = content.match(/\*\*Version:\*\*\s*(\d+\.?\d*)/);
  if (versionMatch) data.cxms_version = versionMatch[1];

  // Extract deployment level
  const levelMatch = content.match(/\*\*Deployment Level:\*\*\s*(\w+)/);
  if (levelMatch) data.deployment_level = levelMatch[1];

  return data;
}

function extractFromSessionMd(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return {};

  const content = fs.readFileSync(filepath, 'utf-8');
  const data = {
    session_count: 0,
    has_tldr: false,
    has_metrics: false,
    dates: [],
  };

  // Count sessions
  const sessionMatches = content.match(/##\s*Session\s*\d+/gi);
  if (sessionMatches) data.session_count = sessionMatches.length;

  // Check for TL;DR
  data.has_tldr = /##\s*TL;?DR/i.test(content);

  // Check for metrics section
  data.has_metrics = /##\s*Session\s*Metrics/i.test(content);

  // Extract dates (various formats)
  const datePatterns = [
    /\d{4}-\d{2}-\d{2}/g,  // 2026-01-24
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi,  // Jan 24, 2026
  ];

  for (const pattern of datePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      data.dates.push(...matches);
    }
  }

  return data;
}

function extractFromTasksMd(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return {};

  const content = fs.readFileSync(filepath, 'utf-8');

  const active = (content.match(/- \[ \]/g) || []).length;
  const completed = (content.match(/- \[x\]/gi) || []).length;
  const blocked = (content.toLowerCase().match(/blocked/g) || []).length;

  return {
    active,
    completed,
    total: active + completed,
    blocked,
    completion_rate: active + completed > 0 ? completed / (active + completed) : null,
  };
}

function extractFromDecisionLog(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return { count: 0 };

  const content = fs.readFileSync(filepath, 'utf-8');
  const matches = content.match(/###\s*(DEC-|Decision)/gi);
  return { count: matches ? matches.length : 0 };
}

function extractFromActivityLog(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return { count: 0 };

  const content = fs.readFileSync(filepath, 'utf-8');
  const matches = content.match(/^\|[^|]+\|[^|]+\|[^|]+\|/gm);  // Table rows
  return { count: matches ? Math.max(0, matches.length - 2) : 0 };  // Subtract header rows
}

function extractFromCompactionLog(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return { count: 0 };

  const content = fs.readFileSync(filepath, 'utf-8');
  const matches = content.match(/###\s*Compaction/gi);
  return { count: matches ? matches.length : 0 };
}

function extractFromPerformanceLog(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return null;

  const content = fs.readFileSync(filepath, 'utf-8');
  const data = {
    has_data: true,
    sessions_tracked: 0,
  };

  // Try to extract metrics from tables
  // This is a simplified extraction - real implementation would be more robust
  const restoreMatch = content.match(/Context\s*[Rr]estore.*?(\d+\.?\d*)\s*min/);
  if (restoreMatch) data.avg_context_restore_minutes = parseFloat(restoreMatch[1]);

  const compactionMatch = content.match(/[Cc]ompaction.*?(\d+\.?\d*)/);
  if (compactionMatch) data.avg_compaction_events = parseFloat(compactionMatch[1]);

  const effectivenessMatch = content.match(/[Ee]ffectiveness.*?(\d+)/);
  if (effectivenessMatch) data.self_rated_effectiveness = parseInt(effectivenessMatch[1]);

  return data;
}

function getFileStats(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return null;

  const content = fs.readFileSync(filepath, 'utf-8');
  const stats = fs.statSync(filepath);

  return {
    lines: content.split('\n').length,
    modified_days_ago: Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)),
  };
}

// ============================================
// MAIN EXTRACTION
// ============================================

function extractAllMetrics(cwd, files) {
  const data = {
    installation_id: getOrCreateInstallationId(cwd),
    submission_number: getSubmissionNumber(cwd),
    client_version: CLIENT_VERSION,
    os_platform: os.platform(),
    cxms_version: null,
    deployment_level: null,

    lifecycle: {
      first_session_date: null,
      last_session_date: null,
      project_age_days: null,
      days_since_last_session: null,
      total_session_count: 0,
      sessions_last_30_days: null,
    },

    files: {
      present: {},
      line_counts: {},
      freshness: {},
      total_cxms_footprint: 0,
      largest_file: null,
      largest_file_lines: 0,
      files_over_200_lines: [],
      has_aging_files: false,
      has_archive_folder: fs.existsSync(path.join(cwd, 'Archive')),
    },

    tasks: {
      total: 0,
      active: 0,
      completed: 0,
      blocked: 0,
      completion_rate: null,
    },

    tracking: {
      decision_count: 0,
      activity_entries: 0,
      compaction_log_entries: 0,
      prompt_history_entries: 0,
    },

    context_health: {
      has_tldr_sections: false,
      has_session_metrics: false,
      session_md_freshness_days: null,
    },

    performance: {
      has_performance_log: false,
      sessions_tracked: 0,
      avg_context_restore_minutes: null,
      avg_compaction_events: null,
      avg_reexplain_requests: null,
      self_rated_effectiveness: null,
    },

    environment: {
      uses_git: fs.existsSync(path.join(cwd, '.git')),
      has_cxms_folder: fs.existsSync(path.join(cwd, '.cxms')),
      multi_tool_configs: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      utc_offset_hours: -(new Date().getTimezoneOffset() / 60),
    },

    user_context: {
      country: null,  // User-provided in --full mode
    },

    // Timing (set at submission)
    timing: {
      script_start_time: null,
      script_duration_seconds: null,
    },
    feedback: {},
    feature_interest: {},

    submitted_at: new Date().toISOString(),
  };

  // Extract from CLAUDE.md
  const claudeData = extractFromClaudeMd(files.claude_md);
  data.cxms_version = claudeData.cxms_version || null;
  data.deployment_level = claudeData.deployment_level || null;

  // Process each file
  for (const [key, filepath] of Object.entries(files)) {
    data.files.present[key] = true;

    const stats = getFileStats(filepath);
    if (stats) {
      data.files.line_counts[key] = stats.lines;
      data.files.freshness[key] = stats.modified_days_ago;
      data.files.total_cxms_footprint += stats.lines;

      if (stats.lines > data.files.largest_file_lines) {
        data.files.largest_file = key;
        data.files.largest_file_lines = stats.lines;
      }

      if (stats.lines > 200) {
        data.files.files_over_200_lines.push(key);
      }
    }
  }

  // Fill in missing files as not present
  for (const key of Object.keys(CXMS_FILES)) {
    if (!data.files.present[key]) {
      data.files.present[key] = false;
    }
  }

  // Extract from Session.md
  const sessionData = extractFromSessionMd(files.session_md);
  data.lifecycle.total_session_count = sessionData.session_count || 0;
  data.context_health.has_tldr_sections = sessionData.has_tldr || false;
  data.context_health.has_session_metrics = sessionData.has_metrics || false;
  data.context_health.session_md_freshness_days = data.files.freshness.session_md || null;

  // Parse dates for lifecycle
  if (sessionData.dates && sessionData.dates.length > 0) {
    const sortedDates = sessionData.dates
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a - b);

    if (sortedDates.length > 0) {
      data.lifecycle.first_session_date = sortedDates[0].toISOString().split('T')[0];
      data.lifecycle.last_session_date = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];
      data.lifecycle.project_age_days = Math.floor((Date.now() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24));
      data.lifecycle.days_since_last_session = Math.floor((Date.now() - sortedDates[sortedDates.length - 1].getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // Extract from Tasks.md
  const tasksData = extractFromTasksMd(files.tasks_md);
  data.tasks = { ...data.tasks, ...tasksData };

  // Extract from logs
  const decisionData = extractFromDecisionLog(files.decision_log_md);
  data.tracking.decision_count = decisionData.count;

  const activityData = extractFromActivityLog(files.activity_log_md);
  data.tracking.activity_entries = activityData.count;

  const compactionData = extractFromCompactionLog(files.compaction_log_md);
  data.tracking.compaction_log_entries = compactionData.count;

  // Extract from Performance_Log.md
  const perfData = extractFromPerformanceLog(files.performance_log_md);
  if (perfData) {
    data.performance = { ...data.performance, ...perfData };
  }

  // Check for multi-tool configs
  const multiToolFiles = ['GEMINI.md', '.cursorrules', 'copilot-instructions.md'];
  const allFiles = fs.readdirSync(cwd);
  for (const mtf of multiToolFiles) {
    if (allFiles.includes(mtf)) {
      data.environment.multi_tool_configs.push(mtf);
    }
  }

  // Check for aging files
  data.files.has_aging_files = allFiles.some(f => f.includes('_Aging_'));

  return data;
}

// ============================================
// USER PROMPTS
// ============================================

async function collectUserFeedback(data, fullMode = false) {
  logSection('Quick Feedback (press Enter to skip any)');

  // Always ask these
  data.user_context.project_type = await askChoice(
    '\nWhat type of project is this?',
    ['web', 'api', 'data', 'devops', 'ml', 'mobile', 'other']
  );

  data.user_context.team_size = await askChoice(
    '\nTeam size?',
    ['solo', '2-5', '6-10', '10+']
  );

  data.user_context.primary_ai_tool = await askChoice(
    '\nPrimary AI tool?',
    ['claude-code', 'cursor', 'copilot', 'gemini', 'chatgpt', 'aider', 'other']
  );

  if (fullMode) {
    logSection('Detailed Feedback');

    data.user_context.country = await ask('\nCountry (for regional stats)? ');
    if (data.user_context.country) {
      data.user_context.country = data.user_context.country.substring(0, 50);
    }

    data.user_context.using_cxms_since = await askChoice(
      '\nHow long have you been using CxMS?',
      ['< 1 week', '1-4 weeks', '1-3 months', '3+ months']
    );

    data.feedback.top_benefit = await ask('\nTop benefit of CxMS? (max 200 chars): ');
    if (data.feedback.top_benefit) {
      data.feedback.top_benefit = data.feedback.top_benefit.substring(0, 200);
    }

    data.feedback.top_challenge = await ask('\nBiggest challenge with CxMS? (max 200 chars): ');
    if (data.feedback.top_challenge) {
      data.feedback.top_challenge = data.feedback.top_challenge.substring(0, 200);
    }

    const npsAnswer = await ask('\nHow likely to recommend CxMS? (1-10): ');
    if (npsAnswer) {
      const nps = parseInt(npsAnswer);
      if (nps >= 1 && nps <= 10) {
        data.feedback.would_recommend_score = nps;
      }
    }

    logSection('Feature Interest (y/n)');

    const features = [
      ['wants_auto_health_check', 'Automated health checks?'],
      ['wants_log_aging', 'Log aging/archival?'],
      ['wants_multi_tool_support', 'Multi-tool support (Gemini, Cursor, etc)?'],
      ['wants_cross_project_sync', 'Cross-project sync?'],
      ['wants_better_token_efficiency', 'Better token efficiency?'],
    ];

    for (const [key, question] of features) {
      const answer = await ask(`${question} [y/n]: `);
      if (answer.toLowerCase() === 'y') {
        data.feature_interest[key] = true;
      } else if (answer.toLowerCase() === 'n') {
        data.feature_interest[key] = false;
      }
    }

    data.feedback.free_feedback = await ask('\nAny other feedback? (max 500 chars): ');
    if (data.feedback.free_feedback) {
      data.feedback.free_feedback = data.feedback.free_feedback.substring(0, 500);
    }
  }

  return data;
}

// ============================================
// DISPLAY
// ============================================

function displaySummary(data) {
  logSection('DATA SUMMARY');

  log('\n📦 Configuration');
  log(`   CxMS Version:      ${data.cxms_version || 'Unknown'}`);
  log(`   Deployment Level:  ${data.deployment_level || 'Unknown'}`);
  log(`   Platform:          ${data.os_platform}`);

  log('\n📅 Project Lifecycle');
  log(`   First Session:     ${data.lifecycle.first_session_date || 'Unknown'}`);
  log(`   Last Session:      ${data.lifecycle.last_session_date || 'Unknown'}`);
  log(`   Total Sessions:    ${data.lifecycle.total_session_count}`);
  log(`   Project Age:       ${data.lifecycle.project_age_days || 'Unknown'} days`);

  log('\n📁 Files Present');
  const presentFiles = Object.entries(data.files.present)
    .filter(([_, v]) => v)
    .map(([k, _]) => k);
  log(`   ${presentFiles.length} of ${Object.keys(CXMS_FILES).length} CxMS files`);
  log(`   Total footprint:   ${data.files.total_cxms_footprint} lines`);
  if (data.files.files_over_200_lines.length > 0) {
    log(`   ⚠️  Large files:    ${data.files.files_over_200_lines.join(', ')}`);
  }

  log('\n📊 Metrics');
  log(`   Active Tasks:      ${data.tasks.active}`);
  log(`   Completed Tasks:   ${data.tasks.completed}`);
  log(`   Decisions Logged:  ${data.tracking.decision_count}`);
  log(`   Compaction Events: ${data.tracking.compaction_log_entries}`);

  if (data.performance.has_performance_log) {
    log('\n⚡ Performance');
    if (data.performance.avg_context_restore_minutes) {
      log(`   Avg Restore:       ${data.performance.avg_context_restore_minutes} min`);
    }
    if (data.performance.self_rated_effectiveness) {
      log(`   Effectiveness:     ${data.performance.self_rated_effectiveness}/5`);
    }
  }

  if (data.user_context.project_type || data.feedback.top_benefit) {
    log('\n👤 Your Feedback');
    if (data.user_context.project_type) log(`   Project Type:      ${data.user_context.project_type}`);
    if (data.user_context.team_size) log(`   Team Size:         ${data.user_context.team_size}`);
    if (data.user_context.primary_ai_tool) log(`   AI Tool:           ${data.user_context.primary_ai_tool}`);
    if (data.feedback.top_benefit) log(`   Top Benefit:       ${data.feedback.top_benefit}`);
    if (data.feedback.top_challenge) log(`   Top Challenge:     ${data.feedback.top_challenge}`);
  }
}

// ============================================
// SUBMISSION
// ============================================

async function submitTelemetry(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const url = new URL('/rest/v1/cxms_telemetry', SUPABASE_URL);

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, res => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ============================================
// MAIN
// ============================================

async function main() {
  const scriptStartTime = Date.now();

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fullMode = args.includes('--full');
  const skipPrompts = args.includes('--skip-prompts');
  const autoYes = args.includes('--yes') || args.includes('-y');
  const helpMode = args.includes('--help') || args.includes('-h');

  if (helpMode) {
    log(`
CxMS Telemetry Reporter v${CLIENT_VERSION}

Usage:
  node cxms-report.mjs              Default mode (metrics + quick questions)
  node cxms-report.mjs --full       Full survey mode
  node cxms-report.mjs --dry-run    Preview without sending
  node cxms-report.mjs --help       Show this help

This tool collects anonymous usage metrics to help improve CxMS.
All data collection is opt-in and you see exactly what's sent before confirming.

Learn more: https://github.com/RobSB2/CxMS
    `);
    process.exit(0);
  }

  log('\n════════════════════════════════════════════════════════════');
  log(`    CxMS Telemetry Reporter v${CLIENT_VERSION}`);
  log('════════════════════════════════════════════════════════════');

  const cwd = process.cwd();

  // Discover files
  log('\n🔍 Scanning for CxMS files...');
  const files = discoverFiles(cwd);

  if (!files.claude_md) {
    log('\n❌ No CLAUDE.md found. Is this a CxMS project?');
    log('   Run this command from your project root directory.\n');
    process.exit(1);
  }

  const fileCount = Object.keys(files).length;
  log(`   Found ${fileCount} CxMS files`);

  // Extract metrics
  log('\n📊 Extracting metrics...');
  let data = extractAllMetrics(cwd, files);

  // Collect user feedback (skip if --skip-prompts or --yes)
  if (!skipPrompts && !autoYes) {
    data = await collectUserFeedback(data, fullMode);
  }

  // Display summary
  displaySummary(data);

  if (dryRun) {
    // Add timing for dry-run display
    const scriptEndTime = Date.now();
    data.timing = {
      script_start_time: new Date(scriptStartTime).toISOString(),
      script_duration_seconds: Math.round((scriptEndTime - scriptStartTime) / 1000),
    };

    log('\n📋 Full JSON (--dry-run mode):\n');
    log(JSON.stringify(data, null, 2));
    log(`\n⏱️  Script duration: ${data.timing.script_duration_seconds}s`);
    log(`🌍 Timezone: ${data.environment.timezone} (UTC${data.environment.utc_offset_hours >= 0 ? '+' : ''}${data.environment.utc_offset_hours})`);
    log('\n✅ Dry run complete. No data was sent.\n');
    process.exit(0);
  }

  // Consent (skip if --skip-prompts without --yes)
  if (skipPrompts && !autoYes) {
    log('\n⚠️  --skip-prompts used without --dry-run or --yes. Use --dry-run to preview or --yes to auto-consent.\n');
    process.exit(0);
  }

  let consent = 'y';
  if (!autoYes) {
    log('\n════════════════════════════════════════════════════════════');
    consent = await ask('Send this data anonymously to help improve CxMS? [y/N]: ');
  } else {
    log('\n✅ Auto-consenting (--yes flag)');
  }

  if (consent.toLowerCase() !== 'y') {
    log('\n👍 No data sent. Thanks anyway!\n');
    process.exit(0);
  }

  // Calculate timing
  const scriptEndTime = Date.now();
  data.timing = {
    script_start_time: new Date(scriptStartTime).toISOString(),
    script_duration_seconds: Math.round((scriptEndTime - scriptStartTime) / 1000),
  };

  // Submit
  log('\n📤 Submitting...');
  log(`   (Script took ${data.timing.script_duration_seconds}s)`);

  if (SUPABASE_URL.includes('YOUR_PROJECT')) {
    log('\n⚠️  Supabase not configured yet!');
    log('   The telemetry backend is not set up.');
    log('   Data would have been sent:\n');
    log(JSON.stringify(data, null, 2));
    log('\n');
    process.exit(0);
  }

  try {
    await submitTelemetry(data);
    log('\n✅ Thanks! Your anonymous feedback helps improve CxMS.');
    log('   View community stats: https://github.com/RobSB2/CxMS\n');
  } catch (err) {
    log(`\n❌ Failed to submit: ${err.message}`);
    log('   You can report issues at: https://github.com/RobSB2/CxMS/issues\n');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
