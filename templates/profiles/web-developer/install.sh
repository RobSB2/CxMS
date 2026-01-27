#!/bin/bash
# CxMS Web Developer Profile - Installation Script
# Version: 1.0.0
# Platform: Unix/Linux/macOS

set -e

PROFILE_NAME="web-developer"
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

# Check for Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is required but not installed."
    echo "  Install from: https://nodejs.org/"
    exit 1
fi
success "Node.js $(node --version) detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    error "npm is required but not installed."
    exit 1
fi
success "npm $(npm --version) detected"

echo ""
echo "Installing global tools..."
echo "-------------------------"

# Install Playwright
echo "Installing Playwright..."
if npm list -g playwright &> /dev/null; then
    warn "Playwright already installed globally"
else
    npm install -g playwright
    success "Playwright installed"
fi

# Install Playwright browsers to shared location
echo "Installing Playwright browsers (this may take a few minutes)..."
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
npx playwright install --with-deps chromium firefox webkit
success "Playwright browsers installed to ~/.cache/ms-playwright"

# Install Prettier
echo "Installing Prettier..."
if npm list -g prettier &> /dev/null; then
    warn "Prettier already installed globally"
else
    npm install -g prettier
    success "Prettier installed"
fi

# Install ESLint
echo "Installing ESLint..."
if npm list -g eslint &> /dev/null; then
    warn "ESLint already installed globally"
else
    npm install -g eslint
    success "ESLint installed"
fi

echo ""
echo "Configuring MCP servers..."
echo "-------------------------"

# Check if Claude CLI is available
if command -v claude &> /dev/null; then
    echo "Configure MCP servers for Claude Code? [Y/n] "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])?$ ]]; then
        claude mcp add @anthropic/fetch 2>/dev/null || warn "fetch MCP may already be configured"
        claude mcp add @anthropic/filesystem 2>/dev/null || warn "filesystem MCP may already be configured"
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
  "tools": {
    "playwright": "$(npx playwright --version 2>/dev/null || echo 'installed')",
    "prettier": "$(prettier --version 2>/dev/null || echo 'installed')",
    "eslint": "$(eslint --version 2>/dev/null || echo 'installed')"
  },
  "browsers_path": "~/.cache/ms-playwright",
  "mcp_servers": ["@anthropic/fetch", "@anthropic/filesystem"]
}
EOF
success "Profile record created at $CXMS_DIR/installed.json"

echo ""
echo "========================================"
echo -e "${GREEN}Web Developer profile installed!${NC}"
echo "========================================"
echo ""
echo "Usage:"
echo "  cxms init --profile web-developer"
echo ""
echo "Or add to existing project's ./cxms/profile.json:"
echo '  { "profiles": ["web-developer"] }'
echo ""
