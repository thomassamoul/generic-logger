/**
 * Logger Types
 *
 * TypeScript interfaces for logger configuration and options
 */

import { ISanitizer } from './core/sanitizer.interface';
import { IFormatter } from './formatters/formatter.interface';

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
 * File rotation configuration (informational - implement in your fileWriter)
 */
export interface FileRotationConfig {
  /**
   * Enable file rotation
   * @default false
   */
  enabled?: boolean;

  /**
   * Rotation strategy
   * - 'size': Rotate when file reaches maxSize
   * - 'time': Rotate based on time pattern
   * - 'size-and-time': Rotate based on both size and time
   * @default 'size'
   */
  strategy?: 'size' | 'time' | 'size-and-time';

  /**
   * Maximum file size in bytes before rotation
   * Used when strategy is 'size' or 'size-and-time'
   * @default 10MB
   */
  maxSize?: number;

  /**
   * Maximum number of rotated files to keep
   * Older files beyond this count will be deleted
   * @default 10
   */
  maxFiles?: number;

  /**
   * Time pattern for rotation (when strategy includes 'time')
   * Examples: 'YYYY-MM-DD', 'YYYY-MM-DD-HH'
   * @default 'YYYY-MM-DD'
   */
  pattern?: string;

  /**
   * Retention period in days
   * Files older than this will be deleted
   * @default undefined (no automatic deletion based on age)
   */
  retentionDays?: number;
}

/**
 * File adapter configuration
 */
export interface FileAdapterConfig extends LoggerAdapterConfig {
  /**
   * Optional custom file writer function
   * If not provided, adapter will use a simple implementation when possible
   * 
   * For rotation support, implement rotation logic inside this function
   * based on the rotation config provided below.
   */
  fileWriter?: (message: string, level: LogLevel, context?: LogContext) => Promise<void>;
  
  /**
   * Output formats for log entries
   * - 'json': JSON format
   * - 'log': Plain text format
   * @default ['json']
   */
  formats?: ('json' | 'log')[];
  
  /**
   * File rotation configuration (informational)
   * Implement rotation logic in your fileWriter function based on these settings
   */
  rotation?: FileRotationConfig;
  
  /**
   * Maximum file size in bytes before rotation
   * (Deprecated - use rotation.maxSize instead)
   * @deprecated
   */
  maxSize?: number;
  
  /**
   * Maximum number of log files to keep
   * (Deprecated - use rotation.maxFiles instead)
   * @deprecated
   */
  maxFiles?: number;
  
  /**
   * Directory for log files
   * (Informational - use in your fileWriter implementation)
   */
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
   * Formatter configuration
   */
  formatters?: {
    /**
     * Default formatter to use for all adapters
     * If not provided, adapters receive raw context without formatting
     * @default undefined (no formatting)
     */
    default?: IFormatter;
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
