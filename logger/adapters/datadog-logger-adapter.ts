/**
 * DataDog Logger Adapter
 *
 * DataDog integration - users must provide their own pre-initialized DataDog instance
 * Compatible with @datadog/mobile-react-native, @datadog/browser-rum, datadog-logs-js, etc.
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { DataDogAdapterConfig, LogContext, LoggerAdapterConfig, LogLevel } from '../types';

export class DataDogLoggerAdapter extends ILoggerAdapter<any> {
  private config: DataDogAdapterConfig = { enabled: false, datadogInstance: null };
  private enabled = false;

  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.config = config as unknown as DataDogAdapterConfig;
    this.enabled = this.config.enabled && !!this.config.datadogInstance;

    if (this.enabled) {
      // Store the user-provided DataDog instance
      this.instance = this.config.datadogInstance;

      // Verify that the DataDog instance has expected methods
      // Different DataDog SDKs have different APIs, so we'll be flexible
      if (!this.instance) {
        console.warn('DataDog instance provided is null or undefined');
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
      console.warn(
        'DataDog instance does not match expected API patterns. Please ensure your DataDog instance has logger, addAction/addError, or info/error methods.',
      );
    } catch (error) {
      // Fail silently to avoid breaking the app
      console.warn('DataDog logging error:', error);
    }
  }

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
        console.warn('Failed to stop/close DataDog:', error);
      }
    }
    this.instance = undefined;
  }
}
