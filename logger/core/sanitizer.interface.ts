/**
 * Sanitizer Interface
 *
 * Interface for data sanitization to prevent logging sensitive information.
 * Sanitizers can redact, mask, or remove sensitive data before it's logged.
 */

/**
 * Interface for data sanitization.
 *
 * Sanitizers are used to prevent sensitive information from being logged.
 * They can remove fields, mask values, or transform data as needed.
 *
 * @example
 * ```typescript
 * class MySanitizer implements ISanitizer {
 *   sanitize(data: unknown): unknown {
 *     // Remove or mask sensitive fields
 *     return sanitizedData;
 *   }
 * }
 * ```
 */
export interface ISanitizer {
  /**
   * Sanitize data by removing or masking sensitive information.
   *
   * This method should recursively process objects and arrays to ensure
   * all sensitive data is handled, not just top-level fields.
   *
   * @param {unknown} data - The data to sanitize (can be any type)
   * @returns {unknown} The sanitized data with sensitive information removed or masked
   *
   * @example
   * ```typescript
   * sanitize(data: unknown): unknown {
   *   if (typeof data === 'object' && data !== null) {
   *     const sanitized = { ...data };
   *     if ('password' in sanitized) {
   *       sanitized.password = '[REDACTED]';
   *     }
   *     return sanitized;
   *   }
   *   return data;
   * }
   * ```
   */
  sanitize(data: unknown): unknown;
}

/**
 * Abstract base class for sanitizers that can be extended.
 *
 * This provides a convenient way to create custom sanitizers without
 * implementing the interface from scratch.
 *
 * @example
 * ```typescript
 * class CustomSanitizer extends BaseSanitizer {
 *   sanitize(data: unknown): unknown {
 *     // Your sanitization logic
 *   }
 * }
 * ```
 */
export abstract class BaseSanitizer implements ISanitizer {
  /**
   * Sanitize data by removing or masking sensitive information.
   *
   * @param {unknown} data - The data to sanitize
   * @returns {unknown} The sanitized data
   */
  abstract sanitize(data: unknown): unknown;
}
