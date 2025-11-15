/**
 * File Logger Adapter
 *
 * File system logger that allows users to provide custom file writer functions.
 * This adapter is platform-agnostic and works across:
 * - Browser: Requires custom writer (can trigger downloads)
 * - Node.js: Use fs-based writer
 * - React Native: Requires platform-specific writer
 *
 * If no fileWriter is provided, logs are buffered in memory and can be
 * retrieved using getBufferedLogs().
 *
 * @example
 * ```typescript
 * // Node.js example
 * import * as fs from 'fs/promises';
 * const adapter = new FileLoggerAdapter();
 * await adapter.initialize({
 *   enabled: true,
 *   fileWriter: async (message, level, context) => {
 *     await fs.appendFile('app.log', JSON.stringify({ message, level, context }) + '\n');
 *   }
 * });
 * ```
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { FormattedOutput } from '../formatters';
import { FileAdapterConfig, LogContext, LoggerAdapterConfig, LogLevel } from '../types';

/**
 * Adapter for file-based logging with custom writer functions.
 *
 * This adapter supports multiple output formats (JSON, plain text) and
 * allows users to provide their own file writing implementation, making
 * it compatible with any platform or file system.
 *
 * @class FileLoggerAdapter
 * @extends {ILoggerAdapter<void>}
 */
export class FileLoggerAdapter extends ILoggerAdapter<void> {
  private config: FileAdapterConfig = { enabled: false };
  private enabled = false;
  private logBuffer: string[] = [];

  /**
   * Initialize the file adapter with configuration.
   *
   * If no fileWriter is provided, logs will be buffered in memory.
   * Users should provide a fileWriter function for actual file writing.
   *
   * @param {LoggerAdapterConfig} config - Configuration object
   * @returns {Promise<void>} Resolves immediately
   *
   * @example
   * ```typescript
   * await adapter.initialize({
   *   enabled: true,
   *   formats: ['json', 'log'],
   *   fileWriter: async (message, level, context) => {
   *     // Your file writing logic
   *   }
   * });
   * ```
   */
  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.config = config as unknown as FileAdapterConfig;
    this.enabled = this.config.enabled;

    if (this.enabled && !this.config.fileWriter) {
      // If no custom fileWriter is provided, we can only log to buffer
      // In browser, we might be able to trigger downloads
      // In Node.js, users should provide a fileWriter that uses fs
      console.warn(
        'FileLoggerAdapter: No custom fileWriter provided. Logs will be buffered only. Provide a fileWriter function for actual file writing.',
      );
    }
  }

  /**
   * Check if the adapter is enabled.
   *
   * @returns {boolean} True if the adapter is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a message to file (or buffer if no fileWriter provided).
   *
   * Logs are formatted according to the configured formats (JSON, plain text, or both).
   * If a fileWriter is provided, it's called asynchronously (fire-and-forget).
   * If no fileWriter, logs are buffered in memory.
   *
   * @param {LogLevel} level - The log level
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {void}
   *
   * @example
   * ```typescript
   * adapter.log('info', 'User logged in', {
   *   timestamp: new Date(),
   *   data: { userId: 123 }
   * });
   * ```
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled) return;

    try {
      // Check if formatted output is available in context metadata
      // (provided by repository when formatters are configured)
      const formattedOutput = (context?.metadata as any)?._formattedOutput as
        | FormattedOutput
        | undefined;

      const formats = this.config.formats || ['json'];
      const logLines: string[] = [];

      // Use formatted output if available, otherwise format manually
      if (formattedOutput) {
        if (formats.includes('json') && formattedOutput.json) {
          logLines.push(JSON.stringify(formattedOutput.json));
        }
        if (formats.includes('log') && formattedOutput.text) {
          logLines.push(formattedOutput.text);
        }
      } else {
        // Fallback: format manually if no formatted output available
        const formattedMessage = this.formatMessage(message, context);
        const timestamp = context?.timestamp || new Date();

        // Build log entry
        const logEntry = {
          timestamp: timestamp.toISOString(),
          level,
          message: formattedMessage,
          data: context?.data,
          error: context?.error
            ? context.error instanceof Error
              ? {
                  message: context.error.message,
                  stack: context.error.stack,
                  name: context.error.name,
                }
              : context.error
            : undefined,
          metadata: context?.metadata,
        };

        if (formats.includes('json')) {
          logLines.push(JSON.stringify(logEntry));
        }

        if (formats.includes('log')) {
          const logLine = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`;
          logLines.push(logLine);
          if (logEntry.error) {
            logLines.push(`  Error: ${JSON.stringify(logEntry.error)}`);
          }
          if (logEntry.data) {
            logLines.push(`  Data: ${JSON.stringify(logEntry.data)}`);
          }
        }
      }

      const logText = logLines.join('\n') + '\n';
      const formattedMessage = formattedOutput?.text || this.formatMessage(message, context);

      // If custom fileWriter is provided, use it (fire and forget - async)
      // Pass the formatted message and full context
      // The fileWriter can implement rotation logic based on rotation config
      if (this.config.fileWriter) {
        // Fire and forget - don't await to keep log() synchronous
        this.config
          .fileWriter(formattedMessage, level, {
            ...context,
            // Include formatted output in context for fileWriter to use if needed
            metadata: {
              ...context?.metadata,
              _formattedText: logText,
              _rotationConfig: this.config.rotation,
            },
          })
          .catch((error) => {
            console.warn('FileWriter error:', error);
            // Fallback to buffer if fileWriter fails
            this.logBuffer.push(logText);
          });
      } else {
        // Otherwise, buffer the logs
        this.logBuffer.push(logText);
      }
    } catch (error) {
      // Fail silently to avoid breaking the app
      console.warn('File logger error:', error);
    }
  }

  /**
   * Destroy the adapter and clear the log buffer.
   *
   * @returns {Promise<void>} Resolves immediately
   */
  async destroy(): Promise<void> {
    this.enabled = false;
    // Clear buffer on destroy
    this.logBuffer = [];
  }

  /**
   * Get all buffered logs as a single string.
   *
   * Useful when no fileWriter was provided and you want to retrieve
   * the logs from memory. Returns an empty string if buffer is empty.
   *
   * @returns {string} All buffered log entries joined together
   *
   * @example
   * ```typescript
   * const logs = adapter.getBufferedLogs();
   * console.log(logs); // Output all buffered logs
   * ```
   */
  getBufferedLogs(): string {
    return this.logBuffer.join('');
  }

  /**
   * Clear all buffered logs from memory.
   *
   * This does not affect logs that were written via fileWriter.
   * Useful for managing memory usage when buffering logs.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * adapter.clearBuffer(); // Clear memory buffer
   * ```
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Format a log message with context information.
   *
   * Combines the message with tag, file, and function context
   * into a readable format.
   *
   * @private
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {string} Formatted message string
   */
  private formatMessage(message: string, context?: LogContext): string {
    const parts: string[] = [];

    if (context?.tag) {
      parts.push(context.tag);
    }

    if (context?.file || context?.function) {
      const contextParts: string[] = [];
      if (context.function) contextParts.push(context.function);
      if (context.file) contextParts.push(context.file);
      if (contextParts.length > 0) {
        parts.push(`[${contextParts.join(':')}]`);
      }
    }

    parts.push(message);
    return parts.join(' ');
  }
}
