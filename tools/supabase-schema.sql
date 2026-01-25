-- ============================================
-- CxMS TELEMETRY - SUPABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor to set up telemetry collection
-- Version: 1.0
-- Date: 2026-01-24

-- ============================================
-- MAIN TABLE
-- ============================================
create table if not exists cxms_telemetry (
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
  lifecycle jsonb default '{}',
  files jsonb default '{}',
  tasks jsonb default '{}',
  tracking jsonb default '{}',
  context_health jsonb default '{}',
  performance jsonb default '{}',
  environment jsonb default '{}',         -- includes timezone, locale, utc_offset
  user_context jsonb default '{}',        -- includes country (user-provided)
  feedback jsonb default '{}',
  feature_interest jsonb default '{}',
  timing jsonb default '{}',              -- script_start_time, script_duration_seconds
  session_end jsonb default '{}',         -- ended_due_to_compaction, context_percent_at_end

  -- Metadata
  submitted_at timestamp with time zone default now(),

  -- Constraints
  constraint valid_deployment_level check (
    deployment_level in ('Lite', 'Standard', 'Max', null)
  )
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_telemetry_submitted_at on cxms_telemetry(submitted_at);
create index if not exists idx_telemetry_installation on cxms_telemetry(installation_id);
create index if not exists idx_telemetry_install_time on cxms_telemetry(installation_id, submitted_at);
create index if not exists idx_telemetry_version on cxms_telemetry(cxms_version);
create index if not exists idx_telemetry_level on cxms_telemetry(deployment_level);

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
-- AGGREGATED VIEWS (Public Dashboard)
-- ============================================

-- Overview Statistics
create or replace view cxms_stats_overview as
select
  count(distinct installation_id) as unique_installations,
  count(*) as total_submissions,
  count(distinct installation_id) filter (
    where submitted_at > now() - interval '30 days'
  ) as active_30d,
  round(avg((lifecycle->>'project_age_days')::numeric), 1) as avg_project_age_days,
  round(avg((performance->>'self_rated_effectiveness')::numeric), 2) as avg_effectiveness,
  round(avg((performance->>'avg_context_restore_minutes')::numeric), 2) as avg_restore_minutes,
  round(avg((performance->>'avg_compaction_events')::numeric), 2) as avg_compactions,
  count(*) filter (where (session_end->>'ended_due_to_compaction')::boolean = true) as sessions_ended_by_compaction,
  round(avg((session_end->>'context_percent_at_end')::numeric) filter (where (session_end->>'ended_due_to_compaction')::boolean = true), 1) as avg_compaction_context_pct,
  min(submitted_at) as first_submission,
  max(submitted_at) as latest_submission
from cxms_telemetry;

-- By Deployment Level
create or replace view cxms_stats_by_level as
select
  deployment_level,
  count(distinct installation_id) as installations,
  round(avg((performance->>'avg_context_restore_minutes')::numeric), 2) as avg_restore,
  round(avg((performance->>'avg_compaction_events')::numeric), 2) as avg_compactions,
  round(avg((performance->>'self_rated_effectiveness')::numeric), 2) as avg_effectiveness
from cxms_telemetry
where deployment_level is not null
group by deployment_level
order by installations desc;

-- File Adoption
create or replace view cxms_stats_file_adoption as
select
  count(distinct installation_id) as total,
  count(distinct installation_id) filter (where (files->'present'->>'session_md')::boolean) as session_md,
  count(distinct installation_id) filter (where (files->'present'->>'tasks_md')::boolean) as tasks_md,
  count(distinct installation_id) filter (where (files->'present'->>'context_md')::boolean) as context_md,
  count(distinct installation_id) filter (where (files->'present'->>'decision_log_md')::boolean) as decision_log,
  count(distinct installation_id) filter (where (files->'present'->>'activity_log_md')::boolean) as activity_log,
  count(distinct installation_id) filter (where (files->'present'->>'performance_log_md')::boolean) as performance_log,
  count(distinct installation_id) filter (where (files->'present'->>'prompt_history_md')::boolean) as prompt_history
from cxms_telemetry;

-- Version Distribution
create or replace view cxms_stats_versions as
select
  cxms_version,
  count(distinct installation_id) as installations,
  count(*) as submissions
from cxms_telemetry
where cxms_version is not null
group by cxms_version
order by cxms_version desc;

-- Geographic Distribution
create or replace view cxms_stats_geography as
select
  environment->>'timezone' as timezone,
  environment->>'locale' as locale,
  user_context->>'country' as country,
  count(distinct installation_id) as installations,
  round(avg((timing->>'script_duration_seconds')::numeric), 1) as avg_script_duration_sec
from cxms_telemetry
group by
  environment->>'timezone',
  environment->>'locale',
  user_context->>'country'
order by installations desc;

-- Feature Demand
create or replace view cxms_stats_features as
select
  count(*) as total_responses,
  count(*) filter (where (feature_interest->>'wants_auto_health_check')::boolean) as health_check,
  count(*) filter (where (feature_interest->>'wants_log_aging')::boolean) as log_aging,
  count(*) filter (where (feature_interest->>'wants_multi_tool_support')::boolean) as multi_tool,
  count(*) filter (where (feature_interest->>'wants_cross_project_sync')::boolean) as cross_project,
  count(*) filter (where (feature_interest->>'wants_better_token_efficiency')::boolean) as token_efficiency
from cxms_telemetry
where feature_interest != '{}';

-- Grant read access to views
grant select on cxms_stats_overview to anon;
grant select on cxms_stats_by_level to anon;
grant select on cxms_stats_file_adoption to anon;
grant select on cxms_stats_versions to anon;
grant select on cxms_stats_geography to anon;
grant select on cxms_stats_features to anon;

-- ============================================
-- DONE
-- ============================================
-- After running this, get your keys from:
-- Supabase Dashboard → Settings → API
-- - Project URL → SUPABASE_URL
-- - anon public key → SUPABASE_ANON_KEY
