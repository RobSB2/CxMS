# CxMS Technical Writer Profile - Installation Script
# Version: 1.0.0
# Platform: Windows PowerShell

$ErrorActionPreference = "Stop"

$PROFILE_NAME = "technical-writer"
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

# Install Vale
Write-Host "Installing Vale..."
$valeInstalled = Get-Command vale -ErrorAction SilentlyContinue
if ($valeInstalled) {
    $valeVersion = vale --version
    Write-Warn "Vale already installed: $valeVersion"
} else {
    $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
    if ($chocoInstalled) {
        choco install vale -y
        Write-Success "Vale installed via Chocolatey"
    } else {
        Write-Warn "Could not install Vale automatically"
        Write-Host "  Install via Chocolatey: choco install vale"
        Write-Host "  Or download from: https://vale.sh/docs/vale-cli/installation/"
    }
}

# Install markdownlint-cli
Write-Host "Installing markdownlint..."
$npmInstalled = Get-Command npm -ErrorAction SilentlyContinue
if ($npmInstalled) {
    $mdlintInstalled = npm list -g markdownlint-cli 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Warn "markdownlint already installed"
    } else {
        npm install -g markdownlint-cli
        Write-Success "markdownlint installed via npm"
    }
} else {
    Write-Warn "npm not found - install Node.js for markdownlint"
    Write-Host "  Then run: npm install -g markdownlint-cli"
}

Write-Host ""
Write-Host "Configuring MCP servers..."
Write-Host "-------------------------"

$claudeAvailable = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeAvailable) {
    $response = Read-Host "Configure MCP servers for Claude Code? [Y/n]"
    if ($response -eq "" -or $response -match "^[yY]") {
        try { claude mcp add @anthropic/fetch 2>$null } catch { Write-Warn "fetch MCP may already be configured" }
        Write-Success "MCP servers configured"
    } else {
        Write-Warn "Skipped MCP configuration"
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

$valeVer = try { vale --version 2>$null } catch { "not installed" }
$mdlintVer = try { markdownlint --version 2>$null } catch { "not installed" }

$installedJson = @{
    profile = $PROFILE_NAME
    version = $PROFILE_VERSION
    installed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tools = @{
        vale = $valeVer
        markdownlint = $mdlintVer
    }
    mcp_servers = @("@anthropic/fetch")
} | ConvertTo-Json -Depth 3

[System.IO.File]::WriteAllText("$CXMS_DIR\installed.json", $installedJson)
Write-Success "Profile record created at $CXMS_DIR\installed.json"

Write-Host ""
Write-Host "========================================"
Write-Host "Technical Writer profile installed!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Tools installed:"
Write-Host "  - Vale (prose linting)"
Write-Host "  - markdownlint (Markdown formatting)"
Write-Host ""
Write-Host "Usage:"
Write-Host "  cxms init --profile technical-writer"
Write-Host ""
Write-Host "Quick test:"
Write-Host "  vale --version"
Write-Host "  markdownlint --version"
Write-Host ""
Write-Host "Tip: Create a .vale.ini in your project root to configure styles."
Write-Host ""
