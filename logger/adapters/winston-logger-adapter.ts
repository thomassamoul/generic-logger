/**
 * Winston Logger Adapter
 *
 * Winston integration - users must provide their own pre-initialized Winston logger instance
 * Compatible with Winston (Node.js) and Winston-compatible loggers
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { LogContext, LoggerAdapterConfig, LogLevel, WinstonAdapterConfig } from '../types';

export class WinstonLoggerAdapter extends ILoggerAdapter<any> {
  private config: WinstonAdapterConfig = { enabled: false, winstonInstance: null };
  private enabled = false;

  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.config = config as unknown as WinstonAdapterConfig;
    this.enabled = this.config.enabled && !!this.config.winstonInstance;

    if (this.enabled) {
      // Store the user-provided Winston logger instance
      this.instance = this.config.winstonInstance;

      // Verify that the Winston instance has expected methods
      if (!this.instance || typeof this.instance.log !== 'function') {
        console.warn('Winston instance provided does not appear to have a log method');
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
      console.warn('Winston logging error:', error);
    }
  }

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
        console.warn('Failed to close Winston logger:', error);
      }
    }
    this.instance = undefined;
  }

  /**
   * Map log level to Winston log level
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
