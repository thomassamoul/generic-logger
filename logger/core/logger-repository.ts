/**
 * Logger Repository
 *
 * Main facade that orchestrates multiple adapters with sanitization.
 * This class manages a collection of logging adapters and routes log messages
 * to all registered adapters. It handles sanitization, error handling, and
 * adapter lifecycle management.
 *
 * The repository uses a singleton pattern and works entirely through the
 * ILoggerAdapter interface, with no coupling to specific adapter implementations.
 *
 * @example
 * ```typescript
 * const repo = LoggerRepository.getInstance({
 *   sanitization: { enabled: true }
 * });
 *
 * // Register adapters
 * await repo.registerAdapter('console', new ConsoleLoggerAdapter(), { enabled: true });
 *
 * // Log messages
 * repo.log('info', 'Application started', { tag: '[App]' });
 * ```
 */

import { DefaultSanitizer } from '../sanitizers/default-sanitizer';
import { sanitizerRegistry } from '../sanitizers/sanitizer-registry';
import { EnhancedLogOptions, LogContext, LoggerRepositoryConfig, LogLevel } from '../types';
import { ILoggerAdapter } from './logger-adapter.interface';
import { ISanitizer } from './sanitizer.interface';

/**
 * Main logger repository class that orchestrates multiple logging adapters.
 *
 * This class serves as a facade for logging operations, managing multiple
 * adapters simultaneously and applying sanitization to log data before
 * sending it to adapters.
 *
 * @class LoggerRepository
 */
export class LoggerRepository {
  private static instance: LoggerRepository | null = null;
  private adapters: Map<string, ILoggerAdapter> = new Map();
  private config: LoggerRepositoryConfig;
  private defaultSanitizer: ISanitizer;
  private enabled = false;

  private constructor(config?: LoggerRepositoryConfig) {
    this.config = config || {};
    this.defaultSanitizer = config?.sanitization?.defaultSanitizer || new DefaultSanitizer();
  }

  /**
   * Get or create the singleton repository instance.
   *
   * This method implements the singleton pattern to ensure only one
   * repository instance exists throughout the application lifecycle.
   * The first call with a config will initialize the repository,
   * subsequent calls will return the same instance.
   *
   * @param {LoggerRepositoryConfig} [config] - Optional configuration for the repository
   * @returns {LoggerRepository} The singleton repository instance
   *
   * @example
   * ```typescript
   * // First call - creates instance
   * const repo1 = LoggerRepository.getInstance({ sanitization: { enabled: true } });
   *
   * // Subsequent calls - returns same instance
   * const repo2 = LoggerRepository.getInstance();
   * // repo1 === repo2
   * ```
   */
  static getInstance(config?: LoggerRepositoryConfig): LoggerRepository {
    if (!LoggerRepository.instance) {
      LoggerRepository.instance = new LoggerRepository(config);
    }
    return LoggerRepository.instance;
  }

  /**
   * Reset the singleton instance.
   *
   * This method is primarily useful for testing scenarios where you need
   * to clean up the repository between tests. It destroys the current
   * instance and all registered adapters.
   *
   * @static
   * @returns {void}
   *
   * @example
   * ```typescript
   * afterEach(() => {
   *   LoggerRepository.resetInstance();
   * });
   * ```
   */
  static resetInstance(): void {
    if (LoggerRepository.instance) {
      LoggerRepository.instance.destroy().catch(() => {
        // Ignore cleanup errors
      });
      LoggerRepository.instance = null;
    }
  }

  /**
   * Register an adapter instance with the repository.
   *
   * This is the recommended way to add adapters. Users provide their own
   * adapter instances, allowing full control over initialization and
   * configuration. The adapter will receive all log messages once registered.
   *
   * @param {string} name - Unique name identifier for the adapter (e.g., 'console', 'sentry')
   * @param {ILoggerAdapter} adapter - The adapter instance to register
   * @param {any} [config] - Optional configuration to pass to the adapter's initialize() method
   * @returns {Promise<void>} Resolves when the adapter is registered (or fails silently)
   *
   * @example
   * ```typescript
   * const adapter = new ConsoleLoggerAdapter();
   * await repo.registerAdapter('console', adapter, { enabled: true, colorize: true });
   *
   * // Or with a custom adapter
   * await repo.registerAdapter('custom', new MyCustomAdapter(), { apiKey: 'xxx' });
   * ```
   */
  async registerAdapter(name: string, adapter: ILoggerAdapter, config?: any): Promise<void> {
    try {
      if (config) {
        await adapter.initialize(config);
      }
      if (adapter.isEnabled()) {
        this.adapters.set(name, adapter);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to register adapter ${name}:`, error);
    }
  }

  /**
   * Unregister an adapter from the repository.
   *
   * This method removes an adapter and calls its destroy() method to perform
   * cleanup. After unregistration, the adapter will no longer receive log messages.
   *
   * @param {string} name - The name of the adapter to unregister
   * @returns {Promise<void>} Resolves when the adapter is unregistered and destroyed
   *
   * @example
   * ```typescript
   * // Remove an adapter
   * await repo.unregisterAdapter('sentry');
   *
   * // Adapter is destroyed and removed from the repository
   * ```
   */
  async unregisterAdapter(name: string): Promise<void> {
    const adapter = this.adapters.get(name);
    if (adapter) {
      await adapter.destroy().catch(() => {
        // Ignore cleanup errors
      });
      this.adapters.delete(name);
    }
  }

  /**
   * Enable the repository to start processing log messages.
   *
   * When enabled, the repository will route log messages to all registered
   * adapters. When disabled, log messages are ignored.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * repo.enable(); // Start logging
   * repo.log('info', 'This will be logged');
   *
   * repo.disable(); // Stop logging
   * repo.log('info', 'This will be ignored');
   * ```
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the repository, stopping all log message processing.
   *
   * When disabled, the log() method will return immediately without
   * processing messages or sending them to adapters.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * repo.disable(); // Stops all logging
   * // All subsequent log() calls will be ignored
   * ```
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Log a message at the specified severity level.
   *
   * This is the main logging method. It applies sanitization (if enabled)
   * and routes the message to all registered adapters. Errors from adapters
   * are caught and logged to console, but do not interrupt execution.
   *
   * @param {LogLevel} level - The severity level ('debug' | 'info' | 'warn' | 'error')
   * @param {string} message - The log message text
   * @param {EnhancedLogOptions} [options] - Optional context and sanitization options
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Simple log
   * repo.log('info', 'User logged in');
   *
   * // With context
   * repo.log('error', 'Login failed', {
   *   tag: '[Auth]',
   *   error: new Error('Invalid credentials'),
   *   data: { userId: 123 }
   * });
   *
   * // With custom sanitization
   * repo.log('info', 'Sensitive data', {
   *   data: { password: 'secret' },
   *   sanitizer: new CustomSanitizer()
   * });
   * ```
   */
  log(level: LogLevel, message: string, options?: EnhancedLogOptions): void {
    if (!this.enabled) return;

    // Apply sanitization if enabled
    const sanitizedContext = this.sanitizeContext(options);

    // Send to all enabled adapters
    for (const adapter of this.adapters.values()) {
      try {
        adapter.log(level, message, sanitizedContext);
      } catch (error) {
        // Fail gracefully - log error but don't break the app
        // eslint-disable-next-line no-console
        console.warn('Adapter logging error:', error);
      }
    }
  }

  /**
   * Apply sanitization to the log context data.
   *
   * This private method handles the sanitization logic, applying sanitizers
   * in priority order: per-call sanitizer > tag-specific sanitizer > default sanitizer.
   *
   * @private
   * @param {EnhancedLogOptions} [options] - The log options to sanitize
   * @returns {LogContext | undefined} The sanitized context, or undefined if no options provided
   */
  private sanitizeContext(options?: EnhancedLogOptions): LogContext | undefined {
    if (!options || options.skipSanitization) {
      return options;
    }

    // Get sanitizer (per-call > tag-specific > default)
    const sanitizer = this.getSanitizer(options);

    if (!sanitizer) {
      return options;
    }

    // Sanitize data and metadata
    const sanitizedContext: LogContext = { ...options };

    if (options.data) {
      sanitizedContext.data = sanitizer.sanitize(options.data);
    }

    if (options.metadata) {
      sanitizedContext.metadata = sanitizer.sanitize(options.metadata) as Record<string, unknown>;
    }

    if (options.error && typeof options.error === 'object') {
      sanitizedContext.error = sanitizer.sanitize(options.error);
    }

    return sanitizedContext;
  }

  /**
   * Get the appropriate sanitizer for the given log options.
   *
   * Sanitizer selection priority:
   * 1. Per-call sanitizer (options.sanitizer)
   * 2. Tag-specific sanitizer (from sanitizerRegistry)
   * 3. Default sanitizer (if sanitization is enabled in config)
   *
   * @private
   * @param {EnhancedLogOptions} [options] - The log options to get sanitizer for
   * @returns {ISanitizer | undefined} The sanitizer to use, or undefined if no sanitization
   */
  private getSanitizer(options?: EnhancedLogOptions): ISanitizer | undefined {
    // Per-call sanitizer takes priority
    if (options?.sanitizer) {
      return options.sanitizer;
    }

    // Tag-specific sanitizer
    if (options?.tag) {
      const tagSanitizer = sanitizerRegistry.get(options.tag);
      if (tagSanitizer) {
        return tagSanitizer;
      }
    }

    // Return default sanitizer if sanitization is enabled
    return this.config.sanitization?.enabled ? this.defaultSanitizer : undefined;
  }

  /**
   * Register a sanitizer for a specific tag or feature.
   *
   * Tag-specific sanitizers are automatically applied to logs that include
   * the matching tag in their context. This allows different sanitization
   * rules for different features or modules.
   *
   * @param {string} tag - The tag to associate with the sanitizer (e.g., 'Auth', 'Payment')
   * @param {ISanitizer} sanitizer - The sanitizer instance to use for this tag
   * @returns {void}
   *
   * @example
   * ```typescript
   * const authSanitizer = new CustomSanitizer();
   * repo.registerSanitizer('Auth', authSanitizer);
   *
   * // All logs with tag '[Auth]' will use authSanitizer
   * repo.log('info', 'Login attempt', {
   *   tag: 'Auth',
   *   data: { password: 'secret' } // Will be sanitized by authSanitizer
   * });
   * ```
   */
  registerSanitizer(tag: string, sanitizer: ISanitizer): void {
    sanitizerRegistry.register(tag, sanitizer);
  }

  /**
   * Get a readonly copy of the current repository configuration.
   *
   * This method returns a snapshot of the configuration, preventing
   * external modification of the internal config object.
   *
   * @returns {Readonly<LoggerRepositoryConfig>} A readonly copy of the configuration
   *
   * @example
   * ```typescript
   * const config = repo.getConfig();
   * console.log(config.sanitization?.enabled);
   * // config.sanitization = {} // Error: cannot modify readonly object
   * ```
   */
  getConfig(): Readonly<LoggerRepositoryConfig> {
    return { ...this.config };
  }

  /**
   * Update the repository configuration at runtime.
   *
   * This method allows you to modify certain configuration options without
   * recreating the repository instance. Note that adapter configurations
   * should be managed through registerAdapter()/unregisterAdapter() instead.
   *
   * @param {Partial<LoggerRepositoryConfig>} config - Partial configuration to merge with existing config
   * @returns {Promise<void>} Resolves when configuration is updated
   *
   * @example
   * ```typescript
   * // Update sanitization settings
   * await repo.updateConfig({
   *   sanitization: {
   *     enabled: true,
   *     defaultSanitizer: new CustomSanitizer()
   *   }
   * });
   * ```
   */
  async updateConfig(config: Partial<LoggerRepositoryConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Update default sanitizer if provided
    if (config.sanitization?.defaultSanitizer) {
      this.defaultSanitizer = config.sanitization.defaultSanitizer;
    }

    // Note: Reinitializing adapters from config is discouraged
    // Users should use registerAdapter()/unregisterAdapter() instead
    if (config.adapters && Object.keys(config.adapters).length > 0) {
      console.warn(
        'updateConfig with adapters is deprecated. Use registerAdapter()/unregisterAdapter() instead.',
      );
    }
  }

  /**
   * Destroy the repository and clean up all registered adapters.
   *
   * This method disables the repository, calls destroy() on all adapters,
   * and clears the adapter registry. Use this when shutting down the
   * application or cleaning up resources.
   *
   * @returns {Promise<void>} Resolves when all adapters are destroyed
   *
   * @example
   * ```typescript
   * // Clean up on application shutdown
   * process.on('SIGTERM', async () => {
   *   await repo.destroy();
   *   process.exit(0);
   * });
   * ```
   */
  async destroy(): Promise<void> {
    this.enabled = false;

    const destroyPromises = Array.from(this.adapters.values()).map((adapter) =>
      adapter.destroy().catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Adapter destroy error:', error);
      }),
    );

    await Promise.all(destroyPromises);
    this.adapters.clear();
  }
}
