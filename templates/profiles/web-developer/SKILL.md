---
name: web-developer
description: |
  Full-stack web development toolkit with browser automation, testing, and modern frontend tools.

  Use this profile when working on:
  - React, Vue, Svelte, or Next.js applications
  - TypeScript/JavaScript projects
  - Frontend testing with Playwright or similar
  - API development and integration
  - CSS/styling and responsive design
  - Build tooling (Vite, Webpack, esbuild)

  Includes pre-configured Playwright for E2E testing, Prettier for formatting,
  and ESLint for code quality. MCP servers provide web fetching and file system access.
license: MIT
cxms:
  version: ">=1.6"
  deployment_levels: [lite, standard, max]
  profile_version: "1.0.0"
anthropic_skills:
  - webapp-testing
  - web-artifacts-builder
---

# Web Developer Profile

This profile configures Claude Code for full-stack web development with emphasis on testing, code quality, and modern tooling.

## Included Tools

### Global NPM Packages
- **playwright** - Browser automation and E2E testing
- **prettier** - Code formatting
- **eslint** - Code linting and quality

### MCP Servers
- **@anthropic/fetch** - Web requests for API testing
- **@anthropic/filesystem** - File system operations

### Anthropic Skills
- **webapp-testing** - Playwright patterns and best practices
- **web-artifacts-builder** - Component and artifact creation

## When This Profile Activates

The profile guidance loads when Claude detects web development context:
- Framework files (package.json with React/Vue/etc.)
- Test files (*.test.ts, *.spec.ts, playwright.config.ts)
- Frontend patterns (components/, pages/, styles/)
- API development (routes/, api/, endpoints/)

## Usage

```bash
# Install globally (one-time)
cxms profile install web-developer

# Apply to a project
cxms init --profile web-developer

# Combine with other profiles
cxms init --profile web-developer,technical-writer
```
