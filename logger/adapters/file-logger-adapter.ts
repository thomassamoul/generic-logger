/**
 * File Logger Adapter
 *
 * File system logger - users can provide custom file writer functions
 * Works across Browser (download), Node.js (fs), and React Native (requires custom writer)
 */

import { ILoggerAdapter } from '../core/logger-adapter.interface';
import { FileAdapterConfig, LogContext, LoggerAdapterConfig, LogLevel } from '../types';

export class FileLoggerAdapter extends ILoggerAdapter<void> {
  private config: FileAdapterConfig = { enabled: false };
  private enabled = false;
  private logBuffer: string[] = [];

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

  isEnabled(): boolean {
    return this.enabled;
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled) return;

    try {
      // Format message with context
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

      // Format log entry as string
      const formats = this.config.formats || ['json'];
      const logLines: string[] = [];

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

      const logText = logLines.join('\n') + '\n';

      // If custom fileWriter is provided, use it (fire and forget - async)
      if (this.config.fileWriter) {
        // Fire and forget - don't await to keep log() synchronous
        this.config
          .fileWriter(formattedMessage, level, context)
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

  async destroy(): Promise<void> {
    this.enabled = false;
    // Clear buffer on destroy
    this.logBuffer = [];
  }

  /**
   * Get buffered logs (useful if no fileWriter was provided)
   */
  getBufferedLogs(): string {
    return this.logBuffer.join('');
  }

  /**
   * Clear buffered logs
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Format log message with context
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
