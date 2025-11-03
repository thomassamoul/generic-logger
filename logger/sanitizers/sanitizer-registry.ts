/**
 * Sanitizer Registry
 *
 * Global registry for managing sanitizers per feature/tag.
 * This allows different sanitization rules for different parts of the application.
 * When logging with a tag, the registry automatically uses the corresponding sanitizer.
 */

import { ISanitizer } from '../core/sanitizer.interface';

/**
 * Registry for managing tag-specific sanitizers.
 *
 * Sanitizers can be registered for specific tags (e.g., 'Auth', 'Payment'),
 * and will be automatically used when logging with those tags. This enables
 * different sanitization strategies for different application features.
 *
 * @class SanitizerRegistry
 */
class SanitizerRegistry {
  private sanitizers: Map<string, ISanitizer> = new Map();

  /**
   * Register a sanitizer for a specific tag or feature.
   *
   * Tags are case-insensitive. When a log entry includes this tag,
   * the registered sanitizer will be used automatically.
   *
   * @param {string} tag - The tag to associate with the sanitizer (e.g., 'Auth', 'Payment')
   * @param {ISanitizer} sanitizer - The sanitizer instance to register
   * @returns {void}
   *
   * @example
   * ```typescript
   * sanitizerRegistry.register('Auth', new CustomAuthSanitizer());
   * // Now all logs with tag '[Auth]' will use CustomAuthSanitizer
   * ```
   */
  register(tag: string, sanitizer: ISanitizer): void {
    this.sanitizers.set(tag.toLowerCase(), sanitizer);
  }

  /**
   * Unregister a sanitizer for a specific tag.
   *
   * Removes the sanitizer association for the given tag. After unregistration,
   * logs with this tag will use the default sanitizer or no sanitization.
   *
   * @param {string} tag - The tag to unregister
   * @returns {void}
   *
   * @example
   * ```typescript
   * sanitizerRegistry.unregister('Auth');
   * ```
   */
  unregister(tag: string): void {
    this.sanitizers.delete(tag.toLowerCase());
  }

  /**
   * Get the sanitizer registered for a specific tag.
   *
   * @param {string} [tag] - The tag to look up (case-insensitive)
   * @returns {ISanitizer | undefined} The registered sanitizer, or undefined if not found
   *
   * @example
   * ```typescript
   * const sanitizer = sanitizerRegistry.get('Auth');
   * if (sanitizer) {
   *   // Use the sanitizer
   * }
   * ```
   */
  get(tag?: string): ISanitizer | undefined {
    if (!tag) return undefined;
    return this.sanitizers.get(tag.toLowerCase());
  }

  /**
   * Clear all registered sanitizers from the registry.
   *
   * Useful for testing or resetting the registry state.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * sanitizerRegistry.clear(); // Remove all registered sanitizers
   * ```
   */
  clear(): void {
    this.sanitizers.clear();
  }

  /**
   * Check if a sanitizer is registered for a specific tag.
   *
   * @param {string} tag - The tag to check (case-insensitive)
   * @returns {boolean} True if a sanitizer is registered for this tag
   *
   * @example
   * ```typescript
   * if (sanitizerRegistry.has('Auth')) {
   *   // A sanitizer is registered for Auth
   * }
   * ```
   */
  has(tag: string): boolean {
    return this.sanitizers.has(tag.toLowerCase());
  }
}

/**
 * Global singleton instance of the sanitizer registry.
 *
 * This is the main registry used by the logger repository to look up
 * tag-specific sanitizers during log processing.
 *
 * @constant {SanitizerRegistry} sanitizerRegistry
 *
 * @example
 * ```typescript
 * import { sanitizerRegistry } from '@thomas/generic-logger';
 * sanitizerRegistry.register('Auth', new CustomSanitizer());
 * ```
 */
export const sanitizerRegistry = new SanitizerRegistry();
