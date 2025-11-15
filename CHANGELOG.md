# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project structure guidelines in `PROJECT_STRUCTURE.md`
- CONTRIBUTING.md with git workflow documentation
- Release highlights extraction from CHANGELOG.md
- Automated PR creation script (`scripts/create-pr.js`)
- Automated tag and release script (`scripts/create-tag-and-release.js`)

### Changed
- GitHub Actions publish workflow now extracts highlights from CHANGELOG for releases
- Release body format includes highlights section at top, CHANGELOG link at bottom

### Documentation
- Added `PROJECT_STRUCTURE.md` with project structure guidelines
- Added CONTRIBUTING.md with detailed git workflow (branch → commits → PR → squash merge)
- Updated release scripts to automatically extract highlights from CHANGELOG
- Documented automated PR and release workflows

## [0.2.0] - 2025-11-15

### Added
- Pluggable formatters system with `IFormatter` interface
- Built-in formatters: `JsonFormatter`, `PlainTextFormatter`, `CombinedFormatter`
- Repository-level formatting pipeline: sanitize → format → adapters
- Formatted output available to adapters via `context.metadata._formattedOutput`
- `MockLoggerAdapter` for testing with in-memory log storage
- Mock adapter helper methods: `getLogs()`, `getLogsByLevel()`, `getLogsByMessage()`, `getLogsByTag()`, `hasLog()`, `clearLogs()`, `getLogCount()`, `getLogCountByLevel()`
- File adapter rotation configuration (`FileRotationConfig`) with support for size, time, and combined strategies
- File adapter now consumes formatted output when available
- `FileRotationConfig` interface with rotation strategy, maxSize, maxFiles, pattern, and retentionDays options
- Getting Started guide (`docs/getting-started.md`)
- Testing with Jest guide (`docs/testing.md`) with examples and patterns

### Changed
- `LoggerRepository.log()` now applies formatting after sanitization if formatters are configured
- File adapter accepts formatted output from repository formatters
- File adapter passes rotation config and formatted text to `fileWriter` function via context metadata

### Documentation
- Added comprehensive Getting Started guide
- Added Testing with Jest guide with MockLoggerAdapter examples
- Updated README with formatters section and file adapter rotation documentation
- Added examples for file rotation implementation in fileWriter

### Fixed
- Fixed TypeScript `isolatedModules` errors by using `export type` for formatter interfaces
- Manual release creation script and workflow dispatch option for creating releases for existing tags

## [0.1.2] - 2025-11-05

### Added
- Project visualization image in README
- CHANGELOG.md file with release history

### Fixed
- Manual release creation workflow support for existing tags
- GitHub release permissions to allow automated release creation
- Release workflow CHANGELOG.md link to point to tag instead of main branch

## [0.1.1] - 2025-11-03

### Added
- Automated version bumping script with release branch creation
- GitHub Actions workflow for automated npm publishing and release creation
- Support for creating release branches per version
- Manual release creation option via GitHub CLI script

### Fixed
- GitHub release permissions in publish workflow
- Version bump script to properly detect package.json changes
- Tag creation and pushing workflow

## [0.1.0] - 2025-11-03

### Added
- Initial release of generic logger package
- Core `LoggerRepository` with adapter pattern
- Multiple adapter implementations:
  - Console adapter (Browser, Node.js)
  - Sentry adapter (requires user-provided Sentry instance)
  - DataDog adapter (requires user-provided DataDog instance)
  - Winston adapter (requires user-provided Winston logger)
  - File adapter (Node.js only, requires user-provided file writer)
- Sanitization system with `DefaultSanitizer` for sensitive data redaction
- Support for ESM and CJS dual output
- Comprehensive TypeScript definitions and JSDoc documentation
- Unit tests for core components
- CI/CD pipeline with GitHub Actions
- Full documentation in README with usage examples for all platforms

### Features
- Zero dependencies on third-party logging libraries (adapters accept user-provided instances)
- Works across Browser, Node.js, React, and React Native
- Flexible adapter registration system
- Sensitive data sanitization
- Log level filtering (DEBUG, INFO, WARN, ERROR)
- Context and metadata support
- Singleton pattern for global logger access

[Unreleased]: https://github.com/thomassamoul/generic-logger/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/thomassamoul/generic-logger/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/thomassamoul/generic-logger/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/thomassamoul/generic-logger/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/thomassamoul/generic-logger/releases/tag/v0.1.0
