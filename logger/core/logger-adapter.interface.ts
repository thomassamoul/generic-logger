/**
 * Logger Adapter Interface
 *
 * Abstract interface that all logging adapters must implement.
 * This interface allows the logger to work with any logging library
 * without knowing its specific implementation details.
 *
 * @template T - The type of the underlying logging library instance (optional)
 *
 * @example
 * ```typescript
 * class MyCustomAdapter extends ILoggerAdapter<MyLoggerInstance> {
 *   async initialize(config: LoggerAdapterConfig): Promise<void> {
 *     // Initialize your logger here
 *   }
 *   // ... implement other methods
 * }
 * ```
 */

import { LogContext, LoggerAdapterConfig, LogLevel } from '../types';

/**
 * Abstract base class for all logger adapters.
 * Adapters are responsible for connecting to specific logging libraries.
 *
 * @template T - Optional type parameter for the underlying logging library instance
 */
export abstract class ILoggerAdapter<T = unknown> {
  /**
   * Protected property to store the underlying logging library instance.
   * Subclasses should set this during initialization.
   */
  protected instance?: T;

  /**
   * Initialize the adapter with the provided configuration.
   *
   * This method is called when the adapter is registered with the logger.
   * Implementations should validate configuration and set up the logging library.
   *
   * @param {LoggerAdapterConfig} config - Configuration object for the adapter
   * @returns {Promise<void>} Resolves when initialization is complete
   * @throws {Error} If initialization fails, the adapter will be disabled
   *
   * @example
   * ```typescript
   * async initialize(config: LoggerAdapterConfig): Promise<void> {
   *   if (!config.enabled) return;
   *   this.instance = await initializeMyLogger(config);
   * }
   * ```
   */
  abstract initialize(config: LoggerAdapterConfig): Promise<void>;

  /**
   * Log a message at the specified level.
   *
   * This method is called by the logger repository for each log entry.
   * Implementations should format and send the message to the underlying logging library.
   *
   * @param {LogLevel} level - The severity level of the log message ('debug' | 'info' | 'warn' | 'error')
   * @param {string} message - The log message text
   * @param {LogContext} [context] - Optional context object containing additional information
   *
   * @example
   * ```typescript
   * log(level: LogLevel, message: string, context?: LogContext): void {
   *   if (!this.isEnabled()) return;
   *   this.instance.log(level, message, context);
   * }
   * ```
   */
  abstract log(level: LogLevel, message: string, context?: LogContext): void;

  /**
   * Clean up resources and perform any necessary teardown.
   *
   * This method is called when the adapter is unregistered or the logger is destroyed.
   * Implementations should close connections, flush buffers, etc.
   *
   * @returns {Promise<void>} Resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * async destroy(): Promise<void> {
   *   if (this.instance?.close) {
   *     await this.instance.close();
   *   }
   *   this.instance = undefined;
   * }
   * ```
   */
  abstract destroy(): Promise<void>;

  /**
   * Check if the adapter is currently enabled and ready to log.
   *
   * @returns {boolean} True if the adapter is enabled and initialized, false otherwise
   *
   * @example
   * ```typescript
   * isEnabled(): boolean {
   *   return this.enabled && !!this.instance;
   * }
   * ```
   */
  abstract isEnabled(): boolean;
}
