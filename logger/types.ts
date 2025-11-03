/**
 * Logger Types
 *
 * TypeScript interfaces for logger configuration and options
 */

import { ISanitizer } from './core/sanitizer.interface';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LoggerEnvironment = 'dev' | 'stage' | 'prod';

/**
 * Legacy logger configuration (for backward compatibility)
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output
   * - 'debug': All logs
   * - 'info': Info, warn, error
   * - 'warn': Warning and error only
   * - 'error': Error only
   */
  severity: LogLevel;

  /**
   * Enable or disable logging globally
   */
  enabled: boolean;

  /**
   * Enable colored output in console (only for development)
   */
  colorize?: boolean;

  /**
   * Enable async logging for better performance
   */
  async?: boolean;
}

/**
 * Context information for log entries
 */
export interface LoggerContext {
  /**
   * File name where the log originated
   */
  file?: string;

  /**
   * Function or component name
   */
  function?: string;

  /**
   * Custom tag (e.g., [Verify Screen])
   */
  tag?: string;
}

/**
 * Logging options extending context with additional data
 */
export interface LogOptions extends LoggerContext {
  /**
   * Additional data object to log
   */
  data?: any;
}

/**
 * Extended context with error and additional metadata
 */
export interface LogContext extends LogOptions {
  /**
   * Optional error object
   */
  error?: Error | any;

  /**
   * Optional timestamp override
   */
  timestamp?: Date;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Console adapter configuration
 */
export interface ConsoleAdapterConfig {
  enabled: boolean;
  colorize?: boolean;
}

/**
 * File adapter configuration
 */
export interface FileAdapterConfig extends LoggerAdapterConfig {
  /**
   * Optional custom file writer function
   * If not provided, adapter will use a simple implementation when possible
   */
  fileWriter?: (message: string, level: LogLevel, context?: LogContext) => Promise<void>;
  formats?: ('json' | 'log')[];
  maxSize?: number;
  maxFiles?: number;
  directory?: string;
}

/**
 * Sentry adapter configuration
 * Users must provide their own Sentry instance
 */
export interface SentryAdapterConfig {
  enabled: boolean;
  /**
   * Pre-initialized Sentry instance from @sentry/react-native, @sentry/browser, or @sentry/node
   */
  sentryInstance: any;
}

/**
 * DataDog adapter configuration
 * Users must provide their own DataDog instance
 */
export interface DataDogAdapterConfig {
  enabled: boolean;
  /**
   * Pre-initialized DataDog instance from @datadog/mobile-react-native, @datadog/browser-rum, or datadog-logs-js
   */
  datadogInstance: any;
}

/**
 * Winston adapter configuration
 * Users must provide their own Winston logger instance
 */
export interface WinstonAdapterConfig {
  enabled: boolean;
  /**
   * Pre-initialized Winston logger instance
   */
  winstonInstance: any;
}


/**
 * Base adapter configuration
 */
export interface LoggerAdapterConfig {
  enabled: boolean;
  severity?: LogLevel;
  [key: string]: unknown;
}

/**
 * Complete adapter configurations (legacy structure for convenience)
 * Users can use this or provide adapters directly via registerAdapter
 */
export interface AdapterConfigs {
  console?: ConsoleAdapterConfig;
  file?: FileAdapterConfig;
  sentry?: SentryAdapterConfig;
  datadog?: DataDogAdapterConfig;
  winston?: WinstonAdapterConfig;
  [key: string]: LoggerAdapterConfig | ConsoleAdapterConfig | FileAdapterConfig | SentryAdapterConfig | DataDogAdapterConfig | WinstonAdapterConfig | undefined;
}

/**
 * Logger repository configuration
 */
export interface LoggerRepositoryConfig {
  environment?: LoggerEnvironment;
  /**
   * Adapter configurations - users can provide adapter instances via registerAdapter instead
   * This is optional and mainly for convenience
   */
  adapters?: AdapterConfigs;
  /**
   * Sanitization configuration
   */
  sanitization?: {
    enabled?: boolean;
    defaultSanitizer?: ISanitizer;
  };
  /**
   * Minimum log level severity
   */
  severity?: LogLevel;
}

/**
 * Sanitizer options for per-call sanitization
 */
export interface SanitizerOptions {
  /**
   * Optional sanitizer to use for this specific log call
   * If not provided, will use the feature/tag's registered sanitizer or default
   */
  sanitizer?: ISanitizer;

  /**
   * Skip sanitization for this call
   */
  skipSanitization?: boolean;
}

/**
 * Enhanced log options with sanitization
 */
export interface EnhancedLogOptions extends LogContext, SanitizerOptions {}
