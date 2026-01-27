# CxMS DevOps Profile - Installation Script
# Version: 1.0.0
# Platform: Windows PowerShell

$ErrorActionPreference = "Stop"

$PROFILE_NAME = "devops"
$PROFILE_VERSION = "1.0.0"

Write-Host "========================================"
Write-Host "CxMS Profile Installer: $PROFILE_NAME"
Write-Host "Version: $PROFILE_VERSION"
Write-Host "========================================"
Write-Host ""

function Write-Success { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "[!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err { param($msg) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $msg }

Write-Host "Checking installed tools..."
Write-Host "-------------------------"

# Check Docker
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    $dockerVersion = docker --version
    Write-Success "Docker: $dockerVersion"
} else {
    Write-Warn "Docker not installed"
    Write-Host "  Install from: https://docs.docker.com/desktop/install/windows-install/"
}

# Check Terraform
$terraformInstalled = Get-Command terraform -ErrorAction SilentlyContinue
if ($terraformInstalled) {
    $terraformVersion = terraform --version | Select-Object -First 1
    Write-Success "Terraform: $terraformVersion"
} else {
    Write-Warn "Terraform not installed"
    Write-Host "  Install from: https://developer.hashicorp.com/terraform/downloads"
    Write-Host "  Or via choco: choco install terraform"
}

# Check kubectl
$kubectlInstalled = Get-Command kubectl -ErrorAction SilentlyContinue
if ($kubectlInstalled) {
    $kubectlVersion = kubectl version --client --short 2>$null
    if (-not $kubectlVersion) { $kubectlVersion = "installed" }
    Write-Success "kubectl: $kubectlVersion"
} else {
    Write-Warn "kubectl not installed"
    Write-Host "  Install from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/"
    Write-Host "  Or via choco: choco install kubernetes-cli"
}

Write-Host ""
Write-Host "Note: This profile expects tools to be installed separately."
Write-Host "DevOps tools are typically installed via package managers or"
Write-Host "official installers due to system-level requirements."
Write-Host ""

Write-Host "Configuring MCP servers..."
Write-Host "-------------------------"

$claudeAvailable = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeAvailable) {
    $response = Read-Host "Configure MCP servers for Claude Code? [Y/n]"
    if ($response -eq "" -or $response -match "^[yY]") {
        try { claude mcp add @anthropic/fetch 2>$null } catch { Write-Warn "fetch MCP may already be configured" }
        try { claude mcp add @anthropic/filesystem 2>$null } catch { Write-Warn "filesystem MCP may already be configured" }
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

$dockerVer = try { docker --version 2>$null } catch { "not installed" }
$terraformVer = try { (terraform --version 2>$null | Select-Object -First 1) } catch { "not installed" }
$kubectlVer = try { kubectl version --client --short 2>$null } catch { "not installed" }

$installedJson = @{
    profile = $PROFILE_NAME
    version = $PROFILE_VERSION
    installed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tools = @{
        docker = $dockerVer
        terraform = $terraformVer
        kubectl = $kubectlVer
    }
    mcp_servers = @("@anthropic/fetch", "@anthropic/filesystem")
} | ConvertTo-Json -Depth 3

[System.IO.File]::WriteAllText("$CXMS_DIR\installed.json", $installedJson)
Write-Success "Profile record created at $CXMS_DIR\installed.json"

Write-Host ""
Write-Host "========================================"
Write-Host "DevOps profile installed!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Usage:"
Write-Host "  cxms init --profile devops"
Write-Host ""
Write-Host "Verify tools:"
Write-Host "  docker --version"
Write-Host "  terraform --version"
Write-Host "  kubectl version --client"
Write-Host ""
