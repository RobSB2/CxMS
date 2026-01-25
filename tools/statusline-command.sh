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
#   3. Claude Code will automatically use it for the status line
#
# Output:
#   - Displays formatted status in Claude Code UI
#   - Writes context stats to .claude/context-status.json in current project
#
# Credit: Based on workaround shared by @Memphizzz in anthropics/claude-code#18027
#
# Version: 1.0.0

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
    # Extract context window data
    current=$(echo "$input" | jq -r '.context_window.used // 0')
    size=$(echo "$input" | jq -r '.context_window.total // 200000')

    # Calculate percentage (add ~15% overhead for system components)
    if [ "$size" -gt 0 ]; then
        ctx_pct=$(( (current * 115) / size ))
        [ $ctx_pct -gt 100 ] && ctx_pct=100
    else
        ctx_pct=0
    fi

    # Determine color based on usage
    if [ $ctx_pct -ge 80 ]; then
        CTX_COLOR=$RED
    elif [ $ctx_pct -ge 60 ]; then
        CTX_COLOR=$ORANGE
    else
        CTX_COLOR=$PURPLE
    fi

    # Extract other metrics
    model=$(echo "$input" | jq -r '.model // "claude"')
    duration=$(echo "$input" | jq -r '.session_duration // "00:00:00"')

    # Get lines changed if available
    lines_added=$(echo "$input" | jq -r '.lines_added // 0')
    lines_removed=$(echo "$input" | jq -r '.lines_removed // 0')

    # Build status line
    status="${CTX_COLOR}Ctx ${ctx_pct}%${RESET}"

    if [ "$lines_added" != "0" ] || [ "$lines_removed" != "0" ]; then
        status="$status ${GREEN}+${lines_added}${RESET}/${RED}-${lines_removed}${RESET}"
    fi

    status="$status ${PURPLE}${duration}${RESET}"

    # Output status line
    echo -e "$status"

    # Write context status to JSON file for Claude to read
    project_dir=$(pwd)
    mkdir -p "$project_dir/.claude"

    cat > "$project_dir/.claude/context-status.json" << JSONEOF
{
  "ctx_pct": $ctx_pct,
  "tokens": $current,
  "max": $size,
  "updated": "$(date -Iseconds)"
}
JSONEOF

else
    # No usage data yet
    echo -e "${PURPLE}Ready${RESET}"
fi
