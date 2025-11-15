/**
 * Formatter Interface
 *
 * Defines the contract for log formatters that transform log entries
 * into different output formats (plain text, JSON, etc.)
 */

import { LogContext, LogLevel } from '../types';

/**
 * Formatted output from a formatter
 */
export interface FormattedOutput {
  /**
   * Plain text representation of the log entry (optional)
   */
  text?: string;

  /**
   * JSON/object representation of the log entry (optional)
   */
  json?: Record<string, unknown>;
}

/**
 * Interface for log formatters
 *
 * Formatters transform log entries into specific output formats.
 * They receive sanitized context and produce formatted output that
 * adapters can consume.
 *
 * @interface IFormatter
 */
export interface IFormatter {
  /**
   * Format a log entry into the desired output format(s)
   *
   * @param {LogLevel} level - The log level
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional sanitized context
   * @returns {FormattedOutput} Formatted output with text and/or json
   *
   * @example
   * ```typescript
   * const output = formatter.format('info', 'User logged in', {
   *   tag: '[Auth]',
   *   data: { userId: 123 }
   * });
   * // output.text = "[INFO] User logged in { userId: 123 }"
   * // output.json = { level: 'info', message: 'User logged in', ... }
   * ```
   */
  format(level: LogLevel, message: string, context?: LogContext): FormattedOutput;
}

