# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Manual release creation script and workflow dispatch option for creating releases for existing tags

## [0.1.2] - 2025-01-XX

### Added
- Project visualization image in README

### Fixed
- Manual release creation workflow support for existing tags
- GitHub release permissions to allow automated release creation

## [0.1.1] - 2025-01-XX

### Added
- Automated version bumping script with release branch creation
- GitHub Actions workflow for automated npm publishing and release creation
- Support for creating release branches per version
- Manual release creation option via GitHub CLI script

### Fixed
- GitHub release permissions in publish workflow
- Version bump script to properly detect package.json changes
- Tag creation and pushing workflow

## [0.1.0] - 2025-01-XX

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

[Unreleased]: https://github.com/thomassamoul/generic-logger/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/thomassamoul/generic-logger/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/thomassamoul/generic-logger/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/thomassamoul/generic-logger/releases/tag/v0.1.0
