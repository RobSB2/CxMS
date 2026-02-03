#!/bin/bash
# CxMS Technical Writer Profile - Installation Script
# Version: 1.0.0
# Platform: Unix/Linux/macOS

set -e

PROFILE_NAME="technical-writer"
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

# Install Vale
echo "Installing Vale..."
if command -v vale &> /dev/null; then
    warn "Vale already installed: $(vale --version)"
else
    if command -v brew &> /dev/null; then
        brew install vale
        success "Vale installed via Homebrew"
    elif command -v go &> /dev/null; then
        go install github.com/errata-ai/vale/v2/cmd/vale@latest
        success "Vale installed via Go"
    else
        warn "Could not install Vale automatically"
        echo "  Install via Homebrew: brew install vale"
        echo "  Or download from: https://vale.sh/docs/vale-cli/installation/"
    fi
fi

# Install markdownlint-cli
echo "Installing markdownlint..."
if command -v markdownlint &> /dev/null; then
    warn "markdownlint already installed"
else
    if command -v npm &> /dev/null; then
        npm install -g markdownlint-cli
        success "markdownlint installed via npm"
    else
        warn "npm not found - install Node.js for markdownlint"
        echo "  Then run: npm install -g markdownlint-cli"
    fi
fi

echo ""
echo "Configuring MCP servers..."
echo "-------------------------"

if command -v claude &> /dev/null; then
    echo "Configure MCP servers for Claude Code? [Y/n] "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])?$ ]]; then
        claude mcp add @anthropic/fetch 2>/dev/null || warn "fetch MCP may already be configured"
        success "MCP servers configured"
    else
        warn "Skipped MCP configuration"
    fi
else
    warn "Claude CLI not found - configure MCP servers manually"
fi

echo ""
echo "Creating profile record..."
echo "-------------------------"

CXMS_DIR=~/.cxms/profiles/$PROFILE_NAME
mkdir -p "$CXMS_DIR"

VALE_VER=$(vale --version 2>/dev/null || echo "not installed")
MDLINT_VER=$(markdownlint --version 2>/dev/null || echo "not installed")

cat > "$CXMS_DIR/installed.json" << EOF
{
  "profile": "$PROFILE_NAME",
  "version": "$PROFILE_VERSION",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tools": {
    "vale": "$VALE_VER",
    "markdownlint": "$MDLINT_VER"
  },
  "mcp_servers": ["@anthropic/fetch"]
}
EOF
success "Profile record created at $CXMS_DIR/installed.json"

echo ""
echo "========================================"
echo -e "${GREEN}Technical Writer profile installed!${NC}"
echo "========================================"
echo ""
echo "Tools installed:"
echo "  - Vale (prose linting)"
echo "  - markdownlint (Markdown formatting)"
echo ""
echo "Usage:"
echo "  cxms init --profile technical-writer"
echo ""
echo "Quick test:"
echo "  vale --version"
echo "  markdownlint --version"
echo ""
echo "Tip: Create a .vale.ini in your project root to configure styles."
echo ""
