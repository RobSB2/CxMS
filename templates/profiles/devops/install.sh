#!/bin/bash
# CxMS DevOps Profile - Installation Script
# Version: 1.0.0
# Platform: Unix/Linux/macOS

set -e

PROFILE_NAME="devops"
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

echo "Checking installed tools..."
echo "-------------------------"

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    success "Docker: $DOCKER_VERSION"
else
    warn "Docker not installed"
    echo "  Install from: https://docs.docker.com/get-docker/"
fi

# Check Terraform
if command -v terraform &> /dev/null; then
    TERRAFORM_VERSION=$(terraform --version | head -1)
    success "Terraform: $TERRAFORM_VERSION"
else
    warn "Terraform not installed"
    echo "  Install from: https://developer.hashicorp.com/terraform/downloads"
    echo "  Or via brew: brew install terraform"
fi

# Check kubectl
if command -v kubectl &> /dev/null; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null || kubectl version --client)
    success "kubectl: $KUBECTL_VERSION"
else
    warn "kubectl not installed"
    echo "  Install from: https://kubernetes.io/docs/tasks/tools/"
    echo "  Or via brew: brew install kubectl"
fi

echo ""
echo "Note: This profile expects tools to be installed separately."
echo "DevOps tools are typically installed via package managers or"
echo "official installers due to system-level requirements."
echo ""

echo "Configuring MCP servers..."
echo "-------------------------"

if command -v claude &> /dev/null; then
    echo "Configure MCP servers for Claude Code? [Y/n] "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])?$ ]]; then
        claude mcp add @anthropic/fetch 2>/dev/null || warn "fetch MCP may already be configured"
        claude mcp add @anthropic/filesystem 2>/dev/null || warn "filesystem MCP may already be configured"
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

# Get versions
DOCKER_VER=$(docker --version 2>/dev/null || echo "not installed")
TERRAFORM_VER=$(terraform --version 2>/dev/null | head -1 || echo "not installed")
KUBECTL_VER=$(kubectl version --client --short 2>/dev/null || echo "not installed")

cat > "$CXMS_DIR/installed.json" << EOF
{
  "profile": "$PROFILE_NAME",
  "version": "$PROFILE_VERSION",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tools": {
    "docker": "$DOCKER_VER",
    "terraform": "$TERRAFORM_VER",
    "kubectl": "$KUBECTL_VER"
  },
  "mcp_servers": ["@anthropic/fetch", "@anthropic/filesystem"]
}
EOF
success "Profile record created at $CXMS_DIR/installed.json"

echo ""
echo "========================================"
echo -e "${GREEN}DevOps profile installed!${NC}"
echo "========================================"
echo ""
echo "Usage:"
echo "  cxms init --profile devops"
echo ""
echo "Verify tools:"
echo "  docker --version"
echo "  terraform --version"
echo "  kubectl version --client"
echo ""
