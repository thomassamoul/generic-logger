/**
 * JSON Formatter
 *
 * Formats log entries as JSON objects. This formatter produces structured
 * JSON output suitable for log aggregation systems, file storage, and
 * structured logging.
 *
 * @example
 * ```typescript
 * const formatter = new JsonFormatter();
 * const output = formatter.format('info', 'User logged in', {
 *   tag: '[Auth]',
 *   data: { userId: 123 }
 * });
 * // output.json = { level: 'info', message: 'User logged in', ... }
 * ```
 */

import { LogContext, LogLevel } from '../types';
import { FormattedOutput, IFormatter } from './formatter.interface';

/**
 * JSON formatter that produces structured JSON output
 *
 * @class JsonFormatter
 * @implements {IFormatter}
 */
export class JsonFormatter implements IFormatter {
  /**
   * Format a log entry as JSON
   *
   * @param {LogLevel} level - The log level
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {FormattedOutput} Formatted output with json property
   */
  format(level: LogLevel, message: string, context?: LogContext): FormattedOutput {
    const timestamp = context?.timestamp || new Date();

    const jsonOutput: Record<string, unknown> = {
      timestamp: timestamp.toISOString(),
      level,
      message,
    };

    // Add context fields if present
    if (context?.tag) {
      jsonOutput.tag = context.tag;
    }

    if (context?.file) {
      jsonOutput.file = context.file;
    }

    if (context?.function) {
      jsonOutput.function = context.function;
    }

    if (context?.data) {
      jsonOutput.data = context.data;
    }

    if (context?.error) {
      if (context.error instanceof Error) {
        jsonOutput.error = {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack,
        };
      } else {
        jsonOutput.error = context.error;
      }
    }

    if (context?.metadata) {
      jsonOutput.metadata = context.metadata;
    }

    return { json: jsonOutput };
  }
}

