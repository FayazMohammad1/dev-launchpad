# Dev Launchpad

A production-ready starter for building and iterating on full-stack apps with a clean frontend + backend structure.

## What This Repo Provides

- Frontend and backend split for clean ownership.
- Patterns and prompts to keep development consistent.
- Documentation on architecture, optimizations, and implementation.

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Node.js + TypeScript

## Project Structure

- Backend: [backend/](backend)
- Frontend: [frontend/](frontend)
- Docs: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run (dev)

```bash
cd backend && npm run dev
cd ../frontend && npm run dev
```

## Environment Variables

If the backend requires environment variables, create a .env file in backend/.
If the frontend requires environment variables, create a .env file in frontend/.

Keep secrets out of version control.

## Scripts

Common scripts are available in each package.json:

- npm run dev
- npm run build
- npm run lint
- npm run test (if configured)

## Commit Message Guidelines

This project follows the **Conventional Commits** standard to maintain a clean, readable, and professional commit history.
Use the categories below when writing commit messages.

### 1. feat — New Features

Examples:

```bash
feat: integrate Google GenAI SDK
feat: add user authentication flow
```

### 2. fix — Bug Fixes

Examples:

```bash
fix: resolve API key undefined error
fix: correct JWT token validation issue
```

### 3. refactor — Code Restructuring (No Behavior Change)

Examples:

```bash
refactor: simplify API response logic
refactor: reorganize services into modules
```

### 4. perf — Performance Improvements

Examples:

```bash
perf: optimize database queries with indexing
perf: reduce bundle size by removing unused imports
```

### 5. test — Adding or Updating Tests

Examples:

```bash
test: add unit tests for auth controller
test: create integration tests for API endpoints
```

### 6. chore — Maintenance Tasks & Config Updates

Examples:

```bash
chore: update dependencies to latest versions
chore: add ESLint and Prettier configuration
```

### 7. docs — Documentation Updates

Examples:

```bash
docs: update README with setup instructions
docs: add API documentation for integrations
```

### 8. style — Code/Formatting Changes (No Logic Change)

Examples:

```bash
style: fix lint warnings and formatting
style: update button styles for consistency
```

### 9. db — Database Changes

Examples:

```bash
db: add migration for session table
db: update schema with new foreign keys
```

### 10. security — Security Fixes & Improvements

Examples:

```bash
security: sanitize user input to prevent XSS
security: update password hashing to stronger algorithm
```

## Code Quality Principles

- Favor clarity over cleverness.
- Keep functions small and single-purpose.
- Name things explicitly; avoid ambiguous abbreviations.
- Avoid premature optimization; measure before optimizing.
- Prefer immutable data where practical.
- Fail fast and handle errors at the boundary.
- Keep logic close to the data it operates on.
- Avoid duplication; extract shared behavior early.
- Write tests for critical paths and edge cases.
- Keep dependencies minimal and well-audited.

## Production-Grade Practices

- Linting and formatting enforced in CI.
- Type-safe contracts between frontend and backend.
- Configuration via environment variables, not code.
- Secrets managed with a vault or CI secrets store.
- Structured logging with correlation IDs.
- Health checks for backend services.
- Rate limiting and input validation on APIs.
- Monitoring and alerting for error rates and latency.
- Automated backups for stateful services.
- Documented deployment steps and rollback strategy.

## Security Guidelines

- Validate and sanitize all user input.
- Never log secrets or tokens.
- Use least-privilege for service credentials.
- Keep dependencies patched and audited.

## Documentation

Start with [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for architecture, patterns, and implementation details.
