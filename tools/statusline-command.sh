#!/bin/bash
#
# CxMS Statusline Command for Claude Code
#
# Reads JSON from stdin (provided by Claude Code), extracts context window data,
# outputs a formatted ANSI status line, and writes per-session context JSON files.
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
# Note: Claude Code runs statusline commands through bash on ALL platforms,
# including Windows (via Git Bash/MSYS2). PowerShell is NOT supported for
# statusline commands.
#
# Output:
#   - Displays formatted status in Claude Code UI
#   - Writes context stats to .claude/context-status-{session_id}.json in current project
#
# Credit: Based on workaround shared by @Memphizzz in anthropics/claude-code#18027
#
# Version: 3.1.0 - Compaction detection, improved arithmetic, cross-platform
#   - Prefers remaining_percentage over used_percentage (cumulative can exceed 100%)
#   - Per-session status files (context-status-{session_id}.json)
#   - Compaction detection: logs events when context drops 30%+ from 60%+ high
#   - Legacy context-status.json written for backward compat with older hooks
#   - Uses awk for arithmetic (no bc dependency), jq for JSON output

# ANSI color codes
ESC=$'\033'
RESET="${ESC}[0m"
PURPLE="${ESC}[38;5;141m"
ORANGE="${ESC}[38;5;208m"
RED="${ESC}[38;5;203m"

# Read JSON from stdin
input=$(cat)

# If stdin was empty, output fallback and exit
if [ -z "$input" ]; then
    printf "Ready"
    exit 0
fi

# Check that .context_window exists in the JSON
if ! echo "$input" | jq -e '.context_window' > /dev/null 2>&1; then
    printf "Ready"
    exit 0
fi

# ── Extract fields ──────────────────────────────────────────────────────────
remaining_pct=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
used_pct=$(echo "$input"      | jq -r '.context_window.used_percentage // empty')
total_input=$(echo "$input"   | jq -r '.context_window.total_input_tokens // 0')
total_output=$(echo "$input"  | jq -r '.context_window.total_output_tokens // 0')
ctx_size=$(echo "$input"      | jq -r '.context_window.context_window_size // 200000')
session_id=$(echo "$input"    | jq -r '.session_id // empty')
model=$(echo "$input"         | jq -r '.model.display_name // .model.id // "Claude"')
project_dir=$(echo "$input"   | jq -r '.workspace.project_dir // .workspace.current_dir // empty')

# ── Calculate context percentage ────────────────────────────────────────────
# Prefer remaining_percentage: it reflects current window occupancy.
# used_percentage is cumulative across compaction events and can exceed 100%.
reliable=false
ctx_pct=0

if [ -n "$remaining_pct" ] && [ "$remaining_pct" != "null" ]; then
    # remaining_pct is a float; use awk for arithmetic
    ctx_pct=$(awk "BEGIN { v=100-${remaining_pct}; if(v<0) v=0; if(v>100) v=100; printf \"%d\", int(v+0.5) }")
    reliable=true
elif [ -n "$used_pct" ] && [ "$used_pct" != "null" ]; then
    ctx_pct=$(awk "BEGIN { v=${used_pct}; if(v<0) v=0; if(v>100) v=100; printf \"%d\", int(v+0.5) }")
    reliable=true
else
    # Last resort: manual token math
    total_tokens=$(( total_input + total_output ))
    if [ "$ctx_size" -gt 0 ]; then
        ctx_pct=$(awk "BEGIN { v=(${total_tokens}*100)/${ctx_size}; if(v>100) v=100; printf \"%d\", int(v+0.5) }")
    fi
    reliable=false
fi

# ── Choose color ─────────────────────────────────────────────────────────────
if [ "$ctx_pct" -ge 80 ]; then
    CTX_COLOR="$RED"
elif [ "$ctx_pct" -ge 60 ]; then
    CTX_COLOR="$ORANGE"
else
    CTX_COLOR="$PURPLE"
fi

# ── Output the status line ───────────────────────────────────────────────────
printf "${CTX_COLOR}Ctx ${ctx_pct}%%${RESET} ${PURPLE}${model}${RESET}"

# ── Write per-session status JSON (for hook consumption) ─────────────────────
if [ -n "$project_dir" ]; then
    claude_dir="${project_dir}/.claude"
    mkdir -p "$claude_dir" 2>/dev/null

    # Determine status file path
    if [ -n "$session_id" ]; then
        status_file="${claude_dir}/context-status-${session_id}.json"
    else
        status_file="${claude_dir}/context-status.json"
    fi

    # ── Compaction detection ──────────────────────────────────────────────────
    compaction_log="${claude_dir}/compaction-log.json"
    if [ -f "$status_file" ]; then
        prev_pct=$(jq -r '.ctx_pct // empty' "$status_file" 2>/dev/null)
        if [ -n "$prev_pct" ] && [ "$prev_pct" -ge 60 ]; then
            drop=$(( prev_pct - ctx_pct ))
            if [ "$drop" -ge 30 ]; then
                timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
                event=$(jq -n \
                    --arg ts "$timestamp" \
                    --arg sid "$session_id" \
                    --argjson before "$prev_pct" \
                    --argjson after "$ctx_pct" \
                    --argjson drop "$drop" \
                    --arg mdl "$model" \
                    --argjson csz "$ctx_size" \
                    '{timestamp:$ts, session_id:$sid, before_pct:$before, after_pct:$after, drop_pct:$drop, model:$mdl, context_window_size:$csz}')

                # Append to compaction log
                if [ -f "$compaction_log" ]; then
                    existing=$(cat "$compaction_log" 2>/dev/null)
                    echo "$existing" | jq --argjson ev "$event" '. + [$ev]' > "$compaction_log" 2>/dev/null || true
                else
                    echo "[$event]" > "$compaction_log"
                fi
            fi
        fi
    fi

    # ── Write current status ──────────────────────────────────────────────────
    updated=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
    jq -n \
        --argjson ctx_pct "$ctx_pct" \
        --argjson reliable "$reliable" \
        --arg used_pct_raw "${used_pct:-null}" \
        --arg remaining_pct "${remaining_pct:-null}" \
        --argjson total_input "$total_input" \
        --argjson total_output "$total_output" \
        --argjson ctx_size "$ctx_size" \
        --arg model "$model" \
        --arg session_id "$session_id" \
        --arg updated "$updated" \
        '{ctx_pct:$ctx_pct, reliable:$reliable, used_percentage_raw:$used_pct_raw,
          remaining_percentage:$remaining_pct, total_input_tokens:$total_input,
          total_output_tokens:$total_output, context_window_size:$ctx_size,
          model:$model, session_id:$session_id, updated:$updated}' \
        > "$status_file" 2>/dev/null || true

    # Write legacy context-status.json for backward compat
    if [ -n "$session_id" ]; then
        cp "$status_file" "${claude_dir}/context-status.json" 2>/dev/null || true
    fi

    # ── Cleanup stale per-session files (>24h old) ────────────────────────────
    if [ -n "$session_id" ]; then
        find "$claude_dir" -name "context-status-*.json" -mmin +1440 -delete 2>/dev/null || true
    fi
fi
