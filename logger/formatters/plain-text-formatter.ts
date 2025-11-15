/**
 * Plain Text Formatter
 *
 * Formats log entries as human-readable plain text. This formatter produces
 * readable text output suitable for console output, development, and
 * simple log files.
 *
 * @example
 * ```typescript
 * const formatter = new PlainTextFormatter();
 * const output = formatter.format('info', 'User logged in', {
 *   tag: '[Auth]',
 *   data: { userId: 123 }
 * });
 * // output.text = "[INFO] 2024-11-03T12:34:56.789Z [Auth] User logged in ..."
 * ```
 */

import { LogContext, LogLevel } from '../types';
import { FormattedOutput, IFormatter } from './formatter.interface';

/**
 * Plain text formatter that produces human-readable text output
 *
 * @class PlainTextFormatter
 * @implements {IFormatter}
 */
export class PlainTextFormatter implements IFormatter {
  /**
   * Format a log entry as plain text
   *
   * @param {LogLevel} level - The log level
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {FormattedOutput} Formatted output with text property
   */
  format(level: LogLevel, message: string, context?: LogContext): FormattedOutput {
    const timestamp = context?.timestamp || new Date();
    const parts: string[] = [];

    // Add log level
    parts.push(`[${level.toUpperCase()}]`);

    // Add timestamp
    parts.push(timestamp.toISOString());

    // Add context parts
    const contextParts: string[] = [];

    if (context?.tag) {
      contextParts.push(context.tag);
    }

    if (context?.file || context?.function) {
      const locationParts: string[] = [];
      if (context.function) locationParts.push(context.function);
      if (context.file) locationParts.push(context.file);
      if (locationParts.length > 0) {
        contextParts.push(`[${locationParts.join(':')}]`);
      }
    }

    if (contextParts.length > 0) {
      parts.push(contextParts.join(' '));
    }

    // Add message
    parts.push(message);

    let textOutput = parts.join(' ');

    // Add data if present
    if (context?.data) {
      try {
        textOutput += ` ${JSON.stringify(context.data)}`;
      } catch (error) {
        textOutput += ` [data: ${String(context.data)}]`;
      }
    }

    // Add error if present
    if (context?.error) {
      if (context.error instanceof Error) {
        textOutput += `\nError: ${context.error.name}: ${context.error.message}`;
        if (context.error.stack) {
          textOutput += `\n${context.error.stack}`;
        }
      } else {
        try {
          textOutput += `\nError: ${JSON.stringify(context.error)}`;
        } catch (error) {
          textOutput += `\nError: ${String(context.error)}`;
        }
      }
    }

    // Add metadata if present
    if (context?.metadata) {
      try {
        textOutput += `\nMetadata: ${JSON.stringify(context.metadata)}`;
      } catch (error) {
        textOutput += `\nMetadata: ${String(context.metadata)}`;
      }
    }

    return { text: textOutput };
  }
}

