#!/bin/bash
# CxMS Project Manager Profile - Installation Script
# Version: 1.0.0
# Platform: Unix/Linux/macOS

set -e

PROFILE_NAME="project-manager"
PROFILE_VERSION="1.0.0"

echo "========================================"
echo "CxMS Profile Installer: $PROFILE_NAME"
echo "Version: $PROFILE_VERSION"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

echo "This profile focuses on coordination patterns."
echo "No global tools are required."
echo ""

echo "Configuring MCP servers..."
echo "-------------------------"

# Check if Claude CLI is available
if command -v claude &> /dev/null; then
    echo "Configure MCP servers for Claude Code? [Y/n] "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])?$ ]]; then
        claude mcp add @anthropic/fetch 2>/dev/null || warn "fetch MCP may already be configured"
        success "MCP servers configured"
    else
        warn "Skipped MCP configuration (run manually with 'claude mcp add')"
    fi
else
    warn "Claude CLI not found - configure MCP servers manually"
fi

echo ""
echo "Creating profile record..."
echo "-------------------------"

# Create profile directory if needed
CXMS_DIR=~/.cxms/profiles/$PROFILE_NAME
mkdir -p "$CXMS_DIR"

# Write installed.json
cat > "$CXMS_DIR/installed.json" << EOF
{
  "profile": "$PROFILE_NAME",
  "version": "$PROFILE_VERSION",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tools": {},
  "mcp_servers": ["@anthropic/fetch"]
}
EOF
success "Profile record created at $CXMS_DIR/installed.json"

echo ""
echo "========================================"
echo -e "${GREEN}Project Manager profile installed!${NC}"
echo "========================================"
echo ""
echo "This profile provides coordination patterns for:"
echo "  - Multi-agent orchestration"
echo "  - Project state management"
echo "  - Documentation workflows"
echo "  - Stakeholder communication"
echo ""
echo "Usage:"
echo "  cxms init --profile project-manager"
echo ""
echo "Combine with technical profiles:"
echo "  cxms init --profile project-manager,web-developer"
echo ""
