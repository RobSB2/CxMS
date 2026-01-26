#
# CxMS Statusline Command for Claude Code (PowerShell)
#
# This script generates a status line and writes context usage to a JSON file
# that Claude can read to monitor its own context consumption.
#
# Installation:
#   1. Copy to ~/.claude/statusline-command.ps1
#   2. Add to settings.json:
#      "statusLine": {
#        "type": "command",
#        "command": "powershell -ExecutionPolicy Bypass -File ~/.claude/statusline-command.ps1"
#      }
#
# Output:
#   - Displays formatted status in Claude Code UI
#   - Writes context stats to .claude/context-status.json in current project
#
# Credit: Based on workaround shared by @Memphizzz in anthropics/claude-code#18027
#         PowerShell port for Windows users
#
# Version: 1.0.0

# Read JSON input from stdin
$input = $Input | Out-String

if ([string]::IsNullOrWhiteSpace($input)) {
    Write-Host "Ready" -NoNewline
    exit
}

try {
    $data = $input | ConvertFrom-Json

    if ($null -ne $data.context_window) {
        # Extract context window data
        $totalInput = if ($data.context_window.total_input_tokens) { $data.context_window.total_input_tokens } else { 0 }
        $totalOutput = if ($data.context_window.total_output_tokens) { $data.context_window.total_output_tokens } else { 0 }
        $ctxSize = if ($data.context_window.context_window_size) { $data.context_window.context_window_size } else { 200000 }
        $usedPct = $data.context_window.used_percentage
        $remainingPct = $data.context_window.remaining_percentage

        # Calculate percentage
        if ($null -ne $usedPct -and $usedPct -ne "") {
            $ctxPct = [math]::Round($usedPct)
        } else {
            $currentTokens = $totalInput + $totalOutput
            if ($ctxSize -gt 0) {
                $ctxPct = [math]::Round(($currentTokens * 100) / $ctxSize)
            } else {
                $ctxPct = 0
            }
        }

        # Get model name
        $model = if ($data.model.display_name) { $data.model.display_name }
                 elseif ($data.model.id) { $data.model.id }
                 else { "Claude" }

        # ANSI color codes
        $Reset = "`e[0m"
        $Purple = "`e[38;5;141m"
        $Orange = "`e[38;5;208m"
        $Red = "`e[38;5;203m"

        # Determine color based on usage
        if ($ctxPct -ge 80) {
            $CtxColor = $Red
        } elseif ($ctxPct -ge 60) {
            $CtxColor = $Orange
        } else {
            $CtxColor = $Purple
        }

        # Output status line
        Write-Host "${CtxColor}Ctx ${ctxPct}%${Reset} ${Purple}${model}${Reset}" -NoNewline

        # Write context status to JSON file
        $projectDir = if ($data.workspace.project_dir) { $data.workspace.project_dir }
                      elseif ($data.workspace.current_dir) { $data.workspace.current_dir }
                      else { $null }

        if ($projectDir) {
            $claudeDir = Join-Path $projectDir ".claude"
            $statusFile = Join-Path $claudeDir "context-status.json"

            # Create .claude directory if it doesn't exist
            if (-not (Test-Path $claudeDir)) {
                New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
            }

            # Build status object
            $status = @{
                ctx_pct = $ctxPct
                used_percentage = $usedPct
                remaining_percentage = $remainingPct
                total_input_tokens = $totalInput
                total_output_tokens = $totalOutput
                context_window_size = $ctxSize
                model = $model
                updated = (Get-Date -Format "o")
            }

            # Write JSON file
            $status | ConvertTo-Json | Set-Content -Path $statusFile -Encoding UTF8
        }
    } else {
        Write-Host "Ready" -NoNewline
    }
} catch {
    Write-Host "Ready" -NoNewline
}
