/**
 * Generic Logger Package
 *
 * Main entry point for the @thomassamoul/generic-logger package.
 *
 * This module exports all public APIs including:
 * - Logger singleton instance
 * - Core interfaces and classes
 * - Built-in adapters
 * - Sanitizers
 * - Configuration helpers
 * - TypeScript types
 *
 * @packageDocumentation
 * @example
 * ```typescript
 * import { logger, ConsoleLoggerAdapter } from '@thomassamoul/generic-logger';
 *
 * // Register an adapter
 * await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
 *   enabled: true,
 *   colorize: true
 * });
 *
 * // Start logging
 * logger.info('Application started');
 * ```
 */

/**
 * Main logger singleton instance.
 *
 * This is the primary entry point for most users. Register adapters
 * and use the convenience methods (debug, info, warn, error) to log messages.
 *
 * @example
 * ```typescript
 * import { logger } from '@thomassamoul/generic-logger';
 * logger.info('Hello world');
 * ```
 */
export { logger } from './logger-instance';

/**
 * Core logger repository class.
 *
 * Use this for advanced scenarios where you need more control
 * over adapter management and configuration.
 *
 * @example
 * ```typescript
 * import { LoggerRepository } from '@thomassamoul/generic-logger';
 * const repo = LoggerRepository.getInstance();
 * await repo.registerAdapter('console', adapter, config);
 * ```
 */
export { LoggerRepository } from './core/logger-repository';

/**
 * Logger adapter interface.
 *
 * Implement this interface to create custom adapters for any logging library.
 *
 * @example
 * ```typescript
 * import { ILoggerAdapter } from '@thomassamoul/generic-logger';
 * class MyAdapter extends ILoggerAdapter {
 *   // Implement interface methods
 * }
 * ```
 */
export { ILoggerAdapter } from './core/logger-adapter.interface';

/**
 * Sanitizer interfaces and base class.
 *
 * Use these to create custom sanitizers for data sanitization.
 *
 * @example
 * ```typescript
 * import { BaseSanitizer } from '@thomassamoul/generic-logger';
 * class MySanitizer extends BaseSanitizer {
 *   sanitize(data: unknown): unknown {
 *     // Your sanitization logic
 *   }
 * }
 * ```
 */
export type { ISanitizer } from './core/sanitizer.interface';
export { BaseSanitizer } from './core/sanitizer.interface';

/**
 * Built-in logger adapters.
 *
 * These adapters provide integrations with common logging libraries.
 * Users must provide their own pre-initialized instances for third-party adapters.
 */

/**
 * Console logger adapter - no dependencies required.
 */
export { ConsoleLoggerAdapter } from './adapters/console-logger-adapter';

/**
 * File logger adapter - requires custom fileWriter function.
 */
export { FileLoggerAdapter } from './adapters/file-logger-adapter';

/**
 * Sentry logger adapter - requires pre-initialized Sentry instance.
 */
export { SentryLoggerAdapter } from './adapters/sentry-logger-adapter';

/**
 * DataDog logger adapter - requires pre-initialized DataDog instance.
 */
export { DataDogLoggerAdapter } from './adapters/datadog-logger-adapter';

/**
 * Winston logger adapter - requires pre-initialized Winston logger.
 */
export { WinstonLoggerAdapter } from './adapters/winston-logger-adapter';

/**
 * Built-in sanitizers.
 */

/**
 * Default sanitizer with comprehensive sensitive data detection.
 */
export { DefaultSanitizer } from './sanitizers/default-sanitizer';

/**
 * Global sanitizer registry for tag-based sanitization.
 */
export { sanitizerRegistry } from './sanitizers/sanitizer-registry';

/**
 * Configuration helpers (optional examples).
 */

/**
 * Example configuration helper function.
 *
 * NOTE: This is just an example. Users should create their own
 * configuration and use registerAdapter() instead.
 */
export { getLoggerConfig } from './config/logger-config';

// Type exports
export type {
  LogLevel,
  LoggerEnvironment,
  LoggerConfig,
  LoggerContext,
  LogOptions,
  LogContext,
  ConsoleAdapterConfig,
  FileAdapterConfig,
  SentryAdapterConfig,
  DataDogAdapterConfig,
  WinstonAdapterConfig,
  LoggerAdapterConfig,
  AdapterConfigs,
  LoggerRepositoryConfig,
  SanitizerOptions,
  EnhancedLogOptions,
} from './types';
