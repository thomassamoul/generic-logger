/**
 * Console Logger Adapter
 *
 * Simple console logger with no third-party dependencies.
 * This adapter logs directly to the native console object, making it
 * compatible with Browser, Node.js, React, and React Native environments.
 *
 * Features:
 * - No external dependencies
 * - Optional colorized output (ANSI codes)
 * - Automatic caller information detection
 * - Cross-platform compatibility
 *
 * @example
 * ```typescript
 * const adapter = new ConsoleLoggerAdapter();
 * await adapter.initialize({
 *   enabled: true,
 *   colorize: true
 * });
 * ```
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { ConsoleAdapterConfig, LogContext, LoggerAdapterConfig, LogLevel } from '../types';

/**
 * Extracts caller information from the stack trace.
 *
 * This helper function parses the JavaScript stack trace to automatically
 * detect the file name and function name where the log was called from.
 *
 * @returns {Object} Object containing file and function information
 * @returns {string} [returns.file] - The file name where the log was called
 * @returns {string} [returns.function] - The function name where the log was called
 *
 * @private
 */
function getCallerInfo(): { file?: string; function?: string } {
  try {
    const stack = new Error().stack;
    if (!stack) return {};

    const stackLines = stack.split('\n');
    // Skip first 3 lines (Error constructor, getCallerInfo, logger method)
    for (let i = 3; i < stackLines.length; i++) {
      const line = stackLines[i];
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        const [, funcName, filePath] = match;
        const fileName = filePath.split('/').pop() || '';
        return {
          file: fileName,
          function: funcName !== 'Object.<anonymous>' ? funcName : undefined,
        };
      }
    }
  } catch {
    // Fallback if stack trace parsing fails
  }
  return {};
}

/**
 * ANSI color codes for console output.
 *
 * These color codes work in Node.js and modern terminals that support ANSI.
 * Browser consoles may ignore these codes, but the adapter handles this gracefully.
 *
 * @constant {Object} COLORS
 * @property {string} debug - Green color code
 * @property {string} info - Cyan color code
 * @property {string} warn - Yellow color code
 * @property {string} error - Red color code
 * @property {string} reset - Reset color code
 */
const COLORS = {
  debug: '\x1b[32m', // green
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

/**
 * Console logger adapter implementation.
 *
 * This adapter logs messages directly to the native console object using
 * console.debug(), console.info(), console.warn(), and console.error().
 * It includes optional colorization for better readability in terminals.
 *
 * @class ConsoleLoggerAdapter
 * @extends {ILoggerAdapter<void>}
 */
export class ConsoleLoggerAdapter extends ILoggerAdapter<void> {
  private config: ConsoleAdapterConfig = { enabled: false };
  private enabled = false;

  /**
   * Initialize the console adapter with configuration.
   *
   * @param {LoggerAdapterConfig} config - Configuration object
   * @returns {Promise<void>} Resolves immediately (console requires no async setup)
   *
   * @example
   * ```typescript
   * await adapter.initialize({
   *   enabled: true,
   *   colorize: true // Enable colored output
   * });
   * ```
   */
  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.config = config as ConsoleAdapterConfig;
    this.enabled = this.config.enabled;
  }

  /**
   * Check if the adapter is enabled.
   *
   * @returns {boolean} True if the adapter is enabled and ready to log
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a message to the console.
   *
   * This method formats the message with context information and logs it
   * using the appropriate console method (debug, info, warn, error).
   * Colorization is applied if enabled in the configuration.
   *
   * @param {LogLevel} level - The log level ('debug' | 'info' | 'warn' | 'error')
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context with error, tags, and metadata
   * @returns {void}
   *
   * @example
   * ```typescript
   * adapter.log('info', 'User logged in', {
   *   tag: '[Auth]',
   *   data: { userId: 123 }
   * });
   * ```
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled) return;

    try {
      // Format message with context
      const formattedMessage = this.formatMessage(message, context);
      const timestamp = context?.timestamp || new Date();
      const timeStr = this.formatTimestamp(timestamp);

      // Build log entry
      const logEntry: any = {
        level: level.toUpperCase(),
        message: formattedMessage,
        timestamp: timeStr,
      };

      if (context?.data) {
        logEntry.data = context.data;
      }

      if (context?.metadata) {
        logEntry.metadata = context.metadata;
      }

      // Use native console methods with colorization if enabled
      const prefix = this.config.colorize
        ? `${COLORS[level]}[${level.toUpperCase()}]${COLORS.reset}`
        : `[${level.toUpperCase()}]`;

      // Log based on level using native console methods
      switch (level) {
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(`${prefix} ${timeStr} ${formattedMessage}`, logEntry.data || '');
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.info(`${prefix} ${timeStr} ${formattedMessage}`, logEntry.data || '');
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(`${prefix} ${timeStr} ${formattedMessage}`, logEntry.data || '');
          if (context?.error) {
            // eslint-disable-next-line no-console
            console.warn('Error:', context.error);
          }
          break;
        case 'error':
          if (context?.error instanceof Error) {
            // eslint-disable-next-line no-console
            console.error(`${prefix} ${timeStr} ${formattedMessage}`, {
              message: context.error.message,
              stack: context.error.stack,
              data: logEntry.data,
            });
          } else {
            // eslint-disable-next-line no-console
            console.error(`${prefix} ${timeStr} ${formattedMessage}`, context?.error || '', logEntry.data || '');
          }
          break;
      }
    } catch (error) {
      // Fail silently for console adapter
      // eslint-disable-next-line no-console
      console.warn('Console logger adapter error:', error);
    }
  }

  /**
   * Destroy the adapter and disable logging.
   *
   * @returns {Promise<void>} Resolves immediately
   */
  async destroy(): Promise<void> {
    this.enabled = false;
    this.instance = undefined;
  }

  /**
   * Format a log message with context information.
   *
   * Combines the message with tag, file, and function context into
   * a readable format. Automatically extracts caller information if
   * no explicit context is provided.
   *
   * @private
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {string} Formatted message string
   */
  private formatMessage(message: string, context?: LogContext): string {
    const parts: string[] = [];

    // Add custom tag if provided
    if (context?.tag) {
      parts.push(context.tag);
    }

    // Add automatic context if no custom tag
    if (!context?.tag) {
      const callerInfo = getCallerInfo();
      const contextParts: string[] = [];

      if (callerInfo.function) {
        contextParts.push(callerInfo.function);
      }
      if (callerInfo.file) {
        contextParts.push(callerInfo.file);
      }

      if (contextParts.length > 0) {
        parts.push(`[${contextParts.join(':')}]`);
      }
    }

    // Add explicit context if provided
    if (context?.file || context?.function) {
      const contextParts: string[] = [];
      if (context.function) contextParts.push(context.function);
      if (context.file) contextParts.push(context.file);
      if (contextParts.length > 0 && !context?.tag) {
        parts.push(`[${contextParts.join(':')}]`);
      }
    }

    // Add message
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Format a timestamp for display in log messages.
   *
   * @private
   * @param {Date} timestamp - The timestamp to format
   * @returns {string} ISO formatted timestamp string
   */
  private formatTimestamp(timestamp: Date): string {
    return timestamp.toISOString();
  }
}
