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
# Version: 2.0.0 - Fixed inflated ctx% after compaction, prefer remaining_percentage
#
# Compaction Detection:
#   - Reads previous context % from context-status.json
#   - If context drops 30%+ from a high point (60%+), logs as compaction event
#   - Writes to .claude/compaction-log.json for analysis/feedback to Anthropic

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

        # Calculate percentage — PREFER remaining_percentage (actual window occupancy)
        # used_percentage is CUMULATIVE (counts all tokens ever, including compacted ones)
        # and will exceed 100% after compaction. remaining_percentage is the real signal.
        $reliable = $false
        if ($null -ne $remainingPct -and $remainingPct -ne "" -and $remainingPct -ge 0 -and $remainingPct -le 100) {
            # Best source: remaining_percentage directly from Claude Code
            $ctxPct = [math]::Round(100 - $remainingPct)
            $reliable = $true
        } elseif ($null -ne $usedPct -and $usedPct -ne "" -and $usedPct -ge 0 -and $usedPct -le 100) {
            # Fallback: used_percentage, but ONLY if it's sane (0-100)
            $ctxPct = [math]::Round($usedPct)
            $reliable = $true
        } else {
            # Last resort: manual calculation, capped at 100
            $currentTokens = $totalInput + $totalOutput
            if ($ctxSize -gt 0) {
                $ctxPct = [math]::Min(100, [math]::Round(($currentTokens * 100) / $ctxSize))
            } else {
                $ctxPct = 0
            }
            $reliable = $false
        }

        # Get model name
        $model = if ($data.model.display_name) { $data.model.display_name }
                 elseif ($data.model.id) { $data.model.id }
                 else { "Claude" }

        # ANSI color codes (using $([char]27) for PowerShell 5.x compatibility)
        $ESC = [char]27
        $Reset = "$ESC[0m"
        $Purple = "$ESC[38;5;141m"
        $Orange = "$ESC[38;5;208m"
        $Red = "$ESC[38;5;203m"

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
            $compactionLogFile = Join-Path $claudeDir "compaction-log.json"

            # Create .claude directory if it doesn't exist
            if (-not (Test-Path $claudeDir)) {
                New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
            }

            # ============================================
            # COMPACTION DETECTION
            # ============================================
            # Read previous status to detect compaction events
            $prevCtxPct = $null
            if (Test-Path $statusFile) {
                try {
                    $prevStatus = Get-Content $statusFile -Raw | ConvertFrom-Json
                    $prevCtxPct = $prevStatus.ctx_pct
                } catch {
                    # Ignore parse errors
                }
            }

            # Detect compaction: previous was high (60%+) and current dropped 30%+
            if ($null -ne $prevCtxPct -and $prevCtxPct -ge 60 -and ($prevCtxPct - $ctxPct) -ge 30) {
                # Log compaction event
                $compactionEvent = @{
                    timestamp = (Get-Date -Format "o")
                    before_pct = $prevCtxPct
                    after_pct = $ctxPct
                    drop_pct = $prevCtxPct - $ctxPct
                    model = $model
                    context_window_size = $ctxSize
                    tokens_before = $prevStatus.total_input_tokens + $prevStatus.total_output_tokens
                }

                # Append to compaction log (create array if doesn't exist)
                $compactionLog = @()
                if (Test-Path $compactionLogFile) {
                    try {
                        $existing = Get-Content $compactionLogFile -Raw | ConvertFrom-Json
                        if ($existing -is [array]) {
                            $compactionLog = @($existing)
                        } else {
                            $compactionLog = @($existing)
                        }
                    } catch {
                        # Start fresh if parse error
                    }
                }
                $compactionLog += $compactionEvent
                $compactionLog | ConvertTo-Json -Depth 3 | Set-Content -Path $compactionLogFile -Encoding UTF8
            }

            # ============================================
            # BUILD AND WRITE STATUS
            # ============================================
            $status = @{
                ctx_pct = $ctxPct
                reliable = $reliable
                used_percentage_raw = $usedPct
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
