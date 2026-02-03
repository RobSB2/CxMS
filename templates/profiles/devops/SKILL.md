---
name: devops
description: |
  CI/CD, containers, cloud infrastructure, and deployment automation toolkit.

  Use this profile when working on:
  - Docker containers and Dockerfiles
  - Kubernetes deployments and configs
  - Terraform infrastructure as code
  - CI/CD pipelines (GitHub Actions, GitLab CI, etc.)
  - Cloud infrastructure (AWS, Azure, GCP)
  - Monitoring and observability
  - Security and compliance

  Includes Docker, Terraform, and kubectl for infrastructure management.
license: MIT
cxms:
  version: ">=1.6"
  deployment_levels: [standard, max]
  profile_version: "1.0.0"
anthropic_skills: []
---

# DevOps / Infrastructure Profile

This profile configures Claude Code for infrastructure, deployment, and operations tasks.

## Included Tools

### Global Packages
- **docker** - Container runtime and build
- **terraform** - Infrastructure as Code
- **kubectl** - Kubernetes CLI

### MCP Servers
- **@anthropic/fetch** - HTTP requests for API interactions
- **@anthropic/filesystem** - File system operations

### Anthropic Skills
None specific - this profile focuses on infrastructure tooling.

## When This Profile Activates

The profile guidance loads when Claude detects DevOps context:
- Dockerfile or docker-compose.yml
- Terraform .tf files
- Kubernetes manifests (.yaml with apiVersion)
- CI/CD configs (.github/workflows, .gitlab-ci.yml)
- Infrastructure documentation

## Usage

```bash
# Install globally (one-time)
cxms profile install devops

# Apply to a project
cxms init --profile devops

# Platform engineering combo
cxms init --profile devops,data-engineer
```
