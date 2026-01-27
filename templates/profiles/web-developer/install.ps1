# CxMS Web Developer Profile - Installation Script
# Version: 1.0.0
# Platform: Windows PowerShell

$ErrorActionPreference = "Stop"

$PROFILE_NAME = "web-developer"
$PROFILE_VERSION = "1.0.0"

Write-Host "========================================"
Write-Host "CxMS Profile Installer: $PROFILE_NAME"
Write-Host "Version: $PROFILE_VERSION"
Write-Host "========================================"
Write-Host ""

function Write-Success { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "[!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err { param($msg) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $msg }

# Check for Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js $nodeVersion detected"
} catch {
    Write-Err "Node.js is required but not installed."
    Write-Host "  Install from: https://nodejs.org/"
    exit 1
}

# Check for npm
try {
    $npmVersion = npm --version
    Write-Success "npm $npmVersion detected"
} catch {
    Write-Err "npm is required but not installed."
    exit 1
}

Write-Host ""
Write-Host "Installing global tools..."
Write-Host "-------------------------"

# Install Playwright
Write-Host "Installing Playwright..."
$playwrightInstalled = npm list -g playwright 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warn "Playwright already installed globally"
} else {
    npm install -g playwright
    Write-Success "Playwright installed"
}

# Install Playwright browsers to shared location
Write-Host "Installing Playwright browsers (this may take a few minutes)..."
$env:PLAYWRIGHT_BROWSERS_PATH = "$env:USERPROFILE\.cache\ms-playwright"
npx playwright install --with-deps chromium firefox webkit
Write-Success "Playwright browsers installed to $env:USERPROFILE\.cache\ms-playwright"

# Install Prettier
Write-Host "Installing Prettier..."
$prettierInstalled = npm list -g prettier 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warn "Prettier already installed globally"
} else {
    npm install -g prettier
    Write-Success "Prettier installed"
}

# Install ESLint
Write-Host "Installing ESLint..."
$eslintInstalled = npm list -g eslint 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warn "ESLint already installed globally"
} else {
    npm install -g eslint
    Write-Success "ESLint installed"
}

Write-Host ""
Write-Host "Configuring MCP servers..."
Write-Host "-------------------------"

# Check if Claude CLI is available
$claudeAvailable = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeAvailable) {
    $response = Read-Host "Configure MCP servers for Claude Code? [Y/n]"
    if ($response -eq "" -or $response -match "^[yY]") {
        try { claude mcp add @anthropic/fetch 2>$null } catch { Write-Warn "fetch MCP may already be configured" }
        try { claude mcp add @anthropic/filesystem 2>$null } catch { Write-Warn "filesystem MCP may already be configured" }
        Write-Success "MCP servers configured"
    } else {
        Write-Warn "Skipped MCP configuration (run manually with 'claude mcp add')"
    }
} else {
    Write-Warn "Claude CLI not found - configure MCP servers manually"
}

Write-Host ""
Write-Host "Creating profile record..."
Write-Host "-------------------------"

# Create profile directory if needed
$CXMS_DIR = "$env:USERPROFILE\.cxms\profiles\$PROFILE_NAME"
if (-not (Test-Path $CXMS_DIR)) {
    New-Item -ItemType Directory -Path $CXMS_DIR -Force | Out-Null
}

# Get tool versions
$playwrightVer = try { npx playwright --version 2>$null } catch { "installed" }
$prettierVer = try { prettier --version 2>$null } catch { "installed" }
$eslintVer = try { eslint --version 2>$null } catch { "installed" }

# Write installed.json
$installedJson = @{
    profile = $PROFILE_NAME
    version = $PROFILE_VERSION
    installed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tools = @{
        playwright = $playwrightVer
        prettier = $prettierVer
        eslint = $eslintVer
    }
    browsers_path = "$env:USERPROFILE\.cache\ms-playwright"
    mcp_servers = @("@anthropic/fetch", "@anthropic/filesystem")
} | ConvertTo-Json -Depth 3

$installedJson | Out-File -FilePath "$CXMS_DIR\installed.json" -Encoding UTF8
Write-Success "Profile record created at $CXMS_DIR\installed.json"

Write-Host ""
Write-Host "========================================"
Write-Host "Web Developer profile installed!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Usage:"
Write-Host "  cxms init --profile web-developer"
Write-Host ""
Write-Host "Or add to existing project's ./cxms/profile.json:"
Write-Host '  { "profiles": ["web-developer"] }'
Write-Host ""
