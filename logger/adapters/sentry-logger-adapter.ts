/**
 * Sentry Logger Adapter
 *
 * Sentry integration adapter that requires users to provide their own
 * pre-initialized Sentry instance. This adapter is compatible with:
 * - @sentry/react-native
 * - @sentry/browser
 * - @sentry/node
 * - Any Sentry SDK that implements the standard API
 *
 * @example
 * ```typescript
 * import * as Sentry from '@sentry/react-native';
 * Sentry.init({ dsn: 'your-dsn' });
 *
 * const adapter = new SentryLoggerAdapter();
 * await adapter.initialize({
 *   enabled: true,
 *   sentryInstance: Sentry
 * });
 * ```
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { LogContext, LoggerAdapterConfig, LogLevel, SentryAdapterConfig } from '../types';

/**
 * Adapter for integrating with Sentry error tracking.
 *
 * This adapter sends log messages to Sentry, converting logger levels
 * to Sentry severity levels and capturing exceptions when provided.
 * All log levels create breadcrumbs, while warnings and errors are
 * also captured as Sentry events.
 *
 * @class SentryLoggerAdapter
 * @extends {ILoggerAdapter<any>}
 */
export class SentryLoggerAdapter extends ILoggerAdapter<any> {
  private config: SentryAdapterConfig = { enabled: false, sentryInstance: null };
  private enabled = false;

  /**
   * Initialize the Sentry adapter with a pre-initialized Sentry instance.
   *
   * @param {LoggerAdapterConfig} config - Configuration containing the Sentry instance
   * @returns {Promise<void>} Resolves immediately (Sentry is already initialized by user)
   *
   * @example
   * ```typescript
   * await adapter.initialize({
   *   enabled: true,
   *   sentryInstance: Sentry // Pre-initialized Sentry instance
   * });
   * ```
   */
  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.config = config as unknown as SentryAdapterConfig;
    this.enabled = this.config.enabled && !!this.config.sentryInstance;

    if (this.enabled) {
      // Store the user-provided Sentry instance
      this.instance = this.config.sentryInstance;

      // Verify that the Sentry instance has the expected methods
      if (
        !this.instance ||
        (typeof this.instance.addBreadcrumb !== 'function' &&
          typeof this.instance.captureMessage !== 'function' &&
          typeof this.instance.captureException !== 'function')
      ) {
        console.warn(
          'Sentry instance provided does not appear to have expected methods (addBreadcrumb, captureMessage, captureException)',
        );
        this.enabled = false;
      }
    }
  }

  /**
   * Check if the adapter is enabled and has a valid Sentry instance.
   *
   * @returns {boolean} True if enabled and Sentry instance is available
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a message to Sentry.
   *
   * This method adds breadcrumbs for all log levels and captures
   * exceptions/events for warning and error levels. Errors with
   * Error objects are captured as exceptions, others as messages.
   *
   * @param {LogLevel} level - The log level ('debug' | 'info' | 'warn' | 'error')
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context with error, tags, and metadata
   * @returns {void}
   *
   * @example
   * ```typescript
   * adapter.log('error', 'Payment failed', {
   *   error: new Error('Insufficient funds'),
   *   tag: '[Payment]',
   *   data: { userId: 123 }
   * });
   * ```
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled || !this.instance) return;

    try {
      const sentry = this.instance;

      // Add breadcrumb for all levels (if method exists)
      if (typeof sentry.addBreadcrumb === 'function') {
        sentry.addBreadcrumb({
          message,
          level: this.mapLevelToSentryBreadcrumbLevel(level),
          category: context?.tag || 'app',
          data: context?.data ? { ...context.data, ...context.metadata } : context?.metadata,
        });
      }

      // Capture exceptions/errors for warn and error levels
      if (level === 'warn' || level === 'error') {
        if (context?.error) {
          // Capture exception (if method exists)
          if (typeof sentry.captureException === 'function') {
            sentry.captureException(context.error, {
              tags: {
                tag: context?.tag,
                file: context?.file,
                function: context?.function,
              },
              extra: {
                message,
                data: context?.data,
                metadata: context?.metadata,
              },
            });
          }
        } else {
          // Capture message (if method exists)
          if (typeof sentry.captureMessage === 'function') {
            sentry.captureMessage(message, {
              level: this.mapLevelToSentrySeverity(level),
              tags: {
                tag: context?.tag,
                file: context?.file,
                function: context?.function,
              },
              extra: {
                data: context?.data,
                metadata: context?.metadata,
              },
            });
          }
        }
      }
    } catch (error) {
      // Fail silently to avoid breaking the app
      console.warn('Sentry logging error:', error);
    }
  }

  /**
   * Destroy the adapter and flush any pending Sentry events.
   *
   * This method attempts to flush pending events to Sentry before
   * disabling the adapter. Different Sentry SDKs may have different
   * cleanup methods (flush, close, etc.).
   *
   * @returns {Promise<void>} Resolves when cleanup is complete
   */
  async destroy(): Promise<void> {
    this.enabled = false;
    if (this.instance) {
      try {
        // Flush if method exists (some Sentry implementations may not have this)
        if (typeof this.instance.flush === 'function') {
          await this.instance.flush();
        } else if (typeof this.instance.close === 'function') {
          await this.instance.close();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to flush/close Sentry:', error);
      }
    }
    this.instance = undefined;
  }

  /**
   * Map logger log level to Sentry severity level.
   *
   * Converts the generic logger levels to Sentry's severity system:
   * - debug/info → 'info'
   * - warn → 'warning'
   * - error → 'error'
   *
   * @private
   * @param {LogLevel} level - The logger log level
   * @returns {'info' | 'warning' | 'error' | 'fatal'} The corresponding Sentry severity
   */
  private mapLevelToSentrySeverity(level: LogLevel): 'info' | 'warning' | 'error' | 'fatal' {
    switch (level) {
      case 'debug':
      case 'info':
        return 'info';
      case 'warn':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Map logger log level to Sentry breadcrumb level.
   *
   * Breadcrumbs use a more granular level system than events.
   * This maps each logger level to its corresponding breadcrumb level.
   *
   * @private
   * @param {LogLevel} level - The logger log level
   * @returns {'debug' | 'info' | 'warning' | 'error' | 'fatal'} The Sentry breadcrumb level
   */
  private mapLevelToSentryBreadcrumbLevel(
    level: LogLevel,
  ): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
    switch (level) {
      case 'debug':
        return 'debug';
      case 'info':
        return 'info';
      case 'warn':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }
}
