#!/bin/bash
#
# CxMS Statusline Command for Claude Code
#
# This script generates a status line and writes context usage to a JSON file
# that Claude can read to monitor its own context consumption.
#
# Installation:
#   1. Copy to ~/.claude/statusline-command.sh
#   2. Make executable: chmod +x ~/.claude/statusline-command.sh
#   3. Add to settings.json:
#      "statusLine": {
#        "type": "command",
#        "command": "bash ~/.claude/statusline-command.sh"
#      }
#
# Output:
#   - Displays formatted status in Claude Code UI
#   - Writes context stats to .claude/context-status.json in current project
#
# Credit: Based on workaround shared by @Memphizzz in anthropics/claude-code#18027
#
# Version: 1.1.0

# Colors (ANSI escape codes)
ORANGE='\033[38;5;208m'
PURPLE='\033[38;5;141m'
GREEN='\033[38;5;114m'
RED='\033[38;5;203m'
RESET='\033[0m'
BOLD='\033[1m'

# Read JSON input from stdin
input=$(cat)

# Check if we have usage data
if echo "$input" | jq -e '.context_window' > /dev/null 2>&1; then
    # Extract context window data (using actual Claude Code JSON structure)
    total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
    total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
    ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
    used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
    remaining_pct=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')

    # Use pre-calculated percentage if available, otherwise calculate
    if [ -n "$used_pct" ] && [ "$used_pct" != "null" ]; then
        # Round to integer
        ctx_pct=$(printf "%.0f" "$used_pct")
    else
        # Calculate from tokens
        current_tokens=$((total_input + total_output))
        if [ "$ctx_size" -gt 0 ]; then
            ctx_pct=$(( (current_tokens * 100) / ctx_size ))
        else
            ctx_pct=0
        fi
    fi

    # Determine color based on usage
    if [ "$ctx_pct" -ge 80 ]; then
        CTX_COLOR=$RED
    elif [ "$ctx_pct" -ge 60 ]; then
        CTX_COLOR=$ORANGE
    else
        CTX_COLOR=$PURPLE
    fi

    # Extract model name
    model=$(echo "$input" | jq -r '.model.display_name // .model.id // "Claude"')

    # Build status line
    status="${CTX_COLOR}Ctx ${ctx_pct}%${RESET} ${PURPLE}${model}${RESET}"

    # Output status line
    printf "%b" "$status"

    # Write context status to JSON file for Claude to read
    project_dir=$(echo "$input" | jq -r '.workspace.project_dir // .workspace.current_dir // ""')
    if [ -n "$project_dir" ] && [ "$project_dir" != "null" ]; then
        mkdir -p "$project_dir/.claude" 2>/dev/null || true

        cat > "$project_dir/.claude/context-status.json" 2>/dev/null << JSONEOF
{
  "ctx_pct": $ctx_pct,
  "used_percentage": $(echo "$input" | jq -r '.context_window.used_percentage // null'),
  "remaining_percentage": $(echo "$input" | jq -r '.context_window.remaining_percentage // null'),
  "total_input_tokens": $total_input,
  "total_output_tokens": $total_output,
  "context_window_size": $ctx_size,
  "model": "$(echo "$input" | jq -r '.model.display_name // .model.id')",
  "updated": "$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)"
}
JSONEOF
    fi

else
    # No usage data yet
    printf "%b" "${PURPLE}Ready${RESET}"
fi
