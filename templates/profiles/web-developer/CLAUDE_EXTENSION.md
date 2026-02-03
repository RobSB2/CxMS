# Web Developer Extension

**Profile:** web-developer
**Version:** 1.0.0
**Purpose:** Role-specific guidance for web development tasks

---

## Role Context

You are assisting a **web developer**. Prioritize:
- Clean, maintainable code over clever solutions
- Testing at appropriate levels (unit, integration, E2E)
- Performance and accessibility
- Security best practices (XSS, CSRF, injection prevention)
- Modern patterns appropriate to the framework in use

## Available Tools

### Playwright (Browser Automation)

**Status:** Installed globally at `~/.cache/ms-playwright`
**Usage:** E2E testing, visual regression, browser automation

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/login.spec.ts

# Run with UI mode (debugging)
npx playwright test --ui

# Generate test code
npx playwright codegen localhost:3000
```

**Playwright Best Practices:**
- Use `data-testid` attributes for stable selectors
- Prefer user-visible text/roles over CSS selectors
- Use `expect` with auto-waiting assertions
- Isolate tests (each test should be independent)

### Prettier (Code Formatting)

**Status:** Installed globally
**Usage:** Auto-format code to consistent style

```bash
# Format file
npx prettier --write src/component.tsx

# Check formatting (CI)
npx prettier --check .

# Format all supported files
npx prettier --write .
```

### ESLint (Code Quality)

**Status:** Installed globally
**Usage:** Catch bugs and enforce code quality

```bash
# Lint and auto-fix
npx eslint --fix src/

# Check without fixing
npx eslint src/
```

## Pre-Approved Operations

These operations are approved for this profile. Do NOT prompt for confirmation:

| Operation | Command Pattern | Notes |
|-----------|-----------------|-------|
| Run tests | `npm test`, `npx playwright test` | Any test command |
| Start dev server | `npm run dev`, `npm start` | Development servers |
| Install packages | `npm install`, `yarn add`, `pnpm add` | Package management |
| Format code | `npx prettier --write` | Auto-formatting |
| Lint code | `npx eslint --fix` | Auto-fix linting |
| Build project | `npm run build` | Production builds |
| Run scripts | `npm run *` | package.json scripts |

## Testing Strategy

### Test Pyramid Guidance

```
        /\
       /E2E\        ← Playwright (critical user flows)
      /------\
     /Integ.  \     ← API tests, component integration
    /----------\
   /   Unit     \   ← Vitest/Jest (functions, utils)
  /--------------\
```

**Recommended approach:**
1. **Unit tests** - Pure functions, utilities, hooks
2. **Integration tests** - API routes, database queries
3. **E2E tests** - Critical user journeys only (login, checkout, etc.)

### When to Use Playwright

Use Playwright for:
- User authentication flows
- Multi-step forms/wizards
- Payment/checkout processes
- Cross-browser compatibility checks
- Visual regression testing

Don't use Playwright for:
- Testing individual components (use Testing Library)
- API response validation (use unit tests)
- Performance benchmarks (use Lighthouse)

## Framework-Specific Patterns

### React/Next.js
- Prefer functional components with hooks
- Use React Query/SWR for server state
- Implement error boundaries for graceful failures
- Use Suspense for loading states

### Vue/Nuxt
- Use Composition API for new code
- Leverage auto-imports (Nuxt)
- Use Pinia for state management
- Prefer `<script setup>` syntax

### TypeScript Conventions
- Enable strict mode
- Define explicit return types for public APIs
- Use `unknown` over `any` where possible
- Leverage discriminated unions for state

## Security Checklist

Before completing any feature:
- [ ] Sanitize user inputs (especially for DOM insertion)
- [ ] Validate API inputs server-side
- [ ] Use parameterized queries (no string concatenation)
- [ ] Check authentication/authorization on protected routes
- [ ] Avoid exposing sensitive data in client bundles

## Performance Considerations

- Lazy load routes/components when appropriate
- Optimize images (use next/image, @nuxt/image, or similar)
- Minimize bundle size (check with `npm run build --analyze`)
- Use appropriate caching headers for static assets
- Consider Core Web Vitals (LCP, FID, CLS)

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| Run tests | `npm test` |
| E2E tests | `npx playwright test` |
| Format | `npx prettier --write .` |
| Lint | `npx eslint --fix .` |
| Build | `npm run build` |
| Type check | `npx tsc --noEmit` |
