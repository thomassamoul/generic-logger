/**
 * Logger Service
 *
 * Centralized logging service exports
 */

// Main logger singleton export
export { logger } from './logger-instance';

// Core exports
export { LoggerRepository } from './core/logger-repository';
export { ILoggerAdapter } from './core/logger-adapter.interface';
export { ISanitizer, BaseSanitizer } from './core/sanitizer.interface';

// Adapter exports
export { ConsoleLoggerAdapter } from './adapters/console-logger-adapter';
export { FileLoggerAdapter } from './adapters/file-logger-adapter';
export { SentryLoggerAdapter } from './adapters/sentry-logger-adapter';
export { DataDogLoggerAdapter } from './adapters/datadog-logger-adapter';
export { WinstonLoggerAdapter } from './adapters/winston-logger-adapter';

// Sanitizer exports
export { DefaultSanitizer } from './sanitizers/default-sanitizer';
export { sanitizerRegistry } from './sanitizers/sanitizer-registry';

// Configuration exports
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
