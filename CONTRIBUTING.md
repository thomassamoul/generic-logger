# Contributing to Generic Logger

Thank you for your interest in contributing to Generic Logger! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Git Workflow](#git-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Testing](#testing)
- [Code Style](#code-style)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed project structure guidelines. Key directories:

- `logger/adapters/` - Logger adapter implementations
- `logger/formatters/` - Log formatter implementations
- `logger/sanitizers/` - Data sanitizer implementations
- `logger/core/` - Core interfaces and repository
- `logger/types.ts` - TypeScript type definitions
- `__tests__/` - Test files mirroring source structure
- `docs/` - Documentation files

## Development Workflow

### Prerequisites

- Node.js 20+
- npm or yarn
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/generic-logger.git
   cd generic-logger
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run tests:
   ```bash
   npm test
   ```

## Git Workflow

### Branch Strategy

**Always create a feature branch from `main`:**

```bash
# Create and checkout a new feature branch
git checkout -b feature/description-of-feature

# Or for bug fixes
git checkout -b fix/description-of-bug
```

**Branch naming conventions:**
- `feature/description` - For new features
- `fix/description` - For bug fixes
- `docs/description` - For documentation updates
- `refactor/description` - For code refactoring

### Commit Strategy

**Make logical, atomic commits** - one logical change per commit:

```bash
# Good: Separate commits for different changes
git add logger/adapters/new-adapter.ts
git commit -m "feat: add new CloudWatch adapter"

git add __tests__/adapters/new-adapter.test.ts
git commit -m "test: add tests for CloudWatch adapter"

git add README.md
git commit -m "docs: update README with CloudWatch adapter example"

# Bad: One commit with everything
git add .
git commit -m "added cloudwatch adapter"
```

**Commit message format:**

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes

Examples:
```bash
git commit -m "feat: add JsonFormatter for structured logging"
git commit -m "fix: correct TypeScript export type errors"
git commit -m "docs: update Getting Started guide with examples"
git commit -m "test: add tests for MockLoggerAdapter"
```

### Push Branch

After making commits, push your branch:

```bash
git push -u origin feature/description-of-feature
```

## Pull Request Process

### Creating a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push -u origin feature/your-feature
   ```

2. **Create a PR** on GitHub:
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template:
     - **Title**: Clear, descriptive title (e.g., "feat: add CloudWatch adapter")
     - **Description**: Explain what changes you made and why
     - **Link to issue**: If applicable
     - **Testing**: Describe how you tested the changes

3. **Ensure CI passes**: Wait for GitHub Actions to run tests

4. **Address review feedback**: Make requested changes in additional commits

### PR Requirements

- All tests must pass
- Code must follow project style guidelines
- CHANGELOG.md must be updated if functionality changes
- Documentation must be updated for new features
- PR should be up to date with `main` branch

### Merging

**Important: Use "Squash and Merge" when merging PRs to `main`**

- Do NOT use "Merge commit" or "Rebase and merge"
- The squash merge creates a single commit on `main`
- This keeps the history clean and linear

## Release Process

### After PR is Merged

1. **Merge PR to `main`** (using squash and merge)
2. **Wait for merge to complete** on GitHub
3. **Create tag and release** (see below)

### Creating a Release

**Tags and releases are created AFTER merging to main:**

#### Automated (Recommended)

Use the automated script that creates tag, pushes it, and lets GitHub Actions handle the release:

```bash
# After PR is merged to main
git checkout main
git pull origin main

# Create tag and release (automated)
node scripts/create-tag-and-release.js

# Or specify version explicitly
node scripts/create-tag-and-release.js 0.3.0

# Dry run to preview
node scripts/create-tag-and-release.js --dry-run
```

This script will:
1. ✅ Ensure you're on main branch
2. ✅ Pull latest changes
3. ✅ Create git tag
4. ✅ Push tag to remote (triggers GitHub Actions)
5. ✅ GitHub Actions workflow will automatically:
   - Extract highlights from CHANGELOG.md
   - Publish to npm (using trusted publishing OIDC)
   - Create GitHub release with highlights

#### Manual Process

If you prefer manual steps:

1. **Checkout main and pull latest:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify CHANGELOG.md is updated** with the version entry

3. **Verify package.json version** matches the release version

4. **Create and push tag:**
   ```bash
   git tag v0.2.1 -m "v0.2.1 - Description of changes"
   git push origin v0.2.1
   ```

5. **The publish workflow will automatically:**
   - Extract highlights from CHANGELOG.md
   - Publish to npm (using trusted publishing OIDC)
   - Create GitHub release with highlights

**Note:** The GitHub Actions workflow (`publish.yml`) runs automatically when a tag is pushed to `main`.

6. **Or manually create release** (if workflow fails):
   ```bash
   npm run release:create v0.2.1
   ```

### CHANGELOG Updates

**Update CHANGELOG.md on every functional change:**

1. **Add entries under `[Unreleased]`** during development:
   ```markdown
   ## [Unreleased]

   ### Added
   - New feature X
   - New feature Y

   ### Fixed
   - Bug fix Z
   ```

2. **Move to version section when releasing:**
   - Create new section: `## [0.2.1] - YYYY-MM-DD`
   - Move Unreleased content to the version section
   - Update comparison links at bottom

**CHANGELOG format:**
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Sections: Added, Changed, Fixed, Removed, Deprecated, Security, Documentation
- One bullet point per change
- Be specific and descriptive

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check
```

### Writing Tests

- Test files should mirror source structure: `__tests__/{category}/{file-name}.test.ts`
- Use `MockLoggerAdapter` for testing logging behavior
- Reset repository between tests: `LoggerRepository.resetInstance()`
- Mock `console.warn` in error handling tests

Example:
```typescript
describe('MyFeature', () => {
  let mockAdapter: MockLoggerAdapter;

  beforeEach(async () => {
    mockAdapter = new MockLoggerAdapter();
    await mockAdapter.initialize({ enabled: true });
    await logger.registerAdapter('mock', mockAdapter, { enabled: true });
  });

  afterEach(() => {
    mockAdapter.clearLogs();
    LoggerRepository.resetInstance();
  });

  it('should log correctly', () => {
    logger.info('Test message');
    expect(mockAdapter.getLogs()).toHaveLength(1);
  });
});
```

## Code Style

### TypeScript

- Use explicit types (avoid `any`)
- Use `export type` for type-only exports (for `isolatedModules`)
- Follow existing code patterns
- Add JSDoc comments for public APIs

### File Organization

- Follow the structure in `PROJECT_STRUCTURE.md`
- Keep files focused and single-purpose
- Export from appropriate index files

### Error Handling

- Fail gracefully (don't crash the app)
- Use `console.warn` for recoverable errors
- Never throw in logging code that could break the app

## Getting Help

- Open an issue for bug reports or feature requests
- Check existing issues before creating new ones
- Be specific and provide examples when possible

Thank you for contributing to Generic Logger! 🎉

