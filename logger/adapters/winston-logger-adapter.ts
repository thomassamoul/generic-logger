/**
 * Winston Logger Adapter
 *
 * Winston integration adapter that requires users to provide their own
 * pre-initialized Winston logger instance. This adapter is compatible with:
 * - Winston (Node.js)
 * - Winston-compatible loggers
 * - Custom loggers that implement Winston's API
 *
 * @example
 * ```typescript
 * import winston from 'winston';
 * const winstonLogger = winston.createLogger({
 *   level: 'info',
 *   transports: [new winston.transports.Console()]
 * });
 *
 * const adapter = new WinstonLoggerAdapter();
 * await adapter.initialize({
 *   enabled: true,
 *   winstonInstance: winstonLogger
 * });
 * ```
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { LogContext, LoggerAdapterConfig, LogLevel, WinstonAdapterConfig } from '../types';

/**
 * Adapter for integrating with Winston logging library.
 *
 * This adapter converts logger levels to Winston's level system and
 * formats context data as Winston metadata. Winston loggers are typically
 * used in Node.js environments for structured logging.
 *
 * @class WinstonLoggerAdapter
 * @extends {ILoggerAdapter<any>}
 */
export class WinstonLoggerAdapter extends ILoggerAdapter<any> {
  private config: WinstonAdapterConfig = { enabled: false, winstonInstance: null };
  private enabled = false;

  /**
   * Initialize the Winston adapter with a pre-initialized Winston logger.
   *
   * @param {LoggerAdapterConfig} config - Configuration containing the Winston logger instance
   * @returns {Promise<void>} Resolves immediately (Winston logger is already created by user)
   *
   * @example
   * ```typescript
   * await adapter.initialize({
   *   enabled: true,
   *   winstonInstance: winstonLogger // Pre-configured Winston logger
   * });
   * ```
   */
  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.config = config as unknown as WinstonAdapterConfig;
    this.enabled = this.config.enabled && !!this.config.winstonInstance;

    if (this.enabled) {
      // Store the user-provided Winston logger instance
      this.instance = this.config.winstonInstance;

      // Verify that the Winston instance has expected methods
      if (!this.instance || typeof this.instance.log !== 'function') {
        // eslint-disable-next-line no-console
        console.warn('Winston instance provided does not appear to have a log method');
        this.enabled = false;
      }
    }
  }

  /**
   * Check if the adapter is enabled and has a valid Winston logger.
   *
   * @returns {boolean} True if enabled and Winston logger is available
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a message to Winston.
   *
   * This method converts logger levels to Winston levels and formats
   * context data as metadata. It uses Winston's log() method or
   * level-specific methods if available.
   *
   * @param {LogLevel} level - The log level ('debug' | 'info' | 'warn' | 'error')
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context with error, tags, and metadata
   * @returns {void}
   *
   * @example
   * ```typescript
   * adapter.log('error', 'Database connection failed', {
   *   error: new Error('Connection timeout'),
   *   tag: '[Database]',
   *   data: { host: 'db.example.com' }
   * });
   * ```
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled || !this.instance) return;

    try {
      const winston = this.instance;

      // Winston uses a different level mapping
      const winstonLevel = this.mapLevelToWinstonLevel(level);

      // Build metadata object
      const meta: any = {
        ...context?.metadata,
      };

      if (context?.tag) {
        meta.tag = context.tag;
      }
      if (context?.file) {
        meta.file = context.file;
      }
      if (context?.function) {
        meta.function = context.function;
      }
      if (context?.data) {
        meta.data = context.data;
      }
      if (context?.error) {
        if (context.error instanceof Error) {
          meta.error = {
            message: context.error.message,
            stack: context.error.stack,
            name: context.error.name,
          };
        } else {
          meta.error = context.error;
        }
      }

      // Use Winston's log method
      if (typeof winston.log === 'function') {
        winston.log(winstonLevel, message, meta);
      } else {
        // Fallback: try direct level methods (debug, info, warn, error)
        const levelMethod = winston[level];
        if (typeof levelMethod === 'function') {
          levelMethod.call(winston, message, meta);
        } else {
          console.warn('Winston instance does not have expected log methods');
        }
      }
    } catch (error) {
      // Fail silently to avoid breaking the app
      // eslint-disable-next-line no-console
      console.warn('Winston logging error:', error);
    }
  }

  /**
   * Destroy the adapter and close the Winston logger.
   *
   * Attempts to close the Winston logger using end() or close() methods.
   * Winston loggers may need to flush pending writes before closing.
   *
   * @returns {Promise<void>} Resolves when cleanup is complete
   */
  async destroy(): Promise<void> {
    this.enabled = false;
    if (this.instance) {
      try {
        // Winston loggers typically have an end() or close() method
        if (typeof this.instance.end === 'function') {
          await new Promise<void>((resolve) => {
            this.instance?.end(() => resolve());
          });
        } else if (typeof this.instance.close === 'function') {
          await this.instance.close();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to close Winston logger:', error);
      }
    }
    this.instance = undefined;
  }

  /**
   * Map logger log level to Winston log level.
   *
   * Winston uses: error, warn, info, verbose, debug, silly
   * This maps logger levels to Winston's equivalent levels.
   *
   * @private
   * @param {LogLevel} level - The logger log level
   * @returns {string} The corresponding Winston level
   */
  private mapLevelToWinstonLevel(level: LogLevel): string {
    // Winston typically uses: error, warn, info, verbose, debug, silly
    switch (level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warn';
      case 'info':
        return 'info';
      case 'debug':
        return 'debug';
      default:
        return 'info';
    }
  }
}
