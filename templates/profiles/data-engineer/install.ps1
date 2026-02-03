# CxMS Data Engineer Profile - Installation Script
# Version: 1.0.0
# Platform: Windows PowerShell

$ErrorActionPreference = "Stop"

$PROFILE_NAME = "data-engineer"
$PROFILE_VERSION = "1.0.0"

Write-Host "========================================"
Write-Host "CxMS Profile Installer: $PROFILE_NAME"
Write-Host "Version: $PROFILE_VERSION"
Write-Host "========================================"
Write-Host ""

function Write-Success { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "[!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err { param($msg) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $msg }

Write-Host "Installing global tools..."
Write-Host "-------------------------"

# Check for Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python detected: $pythonVersion"
} catch {
    Write-Warn "Python not found - some features may not work"
}

# Install DuckDB
Write-Host "Installing DuckDB..."
$duckdbInstalled = Get-Command duckdb -ErrorAction SilentlyContinue
if ($duckdbInstalled) {
    $duckdbVersion = duckdb --version 2>&1
    Write-Warn "DuckDB already installed: $duckdbVersion"
} else {
    try {
        pip install duckdb
        Write-Success "DuckDB installed via pip"
    } catch {
        Write-Warn "Could not install DuckDB automatically"
        Write-Host "  Install manually: pip install duckdb"
        Write-Host "  Or download from: https://duckdb.org/docs/installation"
    }
}

Write-Host ""
Write-Host "Configuring MCP servers..."
Write-Host "-------------------------"

$claudeAvailable = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeAvailable) {
    $response = Read-Host "Configure MCP servers for Claude Code? [Y/n]"
    if ($response -eq "" -or $response -match "^[yY]") {
        try { claude mcp add @anthropic/postgres 2>$null } catch { Write-Warn "postgres MCP may already be configured" }
        try { claude mcp add @anthropic/sqlite 2>$null } catch { Write-Warn "sqlite MCP may already be configured" }
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

$CXMS_DIR = "$env:USERPROFILE\.cxms\profiles\$PROFILE_NAME"
if (-not (Test-Path $CXMS_DIR)) {
    New-Item -ItemType Directory -Path $CXMS_DIR -Force | Out-Null
}

$duckdbVer = try { duckdb --version 2>$null } catch { "installed" }

$installedJson = @{
    profile = $PROFILE_NAME
    version = $PROFILE_VERSION
    installed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tools = @{
        duckdb = $duckdbVer
    }
    mcp_servers = @("@anthropic/postgres", "@anthropic/sqlite")
} | ConvertTo-Json -Depth 3

[System.IO.File]::WriteAllText("$CXMS_DIR\installed.json", $installedJson)
Write-Success "Profile record created at $CXMS_DIR\installed.json"

Write-Host ""
Write-Host "========================================"
Write-Host "Data Engineer profile installed!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Tools installed:"
Write-Host "  - DuckDB (SQL analytics)"
Write-Host ""
Write-Host "Usage:"
Write-Host "  cxms init --profile data-engineer"
Write-Host ""
Write-Host "Quick test:"
Write-Host "  duckdb -c `"SELECT 'Hello, Data!' as greeting`""
Write-Host ""
