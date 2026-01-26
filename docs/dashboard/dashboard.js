/**
 * CxMS Community Dashboard
 * Fetches and visualizes telemetry data from Supabase
 */

// Supabase Configuration
const SUPABASE_URL = 'https://pubuchklneufckmvatmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1YnVjaGtsbmV1ZmNrbXZhdG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDE1NDUsImV4cCI6MjA4NDg3NzU0NX0.K3xZJ5zi8xoJvEWTnGvLIlxkSu5ecpsslKICcXpTM2A';

// Chart.js default configuration
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.color = '#64748b';

// Color palette
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  chart: [
    '#2563eb', '#7c3aed', '#db2777', '#ea580c',
    '#16a34a', '#0891b2', '#4f46e5', '#c026d3'
  ]
};

// Timezone to Region mapping
const TIMEZONE_REGIONS = {
  'America/': 'Americas',
  'US/': 'Americas',
  'Canada/': 'Americas',
  'Brazil/': 'Americas',
  'Europe/': 'Europe',
  'GMT': 'Europe',
  'UTC': 'Europe',
  'Asia/': 'Asia-Pacific',
  'Australia/': 'Asia-Pacific',
  'Pacific/': 'Asia-Pacific',
  'Japan': 'Asia-Pacific',
  'Africa/': 'Africa',
};

function mapTimezoneToRegion(timezone) {
  if (!timezone) return 'Unknown';
  for (const [prefix, region] of Object.entries(TIMEZONE_REGIONS)) {
    if (timezone.startsWith(prefix)) {
      return region;
    }
  }
  return 'Other';
}

function mapCountryToRegion(country) {
  if (!country) return 'Unknown';
  const c = country.toLowerCase();
  if (['usa', 'us', 'united states', 'canada', 'mexico', 'brazil'].some(x => c.includes(x))) return 'Americas';
  if (['uk', 'united kingdom', 'germany', 'france', 'spain', 'italy', 'netherlands'].some(x => c.includes(x))) return 'Europe';
  if (['china', 'japan', 'india', 'australia', 'korea', 'singapore'].some(x => c.includes(x))) return 'Asia-Pacific';
  if (['israel', 'uae', 'saudi', 'turkey'].some(x => c.includes(x))) return 'Middle East';
  if (['south africa', 'nigeria', 'egypt', 'kenya'].some(x => c.includes(x))) return 'Africa';
  return 'Other';
}

// Fetch data from Supabase view
async function fetchView(viewName) {
  const url = `${SUPABASE_URL}/rest/v1/${viewName}?select=*`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${viewName}: ${response.status}`);
  }
  return response.json();
}

// Update hero stat card
function updateStat(elementId, value, suffix = '') {
  const el = document.querySelector(`#${elementId} .stat-value`);
  if (el) {
    el.innerHTML = value !== null && value !== undefined ? `${value}${suffix}` : '--';
  }
}

// Show error state
function showError() {
  document.getElementById('error-state').classList.remove('hidden');
  document.querySelectorAll('.chart-card').forEach(el => el.classList.add('hidden'));
}

// Render File Adoption Chart (horizontal bar)
function renderFileAdoptionChart(data) {
  const ctx = document.getElementById('chart-file-adoption').getContext('2d');

  // Transform single-row data into array format
  // View returns: {total, session_md, tasks_md, context_md, ...}
  const row = data[0] || {};
  const fileTypes = [
    { name: 'Session', key: 'session_md' },
    { name: 'Tasks', key: 'tasks_md' },
    { name: 'Context', key: 'context_md' },
    { name: 'Decision Log', key: 'decision_log' },
    { name: 'Activity Log', key: 'activity_log' },
    { name: 'Performance Log', key: 'performance_log' },
    { name: 'Prompt History', key: 'prompt_history' },
  ];

  const items = fileTypes
    .map(f => ({ name: f.name, count: row[f.key] || 0 }))
    .sort((a, b) => b.count - a.count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: items.map(i => i.name),
      datasets: [{
        label: 'Installations',
        data: items.map(i => i.count),
        backgroundColor: COLORS.primary,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: '#e2e8f0' } },
        y: { grid: { display: false } }
      }
    }
  });
}

// Render Deployment Level Chart (grouped bar)
function renderDeploymentChart(data) {
  const ctx = document.getElementById('chart-deployment').getContext('2d');

  const levels = data.map(d => d.deployment_level || 'Unknown');
  const installations = data.map(d => d.installations || 0);
  const compactions = data.map(d => d.avg_compactions || 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: levels,
      datasets: [
        {
          label: 'Installations',
          data: installations,
          backgroundColor: COLORS.primary,
          borderRadius: 4,
        },
        {
          label: 'Avg Compactions',
          data: compactions,
          backgroundColor: COLORS.warning,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#e2e8f0' } }
      }
    }
  });
}

// Render Feature Demand Chart (horizontal bar)
function renderFeaturesChart(data) {
  const ctx = document.getElementById('chart-features').getContext('2d');

  // Transform single-row data into array format
  // View returns: {total_responses, health_check, log_aging, multi_tool, ...}
  const row = data[0] || {};
  const features = [
    { name: 'Health Check', key: 'health_check' },
    { name: 'Log Aging', key: 'log_aging' },
    { name: 'Multi-Tool', key: 'multi_tool' },
    { name: 'Cross-Project', key: 'cross_project' },
    { name: 'Token Efficiency', key: 'token_efficiency' },
  ];

  const items = features
    .map(f => ({ name: f.name, count: row[f.key] || 0 }))
    .sort((a, b) => b.count - a.count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: items.map(i => i.name),
      datasets: [{
        label: 'Requests',
        data: items.map(i => i.count),
        backgroundColor: COLORS.chart[1],
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: '#e2e8f0' } },
        y: { grid: { display: false } }
      }
    }
  });
}

// Render Version Distribution Chart (doughnut)
function renderVersionsChart(data) {
  const ctx = document.getElementById('chart-versions').getContext('2d');

  const labels = data.map(d => `v${d.cxms_version || 'Unknown'}`);
  const values = data.map(d => d.installations || 0);

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: COLORS.chart,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { padding: 15 } }
      }
    }
  });
}

// Render Geographic Distribution Chart (bar)
function renderGeographyChart(data) {
  const ctx = document.getElementById('chart-geography').getContext('2d');

  // Aggregate by region
  const regionCounts = {};
  data.forEach(d => {
    let region = d.country ? mapCountryToRegion(d.country) : mapTimezoneToRegion(d.timezone);
    regionCounts[region] = (regionCounts[region] || 0) + (d.installations || 1);
  });

  const sorted = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([region]) => region);
  const values = sorted.map(([, count]) => count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Users',
        data: values,
        backgroundColor: COLORS.chart.slice(0, labels.length),
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#e2e8f0' } }
      }
    }
  });
}

// Main initialization
async function initDashboard() {
  try {
    const [overview, fileAdoption, byLevel, features, versions, geography] = await Promise.all([
      fetchView('cxms_stats_overview'),
      fetchView('cxms_stats_file_adoption'),
      fetchView('cxms_stats_by_level'),
      fetchView('cxms_stats_features'),
      fetchView('cxms_stats_versions'),
      fetchView('cxms_stats_geography'),
    ]);

    // Update hero stats (using correct field names from view)
    if (overview && overview.length > 0) {
      const stats = overview[0];
      updateStat('stat-installations', stats.unique_installations);
      updateStat('stat-active', stats.active_30d);
      updateStat('stat-effectiveness', stats.avg_effectiveness?.toFixed(1), '/5');
      updateStat('stat-restore', stats.avg_restore_minutes?.toFixed(1), ' min');
    }

    // Render charts
    if (fileAdoption && fileAdoption.length > 0) renderFileAdoptionChart(fileAdoption);
    if (byLevel && byLevel.length > 0) renderDeploymentChart(byLevel);
    if (features && features.length > 0) renderFeaturesChart(features);
    if (versions && versions.length > 0) renderVersionsChart(versions);
    if (geography && geography.length > 0) renderGeographyChart(geography);

  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showError();
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
