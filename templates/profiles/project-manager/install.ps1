# CxMS Project Manager Profile - Installation Script
# Version: 1.0.0
# Platform: Windows PowerShell

$ErrorActionPreference = "Stop"

$PROFILE_NAME = "project-manager"
$PROFILE_VERSION = "1.0.0"

Write-Host "========================================"
Write-Host "CxMS Profile Installer: $PROFILE_NAME"
Write-Host "Version: $PROFILE_VERSION"
Write-Host "========================================"
Write-Host ""

function Write-Success { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "[!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err { param($msg) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $msg }

Write-Host "This profile focuses on coordination patterns."
Write-Host "No global tools are required."
Write-Host ""

Write-Host "Configuring MCP servers..."
Write-Host "-------------------------"

# Check if Claude CLI is available
$claudeAvailable = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeAvailable) {
    $response = Read-Host "Configure MCP servers for Claude Code? [Y/n]"
    if ($response -eq "" -or $response -match "^[yY]") {
        try { claude mcp add @anthropic/fetch 2>$null } catch { Write-Warn "fetch MCP may already be configured" }
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

# Write installed.json (without BOM)
$installedJson = @{
    profile = $PROFILE_NAME
    version = $PROFILE_VERSION
    installed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tools = @{}
    mcp_servers = @("@anthropic/fetch")
} | ConvertTo-Json -Depth 3

[System.IO.File]::WriteAllText("$CXMS_DIR\installed.json", $installedJson)
Write-Success "Profile record created at $CXMS_DIR\installed.json"

Write-Host ""
Write-Host "========================================"
Write-Host "Project Manager profile installed!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "This profile provides coordination patterns for:"
Write-Host "  - Multi-agent orchestration"
Write-Host "  - Project state management"
Write-Host "  - Documentation workflows"
Write-Host "  - Stakeholder communication"
Write-Host ""
Write-Host "Usage:"
Write-Host "  cxms init --profile project-manager"
Write-Host ""
Write-Host "Combine with technical profiles:"
Write-Host "  cxms init --profile project-manager,web-developer"
Write-Host ""
