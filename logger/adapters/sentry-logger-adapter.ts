/**
 * Sentry Logger Adapter
 *
 * Sentry integration - users must provide their own pre-initialized Sentry instance
 * Compatible with @sentry/react-native, @sentry/browser, @sentry/node, etc.
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { LogContext, LoggerAdapterConfig, LogLevel, SentryAdapterConfig } from '../types';

export class SentryLoggerAdapter extends ILoggerAdapter<any> {
  private config: SentryAdapterConfig = { enabled: false, sentryInstance: null };
  private enabled = false;

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

  isEnabled(): boolean {
    return this.enabled;
  }

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
        console.warn('Failed to flush/close Sentry:', error);
      }
    }
    this.instance = undefined;
  }

  /**
   * Map log level to Sentry severity
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
   * Map log level to Sentry breadcrumb level
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
