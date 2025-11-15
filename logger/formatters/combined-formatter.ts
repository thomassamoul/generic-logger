/**
 * Combined Formatter
 *
 * Formats log entries as both plain text and JSON. This formatter produces
 * both human-readable text and structured JSON output, allowing adapters
 * to choose which format they prefer or use both.
 *
 * @example
 * ```typescript
 * const formatter = new CombinedFormatter();
 * const output = formatter.format('info', 'User logged in', {
 *   tag: '[Auth]',
 *   data: { userId: 123 }
 * });
 * // output.text = "[INFO] ..."
 * // output.json = { level: 'info', ... }
 * ```
 */

import { LogContext, LogLevel } from '../types';
import { FormattedOutput, IFormatter } from './formatter.interface';
import { JsonFormatter } from './json-formatter';
import { PlainTextFormatter } from './plain-text-formatter';

/**
 * Combined formatter that produces both plain text and JSON output
 *
 * @class CombinedFormatter
 * @implements {IFormatter}
 */
export class CombinedFormatter implements IFormatter {
  private jsonFormatter: JsonFormatter;
  private textFormatter: PlainTextFormatter;

  /**
   * Create a new combined formatter
   */
  constructor() {
    this.jsonFormatter = new JsonFormatter();
    this.textFormatter = new PlainTextFormatter();
  }

  /**
   * Format a log entry as both plain text and JSON
   *
   * @param {LogLevel} level - The log level
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {FormattedOutput} Formatted output with both text and json properties
   */
  format(level: LogLevel, message: string, context?: LogContext): FormattedOutput {
    const jsonOutput = this.jsonFormatter.format(level, message, context);
    const textOutput = this.textFormatter.format(level, message, context);

    return {
      text: textOutput.text,
      json: jsonOutput.json,
    };
  }
}

