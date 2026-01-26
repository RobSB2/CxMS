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
  // Americas
  'America/': 'Americas',
  'US/': 'Americas',
  'Canada/': 'Americas',
  'Brazil/': 'Americas',

  // Europe
  'Europe/': 'Europe',
  'GMT': 'Europe',
  'UTC': 'Europe',

  // Asia Pacific
  'Asia/': 'Asia-Pacific',
  'Australia/': 'Asia-Pacific',
  'Pacific/': 'Asia-Pacific',
  'Japan': 'Asia-Pacific',

  // Africa
  'Africa/': 'Africa',

  // Middle East
  'Asia/Dubai': 'Middle East',
  'Asia/Jerusalem': 'Middle East',
  'Asia/Tehran': 'Middle East',
  'Asia/Riyadh': 'Middle East',
};

function mapTimezoneToRegion(timezone) {
  if (!timezone) return 'Unknown';

  // Check specific timezone first
  for (const [prefix, region] of Object.entries(TIMEZONE_REGIONS)) {
    if (timezone.startsWith(prefix)) {
      return region;
    }
  }

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

  // Sort by count descending
  const sorted = [...data].sort((a, b) => b.count - a.count);

  // Format file names
  const labels = sorted.map(d => {
    const name = d.file_type || d.file_name || 'Unknown';
    return name.replace(/_/g, ' ').replace(/ md$/, '');
  });

  const values = sorted.map(d => d.count || 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Installations',
        data: values,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });
}

// Render Deployment Level Chart (grouped bar)
function renderDeploymentChart(data) {
  const ctx = document.getElementById('chart-deployment').getContext('2d');

  const levels = data.map(d => d.deployment_level || 'Unknown');
  const effectiveness = data.map(d => d.avg_effectiveness || 0);
  const restoreTime = data.map(d => d.avg_restore_time || 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: levels,
      datasets: [
        {
          label: 'Effectiveness (1-5)',
          data: effectiveness,
          backgroundColor: COLORS.success,
          borderRadius: 4,
        },
        {
          label: 'Restore Time (min)',
          data: restoreTime,
          backgroundColor: COLORS.warning,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' }
        }
      }
    }
  });
}

// Render Feature Demand Chart (horizontal bar)
function renderFeaturesChart(data) {
  const ctx = document.getElementById('chart-features').getContext('2d');

  // Sort by count descending
  const sorted = [...data].sort((a, b) => b.count - a.count);

  const labels = sorted.map(d => {
    const name = d.feature_name || d.feature || 'Unknown';
    return name.replace(/wants_/g, '').replace(/_/g, ' ');
  });

  const values = sorted.map(d => d.count || 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Requests',
        data: values,
        backgroundColor: COLORS.chart[1],
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });
}

// Render Version Distribution Chart (doughnut)
function renderVersionsChart(data) {
  const ctx = document.getElementById('chart-versions').getContext('2d');

  const labels = data.map(d => `v${d.cxms_version || 'Unknown'}`);
  const values = data.map(d => d.count || 0);

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
        legend: {
          position: 'right',
          labels: { padding: 20 }
        }
      }
    }
  });
}

// Render Geographic Distribution Chart (bar)
function renderGeographyChart(data) {
  const ctx = document.getElementById('chart-geography').getContext('2d');

  // Aggregate by region using timezone mapping
  const regionCounts = {};

  data.forEach(d => {
    // First check if country is provided
    let region;
    if (d.country) {
      // Map country to region
      region = mapCountryToRegion(d.country);
    } else {
      // Fall back to timezone mapping
      region = mapTimezoneToRegion(d.timezone);
    }

    regionCounts[region] = (regionCounts[region] || 0) + (d.count || 1);
  });

  // Sort by count
  const sorted = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1]);

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
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' }
        }
      }
    }
  });
}

// Map country to region
function mapCountryToRegion(country) {
  if (!country) return 'Unknown';

  const countryLower = country.toLowerCase();

  // Americas
  const americas = ['usa', 'us', 'united states', 'canada', 'mexico', 'brazil', 'argentina', 'chile', 'colombia', 'peru'];
  if (americas.some(c => countryLower.includes(c))) return 'Americas';

  // Europe
  const europe = ['uk', 'united kingdom', 'germany', 'france', 'spain', 'italy', 'netherlands', 'poland', 'sweden', 'norway', 'denmark', 'finland', 'ireland', 'portugal', 'belgium', 'austria', 'switzerland', 'czech', 'greece', 'romania', 'hungary'];
  if (europe.some(c => countryLower.includes(c))) return 'Europe';

  // Asia-Pacific
  const asiaPacific = ['china', 'japan', 'india', 'australia', 'south korea', 'korea', 'singapore', 'indonesia', 'malaysia', 'philippines', 'vietnam', 'thailand', 'taiwan', 'new zealand', 'hong kong'];
  if (asiaPacific.some(c => countryLower.includes(c))) return 'Asia-Pacific';

  // Middle East
  const middleEast = ['israel', 'uae', 'emirates', 'saudi', 'turkey', 'iran', 'iraq', 'qatar', 'kuwait', 'bahrain', 'oman'];
  if (middleEast.some(c => countryLower.includes(c))) return 'Middle East';

  // Africa
  const africa = ['south africa', 'nigeria', 'egypt', 'kenya', 'morocco', 'ghana', 'ethiopia'];
  if (africa.some(c => countryLower.includes(c))) return 'Africa';

  return 'Other';
}

// Main initialization
async function initDashboard() {
  try {
    // Fetch all data in parallel
    const [overview, fileAdoption, byLevel, features, versions, geography] = await Promise.all([
      fetchView('cxms_stats_overview'),
      fetchView('cxms_stats_file_adoption'),
      fetchView('cxms_stats_by_level'),
      fetchView('cxms_stats_features'),
      fetchView('cxms_stats_versions'),
      fetchView('cxms_stats_geography'),
    ]);

    // Update hero stats
    if (overview && overview.length > 0) {
      const stats = overview[0];
      updateStat('stat-installations', stats.total_installations);
      updateStat('stat-active', stats.active_30_days);
      updateStat('stat-effectiveness', stats.avg_effectiveness?.toFixed(1), '/5');
      updateStat('stat-restore', stats.avg_restore_time?.toFixed(1), ' min');
    }

    // Render charts
    if (fileAdoption && fileAdoption.length > 0) {
      renderFileAdoptionChart(fileAdoption);
    }

    if (byLevel && byLevel.length > 0) {
      renderDeploymentChart(byLevel);
    }

    if (features && features.length > 0) {
      renderFeaturesChart(features);
    }

    if (versions && versions.length > 0) {
      renderVersionsChart(versions);
    }

    if (geography && geography.length > 0) {
      renderGeographyChart(geography);
    }

  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showError();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initDashboard);
