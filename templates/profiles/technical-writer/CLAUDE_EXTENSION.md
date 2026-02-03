# Technical Writer Extension

**Profile:** technical-writer
**Version:** 1.0.0
**Purpose:** Role-specific guidance for documentation and technical writing

---

## Role Context

You are assisting a **technical writer**. Prioritize:
- Clarity over cleverness - write for the reader
- Consistency in terminology and style
- Accurate, up-to-date information
- Logical organization and navigation
- Accessibility for diverse audiences

## Available Tools

### Vale (Prose Linting)

**Status:** Installed globally
**Usage:** Enforce style guide rules on prose

```bash
# Check a file
vale README.md

# Check all docs
vale docs/

# Check with specific config
vale --config=.vale.ini docs/

# List available styles
vale ls-config
```

**Vale Configuration (`.vale.ini`):**
```ini
StylesPath = styles
MinAlertLevel = suggestion

[*.md]
BasedOnStyles = Vale, write-good, Microsoft
```

**Common Vale Styles:**
- `Microsoft` - Microsoft Writing Style Guide
- `Google` - Google Developer Documentation Style Guide
- `write-good` - General writing improvements
- `proselint` - Prose best practices

### Markdownlint

**Status:** Installed globally
**Usage:** Consistent Markdown formatting

```bash
# Check files
npx markdownlint "**/*.md"

# Fix auto-fixable issues
npx markdownlint --fix "**/*.md"

# With config
npx markdownlint -c .markdownlint.json "**/*.md"
```

**Markdownlint Config (`.markdownlint.json`):**
```json
{
  "MD013": false,
  "MD033": false,
  "MD041": false,
  "line-length": false,
  "no-inline-html": false
}
```

## Pre-Approved Operations

| Operation | Notes |
|-----------|-------|
| Run Vale | Style checking |
| Run markdownlint | Format checking |
| Read any file | Research and context |
| Edit documentation | .md, .mdx, .rst files |
| Web fetch | Research and references |

## Documentation Structure Patterns

### README Template
```markdown
# Project Name

Brief description (1-2 sentences).

## Features

- Feature 1 - brief explanation
- Feature 2 - brief explanation

## Quick Start

```bash
npm install project-name
```

## Usage

[Basic usage example]

## Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api.md)
- [Configuration](docs/configuration.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[License type] - see [LICENSE](LICENSE).
```

### API Documentation Template
```markdown
# API Reference

## Authentication

All requests require an API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### GET /resource

Retrieves a list of resources.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| limit | integer | No | Max results (default: 20) |
| offset | integer | No | Pagination offset |

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

**Errors:**

| Code | Description |
|------|-------------|
| 401 | Invalid API key |
| 429 | Rate limit exceeded |
```

### Tutorial Template
```markdown
# How to [Accomplish Task]

In this tutorial, you'll learn how to [outcome].

**Prerequisites:**
- [Requirement 1]
- [Requirement 2]

**Time:** ~15 minutes

## Step 1: [First Step]

[Explanation of what we're doing and why]

```bash
[code example]
```

[Expected result or screenshot]

## Step 2: [Second Step]

[Continue pattern...]

## Summary

You've learned how to:
- [Accomplishment 1]
- [Accomplishment 2]

## Next Steps

- [Related tutorial]
- [Advanced topic]
```

## Writing Style Guidelines

### Voice and Tone
- **Active voice** over passive: "The function returns a value" not "A value is returned"
- **Second person** for instructions: "You can configure..." not "Users can configure..."
- **Present tense**: "This method creates..." not "This method will create..."

### Structure
- **One idea per paragraph**
- **Short sentences** (under 25 words ideal)
- **Bulleted lists** for 3+ items
- **Numbered lists** for sequential steps
- **Code blocks** for any technical content

### Terminology
- **Consistent terms**: Pick one term and stick with it
- **Define acronyms** on first use
- **Avoid jargon** unless writing for experts

### Examples
```markdown
# Good
Click **Save** to store your changes.

# Avoid
Click the Save button which will store your changes to the database.
```

```markdown
# Good
1. Open the terminal.
2. Run `npm install`.
3. Start the server with `npm start`.

# Avoid
First you need to open the terminal, then run npm install, and finally start the server by running npm start.
```

## Document Review Checklist

Before publishing:
- [ ] **Accuracy** - All code examples tested and working
- [ ] **Completeness** - All steps included, no assumptions
- [ ] **Clarity** - Readable by target audience
- [ ] **Consistency** - Terminology, formatting uniform
- [ ] **Links** - All links working, relative where possible
- [ ] **Images** - Alt text provided, sized appropriately
- [ ] **Code blocks** - Language specified for syntax highlighting
- [ ] **Vale/lint** - No style errors

## Content Types Reference

| Type | Purpose | Length | Update Frequency |
|------|---------|--------|------------------|
| README | Project overview | 1-2 pages | Each release |
| Tutorial | Teach a skill | 5-15 min read | As needed |
| How-to | Solve specific problem | 2-5 min read | As needed |
| Reference | Complete API/config | Comprehensive | Each release |
| Explanation | Conceptual understanding | 5-10 min read | Rarely |

## Markdown Best Practices

```markdown
# Headings
- Use sentence case: "Getting started" not "Getting Started"
- Don't skip levels: h1 → h2 → h3

# Links
- Descriptive text: [installation guide](link) not [click here](link)
- Relative paths for internal: [API docs](./api.md)

# Code
- Specify language: ```javascript not just ```
- Keep examples minimal but complete
- Include expected output for complex examples

# Images
- Alt text always: ![Diagram showing data flow](diagram.png)
- Reasonable size (< 1MB)
- SVG for diagrams when possible

# Tables
- Align columns for readability in source
- Keep tables simple (< 5 columns)
```

## Quick Reference

| Task | Tool/Command |
|------|--------------|
| Check style | `vale docs/` |
| Check markdown | `npx markdownlint "**/*.md"` |
| Fix markdown | `npx markdownlint --fix "**/*.md"` |
| Word count | `wc -w file.md` |
| Preview markdown | Use VS Code preview or `grip` |
