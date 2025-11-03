/**
 * Logger Configuration Helpers
 *
 * Optional helper functions for creating logger configurations
 * Users are encouraged to provide their own configuration
 */

import {
  AdapterConfigs,
  DataDogAdapterConfig,
  LoggerEnvironment,
  LoggerRepositoryConfig,
  SentryAdapterConfig,
  WinstonAdapterConfig,
} from '../types';

/**
 * Get the current environment
 * Override this in your project config if you have a custom environment detection
 */
function getEnvironment(): LoggerEnvironment {
  // Default: use __DEV__ or environment variable
  // @ts-ignore - __DEV__ may be defined in React Native
  if (typeof __DEV__ !== 'undefined' && __DEV__) return 'dev';
  // @ts-ignore - process may not be available in all environments
  const env = (typeof process !== 'undefined' && (process.env?.EXPO_PUBLIC_ENV || process.env?.NODE_ENV)) || 'dev';
  return env === 'stage' || env === 'prod' ? env : 'dev';
}

/**
 * Get logger configuration based on environment (example helper).
 *
 * NOTE: This is just an example helper function. Users should create their
 * own configuration and use registerAdapter() to add adapters with their
 * own pre-initialized instances. This function is provided for reference only.
 *
 * The function automatically detects the environment and returns a basic
 * configuration. Adapters that require third-party instances (Sentry, DataDog, Winston)
 * will be disabled by default since users must provide their own instances.
 *
 * @returns {LoggerRepositoryConfig} A basic logger configuration based on environment
 *
 * @example
 * ```typescript
 * // Example usage (not recommended for production)
 * const config = getLoggerConfig();
 * const repo = LoggerRepository.getInstance(config);
 * // Note: You still need to register adapters with your own instances
 * ```
 */
export function getLoggerConfig(): LoggerRepositoryConfig {
  const env = getEnvironment();

  const config: LoggerRepositoryConfig = {
    environment: env,
    adapters: getAdapterConfigs(env),
    sanitization: {
      enabled: true,
    },
    severity: env === 'prod' ? 'error' : 'debug',
  };

  return config;
}

/**
 * Get adapter configurations based on environment
 */
function getAdapterConfigs(env: LoggerEnvironment): AdapterConfigs {
  const adapters: AdapterConfigs = {
    console: {
      enabled: env !== 'prod',
      colorize: env === 'dev',
    },
    file: getFileAdapterConfig(env),
    sentry: getSentryAdapterConfig(env),
    datadog: getDataDogAdapterConfig(env),
    winston: getWinstonAdapterConfig(env),
  };

  return adapters;
}

/**
 * File adapter configuration
 */
function getFileAdapterConfig(env: LoggerEnvironment) {
  return {
    enabled: env === 'dev' || env === 'stage',
    formats:
      env === 'dev' ? (['json', 'log'] as ('json' | 'log')[]) : (['log'] as ('json' | 'log')[]),
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
  };
}

/**
 * Sentry adapter configuration (EXAMPLE ONLY)
 * NOTE: This is disabled - users must provide sentryInstance and enable via registerAdapter()
 * This is just showing structure - actual usage requires pre-initialized Sentry
 */
function getSentryAdapterConfig(env: LoggerEnvironment): SentryAdapterConfig {
  return {
    enabled: false, // Disabled - requires sentryInstance
    sentryInstance: null as any, // Users must provide their own initialized Sentry instance
  };
}

/**
 * DataDog adapter configuration (EXAMPLE ONLY)
 * NOTE: This is disabled - users must provide datadogInstance and enable via registerAdapter()
 * This is just showing structure - actual usage requires pre-initialized DataDog
 */
function getDataDogAdapterConfig(env: LoggerEnvironment): DataDogAdapterConfig {
  return {
    enabled: false, // Disabled - requires datadogInstance
    datadogInstance: null as any, // Users must provide their own initialized DataDog instance
  };
}

/**
 * Winston adapter configuration (EXAMPLE ONLY)
 * NOTE: This is disabled - users must provide winstonInstance and enable via registerAdapter()
 * This is just showing structure - actual usage requires pre-initialized Winston
 */
function getWinstonAdapterConfig(env: LoggerEnvironment): WinstonAdapterConfig {
  return {
    enabled: false, // Disabled - requires winstonInstance
    winstonInstance: null as any, // Users must provide their own initialized Winston logger
  };
}
