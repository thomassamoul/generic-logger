/**
 * Logger Singleton Instance
 *
 * Provides a convenient singleton logger instance with helper methods.
 * This is the primary entry point for most users. It wraps the LoggerRepository
 * and provides convenience methods like logger.info(), logger.error(), etc.
 *
 * Users should register adapters before using the logger. The logger automatically
 * enables when the first adapter is registered.
 *
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
 * // Use convenience methods
 * logger.info('Application started');
 * logger.error('Something failed', new Error('Details'));
 * ```
 */

import { LoggerRepository } from './core/logger-repository';
import { LogContext, LoggerRepositoryConfig, LogLevel } from './types';

/**
 * Singleton logger class that provides convenient logging methods.
 *
 * This class wraps the LoggerRepository and provides a simpler API
 * with methods like info(), error(), etc. It automatically manages
 * initialization and delegates to the repository for actual logging.
 *
 * @class LoggerSingleton
 */
class LoggerSingleton {
  private static instance: LoggerSingleton | null = null;
  private repository: LoggerRepository;
  private initialized = false;

  /**
   * Private constructor to enforce singleton pattern.
   *
   * @param {LoggerRepositoryConfig} [config] - Optional repository configuration
   * @private
   */
  private constructor(config?: LoggerRepositoryConfig) {
    this.repository = LoggerRepository.getInstance(config);
  }

  /**
   * Get the singleton logger instance.
   *
   * @param {LoggerRepositoryConfig} [config] - Optional configuration (only used on first call)
   * @returns {LoggerSingleton} The singleton logger instance
   *
   * @example
   * ```typescript
   * const logger = LoggerSingleton.getInstance();
   * ```
   */
  static getInstance(config?: LoggerRepositoryConfig): LoggerSingleton {
    if (!LoggerSingleton.instance) {
      LoggerSingleton.instance = new LoggerSingleton(config);
    }
    return LoggerSingleton.instance;
  }

  /**
   * Register an adapter with the logger.
   *
   * This is the recommended way to add logging adapters. The logger
   * automatically enables when the first adapter is registered.
   *
   * @param {string} name - Unique name for the adapter (e.g., 'console', 'sentry')
   * @param {any} adapter - The adapter instance to register
   * @param {any} [config] - Optional configuration for the adapter
   * @returns {Promise<void>} Resolves when adapter is registered
   *
   * @example
   * ```typescript
   * await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
   *   enabled: true,
   *   colorize: true
   * });
   * ```
   */
  async registerAdapter(name: string, adapter: any, config?: any): Promise<void> {
    await this.repository.registerAdapter(name, adapter, config);
    // Enable repository when first adapter is registered
    if (!this.initialized) {
      this.repository.enable();
      this.initialized = true;
    }
  }

  /**
   * Log a message at the specified level.
   *
   * This is the core logging method. If the logger is not initialized,
   * it falls back to console logging.
   *
   * @param {LogLevel} level - The severity level
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {void}
   *
   * @example
   * ```typescript
   * logger.log('info', 'User logged in', { tag: '[Auth]', userId: 123 });
   * ```
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.initialized) {
      // eslint-disable-next-line no-console
      console.warn('Logger not initialized yet, logging directly to console');
      // eslint-disable-next-line no-console
      console.log(`[${level.toUpperCase()}]`, message, context);
      return;
    }
    this.repository.log(level, message, context);
  }

  /**
   * Log a debug message.
   *
   * Debug messages are typically used for detailed diagnostic information
   * that is useful during development but not in production.
   *
   * @param {string} message - The debug message
   * @param {LogContext} [context] - Optional context information
   * @returns {void}
   *
   * @example
   * ```typescript
   * logger.debug('Processing request', { requestId: 'abc123', method: 'GET' });
   * ```
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an informational message.
   *
   * Info messages are used for general information about application flow,
   * such as user actions, system events, etc.
   *
   * @param {string} message - The info message
   * @param {LogContext} [context] - Optional context information
   * @returns {void}
   *
   * @example
   * ```typescript
   * logger.info('User logged in successfully', { userId: 123 });
   * ```
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message.
   *
   * Warnings indicate potentially harmful situations that don't prevent
   * the application from functioning but should be investigated.
   *
   * @param {string} message - The warning message
   * @param {LogContext} [context] - Optional context information
   * @returns {void}
   *
   * @example
   * ```typescript
   * logger.warn('Rate limit approaching', { current: 950, limit: 1000 });
   * ```
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message.
   *
   * Error messages indicate serious problems that need immediate attention.
   * This method accepts an optional Error object that will be included in the log.
   *
   * @param {string} message - The error message
   * @param {Error | any} [error] - Optional error object to include
   * @param {LogContext} [context] - Optional additional context
   * @returns {void}
   *
   * @example
   * ```typescript
   * try {
   *   riskyOperation();
   * } catch (error) {
   *   logger.error('Operation failed', error, { operationId: 'xyz' });
   * }
   * ```
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    this.log('error', message, { ...context, error });
  }
}

/**
 * Singleton logger instance exported for convenience.
 *
 * This is the main entry point for most users. Register adapters
 * and then use the convenience methods (info, error, etc.) to log.
 *
 * @example
 * ```typescript
 * import { logger } from '@thomassamoul/generic-logger';
 * logger.info('Hello world');
 * ```
 */
const logger = LoggerSingleton.getInstance();

export { logger };
