/**
 * Mock Logger Adapter
 *
 * In-memory adapter for testing purposes. Stores all logs in memory
 * and provides helper methods to query and inspect logged messages.
 *
 * This adapter is useful for unit tests where you want to verify
 * that specific log messages were generated without relying on
 * console output or external services.
 *
 * @example
 * ```typescript
 * import { MockLoggerAdapter } from '@thomassamoul/generic-logger';
 *
 * const adapter = new MockLoggerAdapter();
 * await adapter.initialize({ enabled: true });
 *
 * adapter.log('info', 'Test message', { tag: '[Test]' });
 *
 * const logs = adapter.getLogs();
 * expect(logs).toHaveLength(1);
 * expect(logs[0].message).toBe('Test message');
 * ```
 */

import { LogContext, LogLevel, LoggerAdapterConfig } from '../types';
import { ILoggerAdapter } from '../core/logger-adapter.interface';

/**
 * Log entry stored in mock adapter
 */
export interface MockLogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: Date;
}

/**
 * Mock adapter that stores logs in memory for testing
 *
 * @class MockLoggerAdapter
 * @extends {ILoggerAdapter<void>}
 */
export class MockLoggerAdapter extends ILoggerAdapter<void> {
  private enabled = false;
  private logs: MockLogEntry[] = [];

  /**
   * Initialize the mock adapter with configuration.
   *
   * @param {LoggerAdapterConfig} config - Configuration object
   * @returns {Promise<void>} Resolves immediately
   */
  async initialize(config: LoggerAdapterConfig): Promise<void> {
    this.enabled = config.enabled || false;
    if (this.enabled) {
      this.clearLogs();
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
   * Log a message to memory.
   *
   * @param {LogLevel} level - The log level
   * @param {string} message - The log message
   * @param {LogContext} [context] - Optional context information
   * @returns {void}
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled) return;

    this.logs.push({
      level,
      message,
      context,
      timestamp: new Date(),
    });
  }

  /**
   * Destroy the adapter and clear all logs.
   *
   * @returns {Promise<void>} Resolves immediately
   */
  async destroy(): Promise<void> {
    this.enabled = false;
    this.clearLogs();
  }

  /**
   * Get all logged entries.
   *
   * @returns {MockLogEntry[]} Array of all logged entries
   *
   * @example
   * ```typescript
   * const logs = adapter.getLogs();
   * expect(logs).toHaveLength(3);
   * ```
   */
  getLogs(): MockLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level.
   *
   * @param {LogLevel} level - The log level to filter by
   * @returns {MockLogEntry[]} Array of log entries matching the level
   *
   * @example
   * ```typescript
   * const errorLogs = adapter.getLogsByLevel('error');
   * expect(errorLogs).toHaveLength(1);
   * ```
   */
  getLogsByLevel(level: LogLevel): MockLogEntry[] {
    return this.logs.filter((entry) => entry.level === level);
  }

  /**
   * Get logs filtered by message pattern.
   *
   * @param {string | RegExp} pattern - String or regex pattern to match
   * @returns {MockLogEntry[]} Array of log entries matching the pattern
   *
   * @example
   * ```typescript
   * const authLogs = adapter.getLogsByMessage(/auth/i);
   * expect(authLogs.length).toBeGreaterThan(0);
   * ```
   */
  getLogsByMessage(pattern: string | RegExp): MockLogEntry[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return this.logs.filter((entry) => regex.test(entry.message));
  }

  /**
   * Get logs filtered by tag.
   *
   * @param {string} tag - The tag to filter by
   * @returns {MockLogEntry[]} Array of log entries with matching tag
   *
   * @example
   * ```typescript
   * const authLogs = adapter.getLogsByTag('[Auth]');
   * expect(authLogs.length).toBeGreaterThan(0);
   * ```
   */
  getLogsByTag(tag: string): MockLogEntry[] {
    return this.logs.filter((entry) => entry.context?.tag === tag);
  }

  /**
   * Check if a log entry exists with the given level and message.
   *
   * @param {LogLevel} level - The log level
   * @param {string | RegExp} message - The message or pattern to match
   * @returns {boolean} True if a matching log entry exists
   *
   * @example
   * ```typescript
   * expect(adapter.hasLog('error', 'Connection failed')).toBe(true);
   * expect(adapter.hasLog('info', /user/i)).toBe(true);
   * ```
   */
  hasLog(level: LogLevel, message: string | RegExp): boolean {
    const matchingLogs = this.getLogsByLevel(level);
    if (matchingLogs.length === 0) return false;

    const regex = typeof message === 'string' ? new RegExp(message, 'i') : message;
    return matchingLogs.some((entry) => regex.test(entry.message));
  }

  /**
   * Clear all logged entries.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * adapter.clearLogs();
   * expect(adapter.getLogs()).toHaveLength(0);
   * ```
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get the count of logged entries.
   *
   * @returns {number} Total number of logged entries
   *
   * @example
   * ```typescript
   * expect(adapter.getLogCount()).toBe(5);
   * ```
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Get the count of logged entries by level.
   *
   * @param {LogLevel} level - The log level
   * @returns {number} Number of entries for the given level
   *
   * @example
   * ```typescript
   * expect(adapter.getLogCountByLevel('error')).toBe(2);
   * ```
   */
  getLogCountByLevel(level: LogLevel): number {
    return this.getLogsByLevel(level).length;
  }
}

