/**
 * DataDog Logger Adapter
 *
 * DataDog integration adapter that requires users to provide their own
 * pre-initialized DataDog instance. This adapter is compatible with:
 * - @datadog/mobile-react-native
 * - @datadog/browser-rum
 * - datadog-logs-js
 * - Other DataDog SDKs with compatible APIs
 *
 * The adapter attempts to detect and use the appropriate DataDog API pattern
 * automatically, making it flexible across different SDK versions.
 *
 * @example
 * ```typescript
 * import { DatadogProvider } from '@datadog/mobile-react-native';
 * DatadogProvider.initialize(config);
 *
 * const adapter = new DataDogLoggerAdapter();
 * await adapter.initialize({
 *   enabled: true,
 *   datadogInstance: DatadogProvider
 * });
 * ```
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { DataDogAdapterConfig, LogContext, LoggerAdapterConfig, LogLevel } from '../types';

/**
 * Adapter for integrating with DataDog logging and monitoring.
 *
 * This adapter supports multiple DataDog SDK patterns and automatically
 * detects which API is available. It handles different SDK architectures
 * (mobile, browser, Node.js) through flexible API detection.
 *
 * @class DataDogLoggerAdapter
 * @extends {ILoggerAdapter<any>}
 */
export class DataDogLoggerAdapter extends ILoggerAdapter<any> {
  private config: DataDogAdapterConfig = { enabled: false, datadogInstance: null };
  private enabled = false;

  /**
   * Initialize the DataDog adapter with a pre-initialized DataDog instance.
   *
   * @param {LoggerAdapterConfig} config - Configuration containing the DataDog instance
   * @returns {Promise<void>} Resolves immediately (DataDog is already initialized by user)
   *
   * @example
   * ```typescript
   * await adapter.initialize({
   *   enabled: true,
   *   datadogInstance: DatadogProvider // Pre-initialized DataDog instance
   * });
   * ```
   */
  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.config = config as unknown as DataDogAdapterConfig;
    this.enabled = this.config.enabled && !!this.config.datadogInstance;

    if (this.enabled) {
      // Store the user-provided DataDog instance
      this.instance = this.config.datadogInstance;

      // Verify that the DataDog instance has expected methods
      // Different DataDog SDKs have different APIs, so we'll be flexible
      if (!this.instance) {
        // eslint-disable-next-line no-console
        console.warn('DataDog instance provided is null or undefined');
        this.enabled = false;
      }
    }
  }

  /**
   * Check if the adapter is enabled and has a valid DataDog instance.
   *
   * @returns {boolean} True if enabled and DataDog instance is available
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a message to DataDog.
   *
   * This method attempts to detect and use the appropriate DataDog API pattern:
   * - Mobile SDK: Uses datadog.logger.info/error/etc.
   * - Browser RUM: Uses datadog.addAction/addError
   * - Logs SDK: Uses datadog.info/error/etc.
   * - Fallback: Uses generic datadog.log() if available
   *
   * @param {LogLevel} level - The log level ('debug' | 'info' | 'warn' | 'error')
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context with error, tags, and metadata
   * @returns {void}
   *
   * @example
   * ```typescript
   * adapter.log('error', 'Payment processing failed', {
   *   error: new Error('Network timeout'),
   *   tag: '[Payment]',
   *   data: { transactionId: 'tx-123' }
   * });
   * ```
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled || !this.instance) return;

    try {
      const datadog = this.instance;

      // Different DataDog SDKs have different APIs, so we'll try common patterns

      // Pattern 1: Mobile React Native SDK - uses logger.info, logger.error, etc.
      if (datadog.logger) {
        const logger = datadog.logger;
        const attributes = {
          tag: context?.tag,
          file: context?.file,
          function: context?.function,
          ...context?.metadata,
        };

        switch (level) {
          case 'debug':
            if (typeof logger.debug === 'function') {
              logger.debug(message, attributes);
            }
            break;
          case 'info':
            if (typeof logger.info === 'function') {
              logger.info(message, attributes);
            }
            break;
          case 'warn':
            if (typeof logger.warn === 'function') {
              logger.warn(message, attributes);
            }
            break;
          case 'error':
            if (typeof logger.error === 'function') {
              if (context?.error instanceof Error) {
                logger.error(message, {
                  ...attributes,
                  error: context.error.message,
                  stack: context.error.stack,
                });
              } else {
                logger.error(message, attributes);
              }
            }
            break;
        }
        return;
      }

      // Pattern 2: Browser RUM SDK - uses addAction, addError, etc.
      if (datadog.addAction || datadog.addError) {
        const attributes = {
          tag: context?.tag,
          file: context?.file,
          function: context?.function,
          data: context?.data,
          ...context?.metadata,
        };

        if (level === 'error' && context?.error && typeof datadog.addError === 'function') {
          datadog.addError(context.error, attributes);
        } else if (typeof datadog.addAction === 'function') {
          datadog.addAction(message, attributes);
        }
        return;
      }

      // Pattern 3: Logs SDK - uses logger.info, logger.error, etc.
      if (typeof datadog.info === 'function' || typeof datadog.error === 'function') {
        const attributes = {
          tag: context?.tag,
          file: context?.file,
          function: context?.function,
          level,
          ...context?.data,
          ...context?.metadata,
        };

        if (level === 'error') {
          if (context?.error instanceof Error && typeof datadog.error === 'function') {
            datadog.error(message, { ...attributes, error: context.error });
          } else if (typeof datadog.error === 'function') {
            datadog.error(message, attributes);
          }
        } else if (level === 'warn' && typeof datadog.warn === 'function') {
          datadog.warn(message, attributes);
        } else if (typeof datadog.info === 'function') {
          datadog.info(message, attributes);
        }
        return;
      }

      // Fallback: if instance has a generic log method
      if (typeof datadog.log === 'function') {
        datadog.log(message, {
          level,
          tag: context?.tag,
          file: context?.file,
          function: context?.function,
          data: context?.data,
          error: context?.error,
          metadata: context?.metadata,
        });
        return;
      }

      // If we can't find a compatible API, warn but don't break
      // eslint-disable-next-line no-console
      console.warn(
        'DataDog instance does not match expected API patterns. Please ensure your DataDog instance has logger, addAction/addError, or info/error methods.',
      );
    } catch (error) {
      // Fail silently to avoid breaking the app
      // eslint-disable-next-line no-console
      console.warn('DataDog logging error:', error);
    }
  }

  /**
   * Destroy the adapter and perform cleanup on the DataDog instance.
   *
   * Attempts to stop or close the DataDog instance if such methods exist.
   *
   * @returns {Promise<void>} Resolves when cleanup is complete
   */
  async destroy(): Promise<void> {
    this.enabled = false;
    if (this.instance) {
      try {
        // Some DataDog SDKs may have cleanup methods
        if (typeof this.instance.stop === 'function') {
          await this.instance.stop();
        } else if (typeof this.instance.close === 'function') {
          await this.instance.close();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to stop/close DataDog:', error);
      }
    }
    this.instance = undefined;
  }
}
