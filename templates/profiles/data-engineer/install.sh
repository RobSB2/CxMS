#!/bin/bash
# CxMS Data Engineer Profile - Installation Script
# Version: 1.0.0
# Platform: Unix/Linux/macOS

set -e

PROFILE_NAME="data-engineer"
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

echo "Installing global tools..."
echo "-------------------------"

# Check for Python
if command -v python3 &> /dev/null; then
    success "Python $(python3 --version) detected"
else
    warn "Python 3 not found - some features may not work"
fi

# Install DuckDB CLI
echo "Installing DuckDB..."
if command -v duckdb &> /dev/null; then
    warn "DuckDB already installed: $(duckdb --version)"
else
    # Try pip first
    if command -v pip3 &> /dev/null; then
        pip3 install duckdb --user
        success "DuckDB installed via pip"
    elif command -v brew &> /dev/null; then
        brew install duckdb
        success "DuckDB installed via Homebrew"
    else
        warn "Could not install DuckDB automatically"
        echo "  Install manually: pip install duckdb"
        echo "  Or download from: https://duckdb.org/docs/installation"
    fi
fi

echo ""
echo "Configuring MCP servers..."
echo "-------------------------"

# Check if Claude CLI is available
if command -v claude &> /dev/null; then
    echo "Configure MCP servers for Claude Code? [Y/n] "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])?$ ]]; then
        claude mcp add @anthropic/postgres 2>/dev/null || warn "postgres MCP may already be configured"
        claude mcp add @anthropic/sqlite 2>/dev/null || warn "sqlite MCP may already be configured"
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

# Get DuckDB version
DUCKDB_VERSION=$(duckdb --version 2>/dev/null || echo "installed")

# Write installed.json
cat > "$CXMS_DIR/installed.json" << EOF
{
  "profile": "$PROFILE_NAME",
  "version": "$PROFILE_VERSION",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tools": {
    "duckdb": "$DUCKDB_VERSION"
  },
  "mcp_servers": ["@anthropic/postgres", "@anthropic/sqlite"]
}
EOF
success "Profile record created at $CXMS_DIR/installed.json"

echo ""
echo "========================================"
echo -e "${GREEN}Data Engineer profile installed!${NC}"
echo "========================================"
echo ""
echo "Tools installed:"
echo "  - DuckDB (SQL analytics)"
echo ""
echo "Usage:"
echo "  cxms init --profile data-engineer"
echo ""
echo "Quick test:"
echo "  duckdb -c \"SELECT 'Hello, Data!' as greeting\""
echo ""
