# Generic Logger - Project Structure Guidelines

## Project Overview

This is a generic, customizable logging library that works across Browser, Node.js, React, and React Native. The project follows a modular architecture with clear separation of concerns.

## Directory Structure

```
logger/
├── adapters/          # Logger adapter implementations
├── formatters/        # Log formatter implementations
├── sanitizers/        # Data sanitizer implementations
├── core/              # Core interfaces and repository
├── config/            # Configuration helpers
├── types.ts           # TypeScript type definitions
├── index.ts           # Main entry point (exports)
└── logger-instance.ts # Singleton logger instance
```

## File Organization Rules

### Adapters (`logger/adapters/`)
- **Purpose**: Implementations that connect to specific logging libraries
- **Naming**: `*-logger-adapter.ts` (e.g., `console-logger-adapter.ts`)
- **Exports**: Export adapter class (e.g., `ConsoleLoggerAdapter`)
- **Pattern**: Extend `ILoggerAdapter` from `core/logger-adapter.interface.ts`
- **Examples**: `console-logger-adapter.ts`, `sentry-logger-adapter.ts`, `mock-logger-adapter.ts`

### Formatters (`logger/formatters/`)
- **Purpose**: Transform log entries into different output formats
- **Naming**: `*-formatter.ts` (e.g., `json-formatter.ts`)
- **Exports**: Export formatter class and interface
- **Pattern**: Implement `IFormatter` interface
- **Examples**: `json-formatter.ts`, `plain-text-formatter.ts`, `combined-formatter.ts`
- **Index**: Export all from `formatters/index.ts`

### Sanitizers (`logger/sanitizers/`)
- **Purpose**: Sanitize sensitive data before logging
- **Naming**: `*-sanitizer.ts` (e.g., `default-sanitizer.ts`)
- **Exports**: Export sanitizer class
- **Pattern**: Extend `BaseSanitizer` or implement `ISanitizer`
- **Examples**: `default-sanitizer.ts`, `sanitizer-registry.ts`

### Core (`logger/core/`)
- **Purpose**: Core interfaces and main repository
- **Files**:
  - `logger-adapter.interface.ts` - Adapter interface
  - `logger-repository.ts` - Main repository class
  - `sanitizer.interface.ts` - Sanitizer interfaces
- **Rule**: Core interfaces should be in this directory

### Types (`logger/types.ts`)
- **Purpose**: All TypeScript type definitions
- **Rule**: Keep all type definitions centralized here
- **Exports**: Export all types for external use

### Index (`logger/index.ts`)
- **Purpose**: Main entry point, exports all public APIs
- **Rule**: Re-export everything users might need
- **Organization**: Group exports logically (adapters, formatters, sanitizers, types)

## Code Organization Principles

### 1. Interface-First Design
- Define interfaces before implementations
- Use interfaces for abstraction and testability
- Keep interfaces in `core/` or as separate files

### 2. Single Responsibility
- Each adapter handles one logging library
- Each formatter handles one format type
- Each sanitizer has a specific sanitization strategy

### 3. Dependency Injection
- Adapters accept configuration objects
- Users provide their own library instances
- No hard dependencies on third-party libraries

### 4. Platform Agnostic
- Code should work in Browser, Node.js, and React Native
- Use platform-specific adapters only when necessary
- Provide platform-specific examples in docs

### 5. Type Safety
- All code should be fully typed
- Export types for external use
- Use TypeScript interfaces for contracts

## Naming Conventions

### Files
- **Adapters**: `{name}-logger-adapter.ts` (kebab-case)
- **Formatters**: `{name}-formatter.ts` (kebab-case)
- **Sanitizers**: `{name}-sanitizer.ts` (kebab-case)
- **Interfaces**: `{name}.interface.ts` (e.g., `logger-adapter.interface.ts`)
- **Types**: `types.ts` or `{name}.types.ts`

### Classes
- **Adapters**: `{Name}LoggerAdapter` (PascalCase, suffix with LoggerAdapter)
- **Formatters**: `{Name}Formatter` (PascalCase, suffix with Formatter)
- **Sanitizers**: `{Name}Sanitizer` (PascalCase, suffix with Sanitizer)
- **Interfaces**: `I{Name}` (prefix with I, PascalCase)

### Exports
- **Default exports**: Avoid (prefer named exports)
- **Named exports**: Use descriptive names matching class/interface names
- **Type exports**: Use `export type` for TypeScript isolatedModules

## Adding New Features

### Adding a New Adapter
1. Create file in `logger/adapters/{name}-logger-adapter.ts`
2. Extend `ILoggerAdapter` from `core/logger-adapter.interface.ts`
3. Implement required methods: `initialize()`, `log()`, `destroy()`, `isEnabled()`
4. Export from `logger/index.ts`
5. Add tests in `__tests__/adapters/{name}-logger-adapter.test.ts`

### Adding a New Formatter
1. Create file in `logger/formatters/{name}-formatter.ts`
2. Implement `IFormatter` interface
3. Implement `format()` method returning `FormattedOutput`
4. Export from `logger/formatters/index.ts`
5. Export from `logger/index.ts`

### Adding a New Sanitizer
1. Create file in `logger/sanitizers/{name}-sanitizer.ts`
2. Extend `BaseSanitizer` or implement `ISanitizer`
3. Implement `sanitize()` method
4. Export from `logger/index.ts`
5. Add tests in `__tests__/sanitizers/{name}-sanitizer.test.ts`

### Adding New Types
1. Add type definitions to `logger/types.ts`
2. Export from `logger/index.ts` if needed by users
3. Update documentation if types are public APIs

## Testing Structure

### Test Files Location
- Mirror source structure: `__tests__/{category}/{file-name}.test.ts`
- **Adapters**: `__tests__/adapters/`
- **Sanitizers**: `__tests__/sanitizers/`
- **Core**: `__tests__/core/`

### Test Patterns
- Use `MockLoggerAdapter` for testing log behavior
- Mock console.warn in error handling tests
- Reset repository instance between tests: `LoggerRepository.resetInstance()`

## Documentation Structure

### Docs Directory (`docs/`)
- `getting-started.md` - Quick start guide
- `testing.md` - Testing guide with Jest

### README.md
- Installation instructions
- Quick start examples
- API reference
- Platform-specific examples
- Links to detailed docs

### CHANGELOG.md
- Follow Keep a Changelog format
- Update on every functional change
- Sections: Added, Changed, Fixed, Documentation

## Git Workflow

### Branch Strategy
- **Feature branches**: `feature/description` (e.g., `feature/add-cloudwatch-adapter`)
- **Fix branches**: `fix/description` (e.g., `fix/memory-leak-in-repository`)
- **Never commit directly to main**

### Commit Strategy
- **One logical change per commit**
- **Separate commits for**: code changes, tests, docs, CHANGELOG
- **Commit messages**: Use conventional commits (feat:, fix:, docs:, test:, etc.)

### Pull Request Flow
1. Create feature branch
2. Make logical commits (not one big commit)
3. Push branch to remote
4. Create PR with descriptive title and description
5. Merge using **squash and merge** (not regular merge)
6. Tags and releases created **AFTER** merge to main

### Release Process
1. Merge PR to main (squash merge)
2. After merge, create tag: `v{major}.{minor}.{patch}`
3. Push tag to trigger publish workflow
4. Workflow publishes to npm and creates GitHub release
5. GitHub release includes highlights from CHANGELOG

## Code Style

### TypeScript
- Use explicit types (avoid `any` unless necessary)
- Use `export type` for type-only exports (isolatedModules)
- Prefer interfaces for object shapes
- Use readonly for immutable data structures

### Comments
- Use JSDoc for public APIs
- Add comments for complex logic
- Document "why" not "what" in comments

### Error Handling
- Fail gracefully (catch errors, log warnings, don't crash)
- Use console.warn for recoverable errors
- Never throw in logging code that could break the app

