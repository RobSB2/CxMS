# CxMS Telemetry System Specification

**Version:** 1.0 DRAFT
**Author:** AI + Human
**Date:** 2026-01-24
**Status:** Proposal
**Related Enhancement:** E13 (Community Telemetry)

---

## Executive Summary

Replace the manual GitHub issue form (E13) with an automated, opt-in telemetry system using Supabase. Users run a simple command or script that reads their CxMS files, extracts metrics, and submits them anonymously. This reduces friction from "fill out a form" to "run one command."

**Goals:**
- Zero-friction metric submission (one command)
- Strict privacy (opt-in, anonymous, no code/secrets)
- Actionable data for improving CxMS
- Community dashboard showing aggregate stats

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User's Machine                                │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ CxMS Files   │───▶│  cxms-report     │───▶│  Consent Prompt  │  │
│  │ Session.md   │    │  (Node script)   │    │  "Send this?"    │  │
│  │ Tasks.md     │    │                  │    │  [Y/N]           │  │
│  │ CLAUDE.md    │    │  Extracts:       │    └────────┬─────────┘  │
│  │ etc.         │    │  - Metrics       │             │ Yes        │
│  └──────────────┘    │  - Config        │             ▼            │
│                      │  - NO code/secrets│    ┌──────────────────┐  │
│                      └──────────────────┘    │  HTTPS POST      │  │
│                                              │  to Supabase     │  │
│                                              └────────┬─────────┘  │
└───────────────────────────────────────────────────────┼─────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase                                     │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ submissions  │    │ Row Level        │    │ Dashboard View   │  │
│  │ table        │    │ Security         │    │ (public read)    │  │
│  │              │    │                  │    │                  │  │
│  │ - anon_id    │    │ Insert: anon key │    │ Aggregated only  │  │
│  │ - metrics    │    │ Select: service  │    │ No individual    │  │
│  │ - timestamp  │    │ Delete: none     │    │ records exposed  │  │
│  └──────────────┘    └──────────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Public Dashboard                                  │
│  cxms.dev/stats (or GitHub Pages)                                   │
│                                                                      │
│  Total Submissions: 147        Avg Context Restore: 2.3 min         │
│  Projects Using CxMS: 89       Avg Compaction Events: 0.4/session   │
│  Most Popular: Session.md      Top Challenge: Initial setup          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Questions This Telemetry Must Answer

### Effectiveness Questions
1. Does CxMS actually reduce context rebuild time?
2. Does CxMS reduce compaction events?
3. Does CxMS improve AI accuracy (fewer corrections needed)?
4. Which deployment level (Lite/Standard/Max) is most effective?
5. Which optional files provide the most measurable value?
6. Does effectiveness improve over time (learning curve)?

### Adoption & Retention Questions
1. How many people are actively using CxMS?
2. What's the typical onboarding experience?
3. How long do people stick with CxMS?
4. What causes people to abandon CxMS?
5. What's the adoption curve for optional files?

### Feature Priority Questions
1. Which roadmap enhancements are most needed?
2. What pain points are most common?
3. Are files getting too big (need aging)?
4. Is cross-project coordination a real need?
5. What features would increase effectiveness?

### Usage Pattern Questions
1. How often are sessions happening?
2. How long are typical sessions?
3. Which files get updated most frequently?
4. Are people following recommended workflows?
5. How many projects use CxMS per user?

---

## Data Collection

### Category 1: Identity & Configuration

| Field | Source | Purpose |
|-------|--------|---------|
| `installation_id` | Generated UUID, persisted in `.cxms/.telemetry_id` | Deduplicate, track over time |
| `submission_number` | Count of submissions from this installation | Track engagement |
| `cxms_version` | `**Version:**` in CLAUDE.md | Version adoption |
| `deployment_level` | `**Deployment Level:**` in CLAUDE.md | Lite/Standard/Max distribution |
| `client_version` | Hardcoded in script | Track script updates |
| `os_platform` | `process.platform` | Windows/Mac/Linux distribution |

### Category 2: Project Lifecycle

| Field | Source | Purpose |
|-------|--------|---------|
| `first_session_date` | Earliest date in Session.md | Project age |
| `last_session_date` | Latest date in Session.md | Recent activity |
| `project_age_days` | Calculated from first session | Maturity |
| `days_since_last_session` | Calculated from last session | Activity recency |
| `total_session_count` | Count of `## Session` headers | Usage intensity |
| `sessions_last_30_days` | Sessions with dates in last 30 days | Recent activity rate |

### Category 3: File Presence & Health

| Field | Source | Purpose |
|-------|--------|---------|
| `files_present` | Check existence of each CxMS file | Template adoption |
| `files_with_content` | Files with >10 lines (actually used) | Real vs placeholder adoption |
| `file_line_counts` | Line count per file | Right-sizing, aging signals |
| `file_last_modified_days` | File modification timestamps | Freshness |
| `total_cxms_footprint` | Sum of all CxMS file lines | Documentation overhead |
| `largest_file` | Which file has most lines | Aging candidate identification |
| `has_aging_files` | Check for `*_Aging_*.md` files | E11 adoption |
| `has_archive_folder` | Check for Archive/ directory | Historical management |

### Category 4: Task Tracking Metrics

| Field | Source | Purpose |
|-------|--------|---------|
| `tasks_total` | Count all `- [ ]` and `- [x]` in Tasks.md | Workload visibility |
| `tasks_active` | Count `- [ ]` patterns | Current workload |
| `tasks_completed` | Count `- [x]` patterns | Throughput |
| `tasks_blocked` | Count tasks with "blocked" or similar | Blocker frequency (E1 signal) |
| `completion_rate` | completed / total | Effectiveness indicator |
| `oldest_active_task_age` | Parse dates if present | Task staleness |

### Category 5: Decision & Activity Tracking

| Field | Source | Purpose |
|-------|--------|---------|
| `decision_count` | Count `### ` or `## DEC-` entries | Decision logging usage |
| `activity_entries` | Count entries in Activity_Log.md | Activity logging usage |
| `issue_count_total` | Count issues in Issue_Log.md | Issue tracking usage |
| `issue_count_open` | Issues not marked resolved | Open issue load |
| `issue_count_resolved` | Issues marked resolved | Resolution rate |

### Category 6: Context Health Indicators

| Field | Source | Purpose |
|-------|--------|---------|
| `compaction_log_entries` | Count entries in Compaction_Log.md | Compaction frequency |
| `has_performance_log` | Performance_Log.md exists with content | Metrics tracking adoption |
| `has_prompt_history` | Prompt_History.md exists with content | Prompt logging adoption |
| `prompt_history_entries` | Count entries if exists | Prompt volume |
| `has_tldr_sections` | Check for `## TL;DR` in Session.md | Best practice adoption |
| `has_session_metrics` | Check for `## Session Metrics` | E9 adoption |
| `session_md_freshness_days` | Last modified date of Session.md | Maintenance discipline |

### Category 7: Performance Metrics (from Performance_Log.md)

| Field | Source | Purpose |
|-------|--------|---------|
| `avg_context_restore_minutes` | Parse from Performance_Log | Key effectiveness metric |
| `avg_compaction_events_per_session` | Parse from Performance_Log | Context management quality |
| `avg_reexplain_requests` | Parse from Performance_Log | AI accuracy indicator |
| `avg_user_corrections` | Parse from Performance_Log | AI accuracy indicator |
| `self_rated_effectiveness` | Parse from Performance_Log (1-5) | Subjective assessment |
| `sessions_tracked_in_perf_log` | Count of metric entries | Data quality indicator |

### Category 8: Environment & Workflow

| Field | Source | Purpose |
|-------|--------|---------|
| `uses_git` | Check for `.git` directory | Version control adoption |
| `cxms_files_in_git` | Check if CxMS files are tracked | Team sharing pattern |
| `has_cxms_folder` | Check for `.cxms/` directory | Folder organization |
| `multi_tool_configs` | Check for GEMINI.md, .cursorrules, etc. | Multi-tool usage |
| `project_has_readme` | README.md exists | Project maturity signal |
| `project_file_count` | Rough count of project files | Project size estimate |

### Category 9: User-Provided Context

| Field | Source | Purpose |
|-------|--------|---------|
| `project_type` | User input | Segmentation (web/api/data/devops/ml/other) |
| `team_size` | User input | Solo vs team patterns |
| `primary_ai_tool` | User input | Tool distribution |
| `additional_ai_tools` | User input | Multi-tool usage |
| `using_since` | User input | Self-reported tenure |
| `sessions_per_week_estimate` | User input | Activity level |

### Category 10: Qualitative Feedback

| Field | Source | Purpose |
|-------|--------|---------|
| `top_benefit` | User input (text, max 200 chars) | What's working |
| `top_challenge` | User input (text, max 200 chars) | What's not working |
| `would_recommend_score` | User input (1-10 NPS style) | Satisfaction indicator |
| `most_valuable_file` | User input (pick from list) | File value ranking |
| `least_used_file` | User input (pick from list) | Adoption barriers |
| `desired_features` | User input (multi-select from roadmap) | Feature prioritization |
| `free_feedback` | User input (text, max 500 chars) | Open-ended insights |

### Category 11: Enhancement Priority Signals

| Field | Source | Purpose |
|-------|--------|---------|
| `wants_auto_health_check` | User input (yes/no) | E10 demand |
| `wants_cross_project_sync` | User input (yes/no) | E1/E12 demand |
| `wants_log_aging` | User input (yes/no) | E11 demand |
| `wants_multi_tool_support` | User input (yes/no) | E14 demand |
| `wants_better_token_efficiency` | User input (yes/no) | E6 demand |
| `enhancement_priority_ranking` | User ranks top 3 enhancements | Roadmap prioritization |

---

## What We DO NOT Collect

| Excluded Data | Reason |
|---------------|--------|
| Project names or paths | Identifiable |
| File contents (only structure metrics) | Privacy, security |
| Task/decision descriptions | Could contain sensitive info |
| Code snippets | Proprietary |
| API keys, credentials, secrets | Security |
| Personal information | Privacy |
| IP addresses | Privacy (Supabase doesn't log by default) |
| Exact timestamps | Coarsen to days for privacy |
| Prompt text from Prompt_History | Could contain sensitive queries |

### Data Schema

```typescript
interface CxMSTelemetrySubmission {
  // ============================================
  // CATEGORY 1: Identity & Configuration
  // ============================================
  installation_id: string;          // UUID, persisted in .cxms/.telemetry_id
  submission_number: number;        // Nth submission from this installation
  cxms_version: string | null;      // e.g., "1.4"
  deployment_level: string | null;  // "Lite" | "Standard" | "Max"
  client_version: string;           // Script version
  os_platform: string;              // "win32" | "darwin" | "linux"

  // ============================================
  // CATEGORY 2: Project Lifecycle
  // ============================================
  lifecycle: {
    first_session_date: string | null;    // ISO date (YYYY-MM-DD)
    last_session_date: string | null;     // ISO date
    project_age_days: number | null;      // Days since first session
    days_since_last_session: number | null;
    total_session_count: number;          // Count of session entries
    sessions_last_30_days: number;        // Recent activity
  };

  // ============================================
  // CATEGORY 3: File Presence & Health
  // ============================================
  files: {
    // Presence (boolean)
    present: {
      claude_md: boolean;
      session_md: boolean;
      tasks_md: boolean;
      context_md: boolean;
      prompt_history_md: boolean;
      activity_log_md: boolean;
      decision_log_md: boolean;
      issue_log_md: boolean;
      deployment_md: boolean;
      performance_log_md: boolean;
      compaction_log_md: boolean;
      plan_md: boolean;
      inventory_md: boolean;
      strategy_md: boolean;
      exceptions_md: boolean;
      prompt_library_md: boolean;
    };

    // Line counts
    line_counts: {
      [key: string]: number;  // e.g., { "claude_md": 150, "session_md": 200 }
    };

    // Health indicators
    total_cxms_footprint: number;         // Sum of all line counts
    largest_file: string | null;          // Which file is biggest
    largest_file_lines: number | null;
    files_over_200_lines: string[];       // Aging candidates
    has_aging_files: boolean;             // *_Aging_*.md exists
    has_archive_folder: boolean;          // Archive/ exists

    // Freshness (days since modified)
    freshness: {
      [key: string]: number | null;  // e.g., { "session_md": 1, "tasks_md": 3 }
    };
  };

  // ============================================
  // CATEGORY 4: Task Metrics
  // ============================================
  tasks: {
    total: number;
    active: number;                       // [ ] count
    completed: number;                    // [x] count
    blocked: number;                      // Contains "blocked" keyword
    completion_rate: number | null;       // completed / total (0-1)
  };

  // ============================================
  // CATEGORY 5: Decision & Activity Tracking
  // ============================================
  tracking: {
    decision_count: number;               // Entries in Decision_Log
    activity_entries: number;             // Entries in Activity_Log
    issue_count_total: number;
    issue_count_open: number;
    issue_count_resolved: number;
    prompt_history_entries: number;
  };

  // ============================================
  // CATEGORY 6: Context Health
  // ============================================
  context_health: {
    compaction_log_entries: number;       // Number of logged compactions
    has_tldr_sections: boolean;           // Best practice check
    has_session_metrics: boolean;         // E9 adoption
    session_md_freshness_days: number | null;
  };

  // ============================================
  // CATEGORY 7: Performance Metrics
  // ============================================
  performance: {
    has_performance_log: boolean;
    sessions_tracked: number;             // How many sessions have metrics
    avg_context_restore_minutes: number | null;
    avg_compaction_events: number | null;
    avg_reexplain_requests: number | null;
    avg_user_corrections: number | null;
    self_rated_effectiveness: number | null;  // 1-5
  };

  // ============================================
  // CATEGORY 8: Environment
  // ============================================
  environment: {
    uses_git: boolean;
    cxms_files_in_git: boolean | null;    // null if no git
    has_cxms_folder: boolean;             // .cxms/ exists
    multi_tool_configs: string[];         // ["gemini_md", "cursorrules", etc.]
    project_file_count_estimate: string;  // "small (<50)", "medium (50-200)", "large (200+)"
  };

  // ============================================
  // CATEGORY 9: User-Provided Context
  // ============================================
  user_context: {
    project_type: string | null;          // web, api, data, devops, ml, mobile, other
    team_size: string | null;             // solo, 2-5, 6-10, 10+
    primary_ai_tool: string | null;       // claude-code, cursor, copilot, gemini, aider, other
    additional_ai_tools: string[];        // Multi-tool usage
    using_cxms_since: string | null;      // < 1 week, 1-4 weeks, 1-3 months, 3+ months
    sessions_per_week: string | null;     // < 1, 1-3, 4-7, 7+
  };

  // ============================================
  // CATEGORY 10: Qualitative Feedback
  // ============================================
  feedback: {
    top_benefit: string | null;           // max 200 chars
    top_challenge: string | null;         // max 200 chars
    would_recommend_score: number | null; // 1-10 NPS style
    most_valuable_file: string | null;    // From list
    least_used_file: string | null;       // From list
    free_feedback: string | null;         // max 500 chars
  };

  // ============================================
  // CATEGORY 11: Feature Interest
  // ============================================
  feature_interest: {
    wants_auto_health_check: boolean | null;
    wants_cross_project_sync: boolean | null;
    wants_log_aging: boolean | null;
    wants_multi_tool_support: boolean | null;
    wants_better_token_efficiency: boolean | null;
    wants_community_dashboard: boolean | null;
    enhancement_priority: string[];       // Top 3 enhancement IDs: ["E10", "E11", "E1"]
  };

  // ============================================
  // METADATA
  // ============================================
  submitted_at: string;                   // ISO timestamp
}
```

### Derived Metrics (Calculated Server-Side for Dashboard)

These are computed from raw submissions for aggregated views:

```typescript
interface DerivedMetrics {
  // Adoption Metrics
  unique_installations: number;
  active_installations_30d: number;       // Submitted in last 30 days
  retention_rate_30d: number;             // % still active after 30 days
  avg_project_age_days: number;

  // Effectiveness Metrics
  avg_context_restore_time: number;
  median_compaction_events: number;
  avg_effectiveness_rating: number;

  // File Adoption
  file_adoption_rates: { [file: string]: number };  // % of installations using each file
  avg_cxms_footprint: number;
  files_commonly_over_200: string[];

  // Feature Demand
  enhancement_demand_ranking: { id: string; votes: number }[];
  top_challenges: { challenge: string; frequency: number }[];
  top_benefits: { benefit: string; frequency: number }[];

  // Segmentation
  by_deployment_level: { level: string; count: number; avg_effectiveness: number }[];
  by_project_type: { type: string; count: number }[];
  by_team_size: { size: string; count: number }[];
  by_ai_tool: { tool: string; count: number }[];
}
```

---

---

## How Data Maps to Insights

### Effectiveness Analysis

| Question | Data Used | Analysis |
|----------|-----------|----------|
| Does CxMS reduce context rebuild? | `performance.avg_context_restore_minutes` | Compare across deployment levels, project ages |
| Does CxMS reduce compactions? | `performance.avg_compaction_events`, `context_health.compaction_log_entries` | Track trends over project lifetime |
| Which deployment level is best? | Segment all metrics by `deployment_level` | Compare effectiveness scores across Lite/Standard/Max |
| Do optional files help? | Correlate `files.present.*` with `performance.*` | Files correlated with better effectiveness |
| Learning curve? | Plot `performance.*` against `lifecycle.project_age_days` | How long until effectiveness plateaus |

**Example Insight:**
> "Projects using Decision_Log.md show 23% fewer re-explain requests on average (1.2 vs 1.56 per session). Consider promoting Decision_Log adoption in documentation."

### Adoption Analysis

| Question | Data Used | Analysis |
|----------|-----------|----------|
| Which files get adopted first? | `files.present.*` segmented by `lifecycle.project_age_days` | Adoption curve per file |
| Which files get dropped? | Track installations over time, check `files.present` changes | Files that appear then disappear |
| What's optional file adoption rate? | `files.present.*` overall percentages | E.g., "45% use Decision_Log" |
| Are people following workflows? | `context_health.has_tldr_sections`, `context_health.has_session_metrics` | Best practice adoption |

**Example Insight:**
> "Only 12% of installations have Session Metrics enabled. This is our newest feature (E9) - may need better documentation or simpler implementation."

### Pain Point Detection

| Question | Data Used | Analysis |
|----------|-----------|----------|
| Are files getting too big? | `files.files_over_200_lines`, `files.largest_file_lines` | Aging need (E11) |
| Which files grow fastest? | Track `files.line_counts` over time per installation | Identify bloat patterns |
| What frustrates users? | `feedback.top_challenge`, cluster similar responses | Theme extraction |
| Why do people stop? | Correlate last submission with `feedback.*` | Churn reasons |

**Example Insight:**
> "38% of installations have Session.md over 200 lines. 67% of these cite 'file maintenance' as top challenge. Prioritize E11 (Log Aging) implementation."

### Feature Prioritization

| Question | Data Used | Analysis |
|----------|-----------|----------|
| Which enhancements are wanted? | `feature_interest.*`, `feature_interest.enhancement_priority` | Direct demand signal |
| What are implicit needs? | Usage patterns that suggest features | E.g., multi-tool configs → E14 demand |
| What's blocking effectiveness? | Correlate `feedback.top_challenge` with low `performance.*` | Feature gaps |

**Example Insight:**
> "Enhancement priority ranking: #1 E10 (Health Check) with 45% demand, #2 E11 (Aging) with 38%, #3 E14 (Multi-tool) with 31%. Aligns with detected pain points."

### Retention Analysis

| Question | Data Used | Analysis |
|----------|-----------|----------|
| 30-day retention? | Installations that submit again within 30 days | Core retention metric |
| What predicts retention? | Correlate early behaviors with later activity | E.g., "using Tasks.md in first week → 2x retention" |
| What predicts churn? | Features of installations that stop submitting | E.g., "high compaction events → churn" |

**Example Insight:**
> "Installations that enable Performance_Log.md within the first month have 78% 90-day retention vs 34% for those that don't. Self-monitoring drives engagement."

---

## Sample Dashboard Views

### Overview Stats
```
┌─────────────────────────────────────────────────────────────────────┐
│ CxMS Community Statistics                           Updated: Today  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Installations    Active (30d)    Avg Age         Avg Effectiveness │
│      247              183          47 days             4.2 / 5      │
│                                                                      │
│  Context Restore    Compactions    Most Valuable     Top Challenge  │
│     2.3 min          0.4/session   Session.md (89%)  File Maint.    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### File Adoption Rates
```
┌─────────────────────────────────────────────────────────────────────┐
│ File Adoption (% of installations)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ CLAUDE.md          ████████████████████████████████████████ 100%    │
│ Session.md         ███████████████████████████████████████░  97%    │
│ Tasks.md           ██████████████████████████████████░░░░░░  84%    │
│ Context.md         ████████████████████████░░░░░░░░░░░░░░░░  58%    │
│ Decision_Log.md    █████████████████░░░░░░░░░░░░░░░░░░░░░░░  42%    │
│ Activity_Log.md    ███████████████░░░░░░░░░░░░░░░░░░░░░░░░░  38%    │
│ Prompt_History.md  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  34%    │
│ Performance_Log.md ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  15%    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Effectiveness by Deployment Level
```
┌─────────────────────────────────────────────────────────────────────┐
│ Deployment Level Comparison                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Level    │ Count │ Restore │ Compactions │ Effectiveness │ Retention │
│ ─────────┼───────┼─────────┼─────────────┼───────────────┼───────────│
│ Lite     │  67   │  3.1m   │    0.6      │     3.8       │    58%    │
│ Standard │ 142   │  2.1m   │    0.3      │     4.3       │    74%    │
│ Max      │  38   │  1.8m   │    0.2      │     4.6       │    89%    │
│                                                                      │
│ Insight: Max deployment shows best metrics but only 15% adoption.   │
│ Consider promoting Standard → Max upgrade path.                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Enhancement Demand
```
┌─────────────────────────────────────────────────────────────────────┐
│ Feature Priority (from user rankings)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ E10: Health Check      ████████████████████████░░░░░░░░░░░░  45%    │
│ E11: Log Aging         ██████████████████████░░░░░░░░░░░░░░  38%    │
│ E14: Multi-Tool        ███████████████████░░░░░░░░░░░░░░░░░  31%    │
│ E1:  Cross-Project     ██████████████░░░░░░░░░░░░░░░░░░░░░░  24%    │
│ E6:  Token Efficiency  █████████████░░░░░░░░░░░░░░░░░░░░░░░  22%    │
│ E15: Update Management ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  14%    │
│                                                                      │
│ Top Challenge Correlation:                                           │
│ - "File maintenance" → E11 (Log Aging)                              │
│ - "Don't know if it's working" → E10 (Health Check)                 │
│ - "Use multiple AI tools" → E14 (Multi-Tool)                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Supabase Setup

### Database Schema

```sql
-- ============================================
-- TELEMETRY SUBMISSIONS TABLE
-- ============================================
create table cxms_telemetry (
  id uuid primary key default gen_random_uuid(),

  -- Identity (anonymous)
  installation_id uuid not null,
  submission_number int default 1,

  -- CxMS Configuration (denormalized for easy querying)
  cxms_version text,
  deployment_level text,
  os_platform text,
  client_version text,

  -- Structured data (JSONB for flexibility)
  lifecycle jsonb default '{}',           -- Project lifecycle metrics
  files jsonb default '{}',               -- File presence, sizes, health
  tasks jsonb default '{}',               -- Task counts
  tracking jsonb default '{}',            -- Decision/activity tracking
  context_health jsonb default '{}',      -- Context health indicators
  performance jsonb default '{}',         -- Performance metrics
  environment jsonb default '{}',         -- Git, multi-tool, etc.
  user_context jsonb default '{}',        -- User-provided project info
  feedback jsonb default '{}',            -- Qualitative feedback
  feature_interest jsonb default '{}',    -- Enhancement demand signals

  -- Metadata
  submitted_at timestamp with time zone default now(),

  -- Constraints
  constraint valid_deployment_level check (
    deployment_level in ('Lite', 'Standard', 'Max', null)
  ),
  constraint valid_os_platform check (
    os_platform in ('win32', 'darwin', 'linux', null)
  )
);

-- ============================================
-- INDEXES FOR ANALYTICS
-- ============================================

-- Time-based queries
create index idx_telemetry_submitted_at on cxms_telemetry(submitted_at);

-- Installation tracking (for retention analysis)
create index idx_telemetry_installation on cxms_telemetry(installation_id);
create index idx_telemetry_install_time on cxms_telemetry(installation_id, submitted_at);

-- Segmentation queries
create index idx_telemetry_version on cxms_telemetry(cxms_version);
create index idx_telemetry_level on cxms_telemetry(deployment_level);
create index idx_telemetry_platform on cxms_telemetry(os_platform);

-- JSONB indexes for common queries
create index idx_telemetry_project_type on cxms_telemetry((user_context->>'project_type'));
create index idx_telemetry_team_size on cxms_telemetry((user_context->>'team_size'));
create index idx_telemetry_ai_tool on cxms_telemetry((user_context->>'primary_ai_tool'));

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table cxms_telemetry enable row level security;

-- Anyone can insert (with anon key)
create policy "Anyone can submit telemetry" on cxms_telemetry
  for insert with check (true);

-- No direct read access via anon key
create policy "No direct read access" on cxms_telemetry
  for select using (false);

-- ============================================
-- AGGREGATED VIEWS (Safe for Public Dashboard)
-- ============================================

-- Overview Statistics
create or replace view cxms_stats_overview as
select
  count(distinct installation_id) as unique_installations,
  count(*) as total_submissions,
  count(distinct installation_id) filter (
    where submitted_at > now() - interval '30 days'
  ) as active_installations_30d,
  avg((lifecycle->>'project_age_days')::numeric) as avg_project_age_days,
  avg((performance->>'self_rated_effectiveness')::numeric) as avg_effectiveness_rating,
  avg((performance->>'avg_context_restore_minutes')::numeric) as avg_context_restore_minutes,
  avg((performance->>'avg_compaction_events')::numeric) as avg_compaction_events,
  min(submitted_at) as first_submission,
  max(submitted_at) as latest_submission
from cxms_telemetry;

-- By Deployment Level
create or replace view cxms_stats_by_level as
select
  deployment_level,
  count(distinct installation_id) as installations,
  avg((performance->>'avg_context_restore_minutes')::numeric) as avg_restore_minutes,
  avg((performance->>'avg_compaction_events')::numeric) as avg_compactions,
  avg((performance->>'self_rated_effectiveness')::numeric) as avg_effectiveness,
  avg((lifecycle->>'project_age_days')::numeric) as avg_project_age
from cxms_telemetry
where deployment_level is not null
group by deployment_level;

-- File Adoption Rates
create or replace view cxms_stats_file_adoption as
select
  count(distinct installation_id) as total_installations,
  count(distinct installation_id) filter (where (files->'present'->>'claude_md')::boolean) as has_claude_md,
  count(distinct installation_id) filter (where (files->'present'->>'session_md')::boolean) as has_session_md,
  count(distinct installation_id) filter (where (files->'present'->>'tasks_md')::boolean) as has_tasks_md,
  count(distinct installation_id) filter (where (files->'present'->>'context_md')::boolean) as has_context_md,
  count(distinct installation_id) filter (where (files->'present'->>'prompt_history_md')::boolean) as has_prompt_history_md,
  count(distinct installation_id) filter (where (files->'present'->>'activity_log_md')::boolean) as has_activity_log_md,
  count(distinct installation_id) filter (where (files->'present'->>'decision_log_md')::boolean) as has_decision_log_md,
  count(distinct installation_id) filter (where (files->'present'->>'issue_log_md')::boolean) as has_issue_log_md,
  count(distinct installation_id) filter (where (files->'present'->>'deployment_md')::boolean) as has_deployment_md,
  count(distinct installation_id) filter (where (files->'present'->>'performance_log_md')::boolean) as has_performance_log_md
from cxms_telemetry;

-- By Project Type
create or replace view cxms_stats_by_project_type as
select
  user_context->>'project_type' as project_type,
  count(distinct installation_id) as installations,
  avg((performance->>'self_rated_effectiveness')::numeric) as avg_effectiveness
from cxms_telemetry
where user_context->>'project_type' is not null
group by user_context->>'project_type';

-- By AI Tool
create or replace view cxms_stats_by_ai_tool as
select
  user_context->>'primary_ai_tool' as ai_tool,
  count(distinct installation_id) as installations,
  avg((performance->>'self_rated_effectiveness')::numeric) as avg_effectiveness
from cxms_telemetry
where user_context->>'primary_ai_tool' is not null
group by user_context->>'primary_ai_tool';

-- Enhancement Demand (aggregated from feature_interest)
create or replace view cxms_stats_enhancement_demand as
select
  count(*) filter (where (feature_interest->>'wants_auto_health_check')::boolean) as wants_health_check,
  count(*) filter (where (feature_interest->>'wants_cross_project_sync')::boolean) as wants_cross_project,
  count(*) filter (where (feature_interest->>'wants_log_aging')::boolean) as wants_log_aging,
  count(*) filter (where (feature_interest->>'wants_multi_tool_support')::boolean) as wants_multi_tool,
  count(*) filter (where (feature_interest->>'wants_better_token_efficiency')::boolean) as wants_token_efficiency,
  count(*) filter (where (feature_interest->>'wants_community_dashboard')::boolean) as wants_dashboard,
  count(*) as total_responses
from cxms_telemetry
where feature_interest != '{}';

-- Version Distribution
create or replace view cxms_stats_version_distribution as
select
  cxms_version,
  count(distinct installation_id) as installations,
  count(*) as submissions
from cxms_telemetry
where cxms_version is not null
group by cxms_version
order by cxms_version desc;

-- Grant public read on all aggregated views
grant select on cxms_stats_overview to anon;
grant select on cxms_stats_by_level to anon;
grant select on cxms_stats_file_adoption to anon;
grant select on cxms_stats_by_project_type to anon;
grant select on cxms_stats_by_ai_tool to anon;
grant select on cxms_stats_enhancement_demand to anon;
grant select on cxms_stats_version_distribution to anon;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get latest submission per installation (for deduplication)
create or replace view cxms_latest_per_installation as
select distinct on (installation_id) *
from cxms_telemetry
order by installation_id, submitted_at desc;
```

### Edge Function for Validation (Optional)

```typescript
// supabase/functions/submit-telemetry/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const data = await req.json()

    // Validate required fields
    if (!data.installation_id || !data.client_version) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Sanitize - strip any unexpected fields
    const sanitized = {
      installation_id: data.installation_id,
      cxms_version: data.cxms_version?.substring(0, 20),
      deployment_level: data.deployment_level,
      files_present: data.files_present || {},
      file_sizes: data.file_sizes || {},
      metrics: data.metrics || {},
      performance: data.performance || {},
      user_input: {
        project_type: data.user_input?.project_type?.substring(0, 50),
        team_size: data.user_input?.team_size?.substring(0, 20),
        ai_tool: data.user_input?.ai_tool?.substring(0, 50),
        feedback: data.user_input?.feedback?.substring(0, 500),
        top_benefit: data.user_input?.top_benefit?.substring(0, 200),
        top_challenge: data.user_input?.top_challenge?.substring(0, 200),
      },
      client_version: data.client_version?.substring(0, 20),
    }

    // Insert into Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase
      .from('cxms_telemetry')
      .insert(sanitized)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

---

## Client Script: `cxms-report`

### Usage Modes

```bash
# Quick mode - extracts metrics only, minimal questions
npx cxms-report

# Full mode - extracts metrics + comprehensive feedback survey
npx cxms-report --full

# Auto mode (for hooks) - no interactive prompts, uses saved consent
npx cxms-report --auto

# Preview mode - shows what would be sent without sending
npx cxms-report --dry-run

# Help
npx cxms-report --help
```

### Installation Options

```bash
# Option 1: Run directly with npx (recommended - always latest)
npx cxms-report

# Option 2: Install globally
npm install -g cxms-report
cxms-report

# Option 3: Download and run standalone (no npm required)
curl -sL https://raw.githubusercontent.com/RobSB2/CxMS/main/tools/cxms-report.mjs -o cxms-report.mjs
node cxms-report.mjs
```

### Mode Comparison

| Mode | Metrics | User Questions | Consent | Use Case |
|------|---------|----------------|---------|----------|
| Default | Full extraction | 3-4 quick questions | Interactive | Regular check-ins |
| `--full` | Full extraction | All 15+ questions | Interactive | Detailed feedback |
| `--auto` | Full extraction | None | Saved file | Hook integration |
| `--dry-run` | Full extraction | Optional | None (no send) | Preview/testing |

### Script Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. DISCOVERY                                                         │
│    - Find CxMS files in current directory                           │
│    - Check for CLAUDE.md (required)                                 │
│    - If no CxMS files found, exit with helpful message              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. EXTRACTION                                                        │
│    - Read CLAUDE.md for version and deployment level                │
│    - Count lines in each file (no content extraction)               │
│    - Parse Session.md for session count                             │
│    - Parse Tasks.md for task counts                                 │
│    - Parse Performance_Log.md for metrics (if exists)               │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. USER INPUT (Interactive, all skippable with Enter)               │
│                                                                      │
│ PROJECT CONTEXT:                                                     │
│    - "Project type?" [web/api/data/devops/ml/mobile/other]         │
│    - "Team size?" [solo/2-5/6-10/10+]                              │
│    - "Primary AI tool?" [claude-code/cursor/copilot/gemini/other]  │
│    - "Other AI tools?" [multi-select or comma-separated]           │
│    - "How long using CxMS?" [<1 week/1-4 weeks/1-3 months/3+ mos]  │
│    - "Sessions per week?" [<1/1-3/4-7/7+]                          │
│                                                                      │
│ FEEDBACK:                                                            │
│    - "Top benefit of CxMS?" [free text, 200 chars]                 │
│    - "Biggest challenge?" [free text, 200 chars]                   │
│    - "Recommendation score 1-10?" [number]                          │
│    - "Most valuable CxMS file?" [pick from your files]             │
│    - "Least used CxMS file?" [pick from your files]                │
│                                                                      │
│ FEATURE INTEREST (yes/no each):                                     │
│    - "Want automated health checks?"                                │
│    - "Want cross-project sync?"                                     │
│    - "Want log aging/archival?"                                     │
│    - "Want multi-tool support?"                                     │
│    - "Want better token efficiency?"                                │
│    - "Rank top 3 enhancements?" [show list from roadmap]           │
│                                                                      │
│ OPEN FEEDBACK:                                                       │
│    - "Any other feedback?" [free text, 500 chars]                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. CONSENT (shows formatted summary, full JSON available)           │
│    - Display human-readable summary of what will be sent           │
│    - Option to view full JSON if desired                            │
│    - "Send this data anonymously to help improve CxMS? [y/N]"      │
│    - If N, exit with "No data sent. Thanks anyway!"                │
└─────────────────────────────────────────────────────────────────────┘

### Consent Screen Example

```
════════════════════════════════════════════════════════════════════
                    DATA TO BE SUBMITTED
════════════════════════════════════════════════════════════════════

📦 Configuration
   CxMS Version:      1.4
   Deployment Level:  Standard
   Platform:          win32

📅 Project Lifecycle
   First Session:     2025-12-15 (40 days ago)
   Last Session:      2026-01-23 (1 day ago)
   Total Sessions:    23
   Recent (30d):      18

📁 Files Present (8 of 16)
   ✅ CLAUDE.md         (142 lines)
   ✅ Session.md        (187 lines)  ⚠️ >150 lines
   ✅ Tasks.md          (94 lines)
   ✅ Context.md        (67 lines)
   ✅ Decision_Log.md   (123 lines)
   ✅ Activity_Log.md   (89 lines)
   ✅ Prompt_History.md (234 lines)  ⚠️ >200 lines
   ✅ Performance_Log.md (45 lines)

📊 Metrics
   Active Tasks:       4
   Completed Tasks:    31
   Decisions Logged:   12
   Compaction Events:  2

⚡ Performance (from Performance_Log.md)
   Avg Context Restore: 2.1 minutes
   Avg Compactions:     0.3 per session
   Self-Rated:          4/5

👤 Your Feedback
   Project Type:        web
   Team Size:           solo
   Primary AI Tool:     claude-code
   Top Benefit:         "Session continuity across days"
   Top Challenge:       "Files getting long"
   Recommendation:      8/10
   Feature Requests:    Health Check, Log Aging

════════════════════════════════════════════════════════════════════

[V] View full JSON    [Y] Send    [N] Cancel

Send this data anonymously to help improve CxMS? [y/N]
```
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. SUBMIT                                                           │
│    - POST to Supabase (or Edge Function)                           │
│    - Handle errors gracefully                                       │
│    - "Thanks! Your anonymous feedback helps improve CxMS."         │
│    - Show link to public dashboard                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Script Implementation

```javascript
#!/usr/bin/env node
// cxms-report.js - CxMS Telemetry Reporter
// Version: 1.0.0

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const CLIENT_VERSION = '1.0.0';

// Files to look for
const CXMS_FILES = {
  claude_md: 'CLAUDE.md',
  session_md: '_Session.md',
  tasks_md: '_Tasks.md',
  context_md: '_Context.md',
  prompt_history_md: '_Prompt_History.md',
  activity_log_md: '_Activity_Log.md',
  decision_log_md: '_Decision_Log.md',
  issue_log_md: '_Issue_Log.md',
  deployment_md: '_Deployment.md',
  performance_log_md: '_Performance_Log.md',
};

async function main() {
  console.log('\n📊 CxMS Telemetry Reporter v' + CLIENT_VERSION);
  console.log('────────────────────────────────────────\n');

  // 1. Discovery
  const files = discoverFiles();
  if (!files.claude_md) {
    console.log('❌ No CLAUDE.md found. Is this a CxMS project?');
    console.log('   Run this from your project root directory.\n');
    process.exit(1);
  }

  console.log('✅ Found CxMS project\n');

  // 2. Extraction
  const data = extractMetrics(files);

  // 3. User Input
  const userInput = await getUserInput();
  data.user_input = userInput;

  // 4. Consent
  console.log('\n📋 Data to be submitted (anonymously):\n');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n');

  const consent = await ask('Send this data to help improve CxMS? [y/N] ');
  if (consent.toLowerCase() !== 'y') {
    console.log('\n👍 No data sent. Thanks anyway!\n');
    process.exit(0);
  }

  // 5. Submit
  try {
    await submitTelemetry(data);
    console.log('\n✅ Thanks! Your anonymous feedback helps improve CxMS.');
    console.log('   View community stats: https://github.com/RobSB2/CxMS/stats\n');
  } catch (err) {
    console.log('\n❌ Failed to submit: ' + err.message);
    console.log('   You can manually report at: https://github.com/RobSB2/CxMS/issues\n');
  }
}

function discoverFiles() {
  const found = {};
  const cwd = process.cwd();

  // Check for CLAUDE.md
  if (fs.existsSync(path.join(cwd, 'CLAUDE.md'))) {
    found.claude_md = path.join(cwd, 'CLAUDE.md');
  }

  // Check for project-specific files (any prefix)
  const allFiles = fs.readdirSync(cwd);
  for (const [key, suffix] of Object.entries(CXMS_FILES)) {
    if (key === 'claude_md') continue;
    const match = allFiles.find(f => f.endsWith(suffix));
    if (match) {
      found[key] = path.join(cwd, match);
    }
  }

  return found;
}

function extractMetrics(files) {
  const data = {
    installation_id: getOrCreateInstallationId(),
    cxms_version: null,
    deployment_level: null,
    files_present: {},
    file_sizes: {},
    metrics: {},
    performance: {},
    client_version: CLIENT_VERSION,
  };

  // Extract from CLAUDE.md
  if (files.claude_md) {
    const content = fs.readFileSync(files.claude_md, 'utf-8');

    // Extract version
    const versionMatch = content.match(/\*\*Version:\*\*\s*(\d+\.\d+)/);
    if (versionMatch) data.cxms_version = versionMatch[1];

    // Extract deployment level
    const levelMatch = content.match(/\*\*Deployment Level:\*\*\s*(\w+)/);
    if (levelMatch) data.deployment_level = levelMatch[1];
  }

  // Check presence and size of each file
  for (const [key, filepath] of Object.entries(files)) {
    data.files_present[key] = true;
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf-8');
      data.file_sizes[key] = content.split('\n').length;
    }
  }

  // Extract session count from Session.md
  if (files.session_md && fs.existsSync(files.session_md)) {
    const content = fs.readFileSync(files.session_md, 'utf-8');
    const sessionMatches = content.match(/##\s*Session\s*\d+/gi);
    if (sessionMatches) {
      data.metrics.session_count = sessionMatches.length;
    }
  }

  // Extract task counts from Tasks.md
  if (files.tasks_md && fs.existsSync(files.tasks_md)) {
    const content = fs.readFileSync(files.tasks_md, 'utf-8');
    const activeMatches = content.match(/\[ \]/g);
    const completedMatches = content.match(/\[x\]/gi);
    data.metrics.task_count_active = activeMatches ? activeMatches.length : 0;
    data.metrics.task_count_completed = completedMatches ? completedMatches.length : 0;
  }

  // Extract from Performance_Log.md if exists
  if (files.performance_log_md && fs.existsSync(files.performance_log_md)) {
    const content = fs.readFileSync(files.performance_log_md, 'utf-8');
    // Parse metrics table - simplified extraction
    // Real implementation would be more robust
  }

  return data;
}

function getOrCreateInstallationId() {
  const idFile = path.join(process.cwd(), '.cxms', '.telemetry_id');

  if (fs.existsSync(idFile)) {
    return fs.readFileSync(idFile, 'utf-8').trim();
  }

  const id = crypto.randomUUID();

  // Create .cxms directory if needed
  const cxmsDir = path.join(process.cwd(), '.cxms');
  if (!fs.existsSync(cxmsDir)) {
    fs.mkdirSync(cxmsDir, { recursive: true });
  }

  fs.writeFileSync(idFile, id);
  return id;
}

async function getUserInput() {
  const input = {};

  console.log('📝 Optional questions (press Enter to skip):\n');

  input.project_type = await ask('Project type? [web/api/data/devops/other] ');
  input.team_size = await ask('Team size? [solo/2-5/6-10/10+] ');
  input.ai_tool = await ask('AI tool? [claude-code/cursor/copilot/other] ');
  input.top_benefit = await ask('Top benefit of CxMS? ');
  input.top_challenge = await ask('Biggest challenge? ');
  input.feedback = await ask('Any other feedback? (max 500 chars) ');

  // Clean up empty strings
  for (const key of Object.keys(input)) {
    if (!input[key]) delete input[key];
    else if (key === 'feedback') input[key] = input[key].substring(0, 500);
  }

  return input;
}

function ask(question) {
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

async function submitTelemetry(data) {
  const url = new URL('/rest/v1/cxms_telemetry', SUPABASE_URL);

  const postData = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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

main().catch(console.error);
```

---

---

## Recommended Submission Cadence

### When to Submit

| Trigger | Why | Mode |
|---------|-----|------|
| **First week** | Baseline data, onboarding experience | `--full` (comprehensive) |
| **Monthly** | Track trends, provide ongoing feedback | Default (quick) |
| **After major milestone** | Capture effectiveness at key points | Default |
| **When prompted by version update** | Help track version adoption | Default |
| **When frustrated** | Capture pain points while fresh | `--full` (to explain) |
| **When delighted** | Capture what's working well | `--full` (to explain) |

### Submission Frequency Guidelines

- **Minimum valuable**: Once per project (baseline only)
- **Recommended**: Monthly (tracks trends, builds dataset)
- **Power user**: After each significant project phase
- **Automated**: Via hook at session end (opt-in only)

### Multiple Projects

If you use CxMS on multiple projects, submit from each project that has meaningful data. Each project gets its own `installation_id` so we can track multi-project patterns without identifying you.

### Longitudinal Value

Repeated submissions from the same installation are valuable for:
- Tracking effectiveness improvements over time
- Understanding learning curves
- Identifying when/why people stop using features
- Measuring impact of CxMS version updates

---

## Claude Code Hook Integration (Future)

For users who want automatic reporting, a hook could trigger at session end:

```json
// .claude/hooks.json
{
  "session_end": {
    "command": "npx cxms-report --auto",
    "condition": "always"
  }
}
```

The `--auto` flag would:
- Skip user input questions
- Show what would be sent
- Require explicit consent file (`.cxms/.telemetry_consent`) to auto-submit
- If no consent file, prompt once and remember choice

---

## Public Dashboard

### Option A: GitHub Pages Static Site

```
cxms-stats/
├── index.html          # Dashboard UI
├── data/
│   └── stats.json      # Periodically updated aggregate data
└── update.yml          # GitHub Action to refresh stats
```

The GitHub Action fetches from Supabase view and commits updated JSON.

### Option B: Simple README Stats

Add to CxMS README:

```markdown
## Community Stats

![Installations](https://img.shields.io/badge/installations-147-blue)
![Submissions](https://img.shields.io/badge/submissions-312-green)

| Metric | Value |
|--------|-------|
| Avg Context Restore Time | 2.3 min |
| Avg Compaction Events | 0.4/session |
| Most Used File | Session.md (98%) |

*Updated weekly from anonymous telemetry. [Submit your stats](./tools/cxms-report)*
```

### Option C: Full Dashboard (If Adoption Grows)

React/Vue app hosted on Vercel showing:
- Real-time submission count
- Version distribution pie chart
- File adoption bar chart
- Metric trends over time
- Word cloud from feedback

---

## Privacy Policy

```markdown
## CxMS Telemetry Privacy Policy

**What we collect:**
- Anonymous installation ID (UUID, not tied to you)
- CxMS version and configuration
- File names and line counts (NOT contents)
- Aggregated metrics (session counts, task counts)
- Optional user-provided feedback

**What we DO NOT collect:**
- Personal information
- Project names or paths
- File contents, code, or secrets
- IP addresses (Supabase doesn't log these by default)
- Anything identifiable

**How we use it:**
- Improve CxMS templates and documentation
- Understand usage patterns
- Validate effectiveness claims
- Publish aggregated community statistics

**Data retention:**
- Aggregated data kept indefinitely
- Individual submissions: 1 year, then deleted

**Your rights:**
- Telemetry is strictly opt-in
- You see exactly what's sent before submission
- No automatic data collection ever
- Contact us to request deletion of your submissions

**Changes:**
- Policy changes announced in GitHub releases
- Existing data not retroactively used for new purposes
```

---

## Implementation Roadmap

### Phase 1: Backend (Week 1)
- [ ] Create Supabase project for CxMS telemetry
- [ ] Deploy database schema
- [ ] Test insert/view permissions
- [ ] Create aggregated view

### Phase 2: Client Script (Week 1-2)
- [ ] Build `cxms-report.js` script
- [ ] Test on CxMS and LPR projects
- [ ] Publish to npm as `cxms-report`
- [ ] Add to CxMS repo under `tools/`

### Phase 3: Documentation (Week 2)
- [ ] Write privacy policy
- [ ] Add to CxMS README
- [ ] Create submission instructions
- [ ] Document in SESSION_END_CHECKLIST.md

### Phase 4: Dashboard (Week 3+)
- [ ] Create simple stats endpoint
- [ ] Add badges to README
- [ ] (Optional) Build full dashboard

### Phase 5: Hook Integration (Future)
- [ ] Define hook spec
- [ ] Implement `--auto` mode
- [ ] Document consent flow

---

## Comparison: Issue Form vs Automated Telemetry

| Aspect | GitHub Issue Form (E13) | Automated Telemetry |
|--------|-------------------------|---------------------|
| Friction | High (manual entry) | Low (one command) |
| Data accuracy | User-reported, may be estimated | Extracted from actual files |
| Data completeness | Often partial | Comprehensive |
| Standardization | Varies by submitter | Consistent schema |
| Qualitative feedback | Good | Optional, less detailed |
| Privacy | Public issue | Anonymous + aggregated |
| Implementation | Already done | Needs development |
| Maintenance | Low | Medium (script updates) |

**Recommendation:** Use both. Keep the issue form for detailed case studies with narrative. Add telemetry for broad, quantitative data collection.

---

## Open Questions & Decisions Needed

### 1. Data Extraction Depth

**Question:** How much should the script extract automatically vs ask the user?

| Approach | Pros | Cons |
|----------|------|------|
| Extract everything possible | Less user friction, accurate data | May miss context only user knows |
| Minimal extraction + questions | User provides context | Higher friction, may get less responses |
| **Recommended: Hybrid** | Extract all we can, ask 3-4 key questions in default mode, full survey in `--full` mode |

### 2. Session/Task Date Parsing

**Question:** How to extract dates from unstructured markdown?

- Option A: Regex patterns for common formats (2026-01-24, Jan 24, etc.)
- Option B: Rely on file modification timestamps only
- Option C: Ask user for approximate dates
- **Recommended:** Try regex, fall back to file timestamps, never ask (reduces friction)

### 3. Performance Log Parsing

**Question:** Performance_Log.md has tabular data - how robust should parsing be?

- Option A: Strict format matching (may miss variations)
- Option B: Flexible parsing with fallbacks
- Option C: Just detect presence, let user report metrics
- **Recommended:** Flexible parsing, graceful degradation, report what we can extract

### 4. Enhancement Priority Collection

**Question:** How to collect enhancement demand without bias?

- Option A: Checkbox list (easy, but all may seem equally wanted)
- Option B: Ranking (forces prioritization, but more cognitive load)
- Option C: "Pick your top 3" (good balance)
- **Recommended:** "Pick top 3" in `--full` mode, skip in default mode

### 5. Dashboard Implementation

**Question:** What level of dashboard to build initially?

| Level | Implementation | Value |
|-------|----------------|-------|
| MVP | Badges in README + raw view links | Quick, validates data collection |
| Nice | Static GitHub Pages with charts | Better visualization, low maintenance |
| Full | React app with filters | Best UX, highest maintenance |
| **Recommended:** Start MVP, build Nice after 50+ submissions |

### 6. Backend Choice

**Question:** Confirmed Supabase?

- Free tier handles expected volume (thousands of rows)
- Familiar from Apprentice project
- Good JSONB support for flexible schema
- Row Level Security for privacy
- **Decision: Yes, use Supabase**

### 7. Consent Persistence

**Question:** How to handle consent for `--auto` mode?

- Option A: One-time consent stored in `.cxms/.telemetry_consent`
- Option B: Per-submission consent always required
- Option C: Project-level `.cxms/telemetry.config.json` with settings
- **Recommended:** Option C - config file with `{"consent": true, "mode": "auto", "frequency": "monthly"}`

---

## Next Steps

### Phase 1: Finalize Spec (Now)
- [x] Define comprehensive data collection categories
- [x] Map data to actionable insights
- [x] Design database schema
- [x] Design user experience flow
- [ ] **Review with human - any data gaps?**
- [ ] **Decide on open questions above**

### Phase 2: Backend Setup
- [ ] Create Supabase project: `cxms-telemetry`
- [ ] Deploy database schema
- [ ] Create aggregated views
- [ ] Test RLS policies
- [ ] Create initial dashboard view (even if just SQL queries)

### Phase 3: Client Script MVP
- [ ] Build `cxms-report.mjs` with core extraction
- [ ] Implement default mode (metrics + 3-4 questions)
- [ ] Implement `--dry-run` for testing
- [ ] Test on CxMS repo
- [ ] Test on LPR project

### Phase 4: Documentation & Launch
- [ ] Add privacy policy to CxMS repo
- [ ] Document in README
- [ ] Add to SESSION_END_CHECKLIST.md
- [ ] Submit first real telemetry from CxMS and LPR
- [ ] Publish to npm as `cxms-report`

### Phase 5: Iterate
- [ ] Build `--full` mode with comprehensive survey
- [ ] Create GitHub Pages dashboard (after 50+ submissions)
- [ ] Implement `--auto` mode with consent config
- [ ] Add hook integration documentation

---

---

## Extension: Universal Multi-Agent Coordination Protocol

### The Vision

A tool-agnostic coordination layer that enables:
- **Any AI** (Claude, Gemini, ChatGPT, Cursor, Copilot, etc.) to participate
- **PM/Orchestrator pattern** where one AI coordinates others
- **Heterogeneous environments** working together
- **No centralized infrastructure** - just files

### Why File-Based?

| Approach | Pros | Cons |
|----------|------|------|
| API-based coordination | Real-time, structured | Requires server, tool integration |
| Database | Queryable, transactional | Requires infrastructure |
| **File-based** | Universal, zero dependencies, any AI can read/write | Polling, potential conflicts |

Files are the only truly universal interface. Every AI coding tool can read and write files.

### Universal Agent Coordination Format (UACF)

#### 1. Agent Registry File

```markdown
# .cxms/AGENT_REGISTRY.md

## Active Agents

| Agent ID | Tool | Role | Status | Current Task | Last Heartbeat |
|----------|------|------|--------|--------------|----------------|
| claude-main | Claude Code CLI | PM/Orchestrator | active | Coordinating | 2026-01-24T14:30:00Z |
| gemini-worker-1 | Gemini CLI | Worker | active | TASK-003 | 2026-01-24T14:29:00Z |
| cursor-worker-2 | Cursor AI | Worker | idle | - | 2026-01-24T14:25:00Z |
| gpt-analyst | ChatGPT | Analyst | active | Research | 2026-01-24T14:28:00Z |

## Agent Capabilities

| Agent ID | Can Edit | Can Run Commands | Can Search Web | Specialization |
|----------|----------|------------------|----------------|----------------|
| claude-main | Yes | Yes | Yes | Full-stack, orchestration |
| gemini-worker-1 | Yes | Yes | Yes | Frontend, React |
| cursor-worker-2 | Yes | Limited | No | Code completion |
| gpt-analyst | No | No | Yes | Research, analysis |

## Heartbeat Protocol

Agents update their `Last Heartbeat` every 5 minutes when active.
If no heartbeat for 15 minutes, consider agent inactive.
```

#### 2. Task Queue File

```markdown
# .cxms/TASK_QUEUE.md

## Pending Tasks

### TASK-004
- **Priority:** High
- **Description:** Implement user authentication flow
- **Required Capabilities:** Can Edit, Can Run Commands
- **Assigned To:** (unassigned)
- **Blocked By:** None
- **Created:** 2026-01-24T14:00:00Z
- **Created By:** claude-main

### TASK-005
- **Priority:** Medium
- **Description:** Research best practices for JWT refresh tokens
- **Required Capabilities:** Can Search Web
- **Assigned To:** gpt-analyst
- **Blocked By:** None
- **Created:** 2026-01-24T14:05:00Z
- **Created By:** claude-main

## In Progress

### TASK-003
- **Assigned To:** gemini-worker-1
- **Started:** 2026-01-24T14:15:00Z
- **Description:** Build login form component
- **Progress:** 60% - Form structure complete, adding validation
- **Last Update:** 2026-01-24T14:28:00Z

## Completed

### TASK-001 ✓
- **Completed By:** cursor-worker-2
- **Completed:** 2026-01-24T13:45:00Z
- **Result:** Created project scaffold
```

#### 3. Agent Communication File

```markdown
# .cxms/AGENT_MESSAGES.md

## Messages (newest first)

### MSG-2026-01-24-003
- **From:** gemini-worker-1
- **To:** claude-main
- **Time:** 2026-01-24T14:28:00Z
- **Type:** Question
- **Message:** Should the login form redirect to /dashboard or /home after success?
- **Status:** Pending
- **Response:** (awaiting)

### MSG-2026-01-24-002
- **From:** claude-main
- **To:** ALL
- **Time:** 2026-01-24T14:10:00Z
- **Type:** Announcement
- **Message:** Authentication module is priority. All workers should complete current tasks then pick up auth-related items.
- **Status:** Acknowledged by: gemini-worker-1, gpt-analyst

### MSG-2026-01-24-001
- **From:** gpt-analyst
- **To:** claude-main
- **Time:** 2026-01-24T14:05:00Z
- **Type:** Report
- **Message:** Research complete. JWT best practices documented in docs/AUTH_RESEARCH.md. Key finding: Use short-lived access tokens (15 min) with longer refresh tokens (7 days).
- **Status:** Acknowledged
```

#### 4. Shared Context File

```markdown
# .cxms/SHARED_CONTEXT.md

## Project State

**Last Updated:** 2026-01-24T14:30:00Z
**Updated By:** claude-main

### Current Sprint

Goal: Implement user authentication
Deadline: 2026-01-26
Progress: 35%

### Key Decisions

| Decision | Made By | Date | Rationale |
|----------|---------|------|-----------|
| Use JWT for auth | claude-main | 2026-01-24 | Stateless, scales well |
| Supabase for backend | Human | 2026-01-23 | Free tier, integrated auth |
| React + TypeScript | Human | 2026-01-23 | Team familiarity |

### Files Modified Today

| File | Last Modified By | Summary |
|------|------------------|---------|
| src/components/Login.tsx | gemini-worker-1 | Login form WIP |
| src/lib/auth.ts | cursor-worker-2 | Auth utilities scaffold |
| docs/AUTH_RESEARCH.md | gpt-analyst | JWT best practices |

### Blockers

- None currently

### Notes for All Agents

- Use Tailwind for styling (no custom CSS)
- Follow existing patterns in src/components/
- Run tests before marking tasks complete
```

### Orchestrator Protocol

The PM/Orchestrator agent (typically the one with most capabilities) follows this protocol:

```markdown
## Orchestrator Responsibilities

1. **Monitor Agent Registry** (every 5 min)
   - Check heartbeats
   - Identify inactive agents
   - Reassign stalled tasks

2. **Manage Task Queue**
   - Create tasks from user requests
   - Prioritize and sequence tasks
   - Assign based on agent capabilities
   - Unblock dependent tasks

3. **Facilitate Communication**
   - Answer agent questions
   - Broadcast important decisions
   - Maintain shared context

4. **Quality Control**
   - Review completed work
   - Provide feedback via messages
   - Escalate issues to human

## Orchestrator Actions

### Assigning a Task
1. Check TASK_QUEUE.md for unassigned tasks
2. Check AGENT_REGISTRY.md for capable, idle agents
3. Update task assignment
4. Send message to assigned agent

### Handling Agent Question
1. Check AGENT_MESSAGES.md for pending questions
2. Provide answer (or escalate to human)
3. Update message status

### Updating Shared Context
1. After any significant event
2. When decisions are made
3. When blockers arise or resolve
```

### Worker Protocol

Worker agents follow this protocol:

```markdown
## Worker Responsibilities

1. **Maintain Heartbeat**
   - Update AGENT_REGISTRY.md every 5 min when active
   - Update status (active/idle)
   - Update current task

2. **Execute Assigned Tasks**
   - Check TASK_QUEUE.md for tasks assigned to you
   - Update progress as you work
   - Mark complete when done

3. **Communicate Issues**
   - Post questions to AGENT_MESSAGES.md
   - Report blockers
   - Share findings

4. **Follow Shared Context**
   - Read SHARED_CONTEXT.md at session start
   - Follow documented decisions
   - Don't contradict established patterns
```

### Tool-Specific Implementation Notes

| Tool | Read Files | Write Files | Heartbeat Method |
|------|------------|-------------|------------------|
| Claude Code CLI | Yes | Yes | Update file directly |
| Gemini CLI | Yes | Yes | Update file directly |
| Cursor AI | Yes | Limited (accepts/rejects) | Via accepted edit |
| GitHub Copilot | Yes (context) | Via suggestions | Not feasible |
| ChatGPT | Yes (paste in) | No (copy out) | Manual update |
| Aider | Yes | Yes | Update file directly |

**Note:** Tools that can't write files directly can still participate by having a human intermediary update their status, or by outputting instructions that another agent executes.

### Example Workflow

```
1. Human: "Build a login system"

2. Claude (Orchestrator):
   - Creates TASK-001: "Research auth approaches"
   - Creates TASK-002: "Design login flow"
   - Creates TASK-003: "Build login form"
   - Creates TASK-004: "Implement auth API"
   - Assigns TASK-001 to gpt-analyst (web search capability)

3. ChatGPT (Analyst):
   - Researches, creates docs/AUTH_RESEARCH.md
   - Posts completion message
   - Updates own heartbeat

4. Claude (Orchestrator):
   - Marks TASK-001 complete
   - Assigns TASK-002 to self
   - Assigns TASK-003 to gemini-worker

5. Gemini (Worker):
   - Picks up TASK-003
   - Builds Login.tsx
   - Posts question about redirect location
   - Waits for response

6. Claude (Orchestrator):
   - Answers question
   - Updates shared context

7. [Continue until all tasks complete]
```

### Telemetry Integration

The multi-agent coordination can feed back into telemetry:

```typescript
// Additional telemetry fields for multi-agent setups
multi_agent?: {
  is_multi_agent_project: boolean;
  agent_count: number;
  orchestrator_tool: string;
  worker_tools: string[];
  coordination_files_present: boolean;
  tasks_completed_by_agent: { [agent: string]: number };
  avg_task_handoff_time_minutes: number;
  cross_agent_messages_count: number;
}
```

This data would help us understand:
- How common are multi-agent setups?
- Which tool combinations work best?
- What coordination overhead exists?
- Are there patterns that predict success?

---

## Document History

| Date | Changes |
|------|---------|
| 2026-01-24 | Initial spec created |
| 2026-01-24 | Expanded to comprehensive data collection (11 categories) |
| 2026-01-24 | Added insight mapping and sample dashboard views |
| 2026-01-24 | Added user experience modes and consent screen example |

---

*This spec is a living document. Update as implementation progresses.*
