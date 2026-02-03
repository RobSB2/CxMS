---
name: technical-writer
description: |
  Documentation, API specs, and content creation toolkit.

  Use this profile when working on:
  - README files and project documentation
  - API documentation and specs
  - User guides and tutorials
  - Technical blog posts and articles
  - Style guide compliance
  - Content editing and proofreading
  - Documentation site generation

  Includes Vale for style checking and document processing skills.
license: MIT
cxms:
  version: ">=1.6"
  deployment_levels: [lite, standard, max]
  profile_version: "1.0.0"
anthropic_skills:
  - docx
  - pdf
  - doc-coauthoring
  - brand-guidelines
---

# Technical Writer Profile

This profile configures Claude Code for documentation and technical writing tasks.

## Included Tools

### Global Packages
- **vale** - Prose linting for style consistency
- **markdownlint** - Markdown formatting rules

### MCP Servers
- **@anthropic/fetch** - Web research for documentation

### Anthropic Skills
- **docx** - Word document creation/editing
- **pdf** - PDF processing
- **doc-coauthoring** - Structured documentation workflow
- **brand-guidelines** - Brand consistency guidance

## When This Profile Activates

The profile guidance loads when Claude detects documentation context:
- README.md or documentation files
- docs/ or documentation/ directories
- API spec files (OpenAPI, AsyncAPI)
- Content writing requests
- Style guide discussions

## Usage

```bash
# Install globally (one-time)
cxms profile install technical-writer

# Apply to a project
cxms init --profile technical-writer

# Developer who documents combo
cxms init --profile web-developer,technical-writer
```
