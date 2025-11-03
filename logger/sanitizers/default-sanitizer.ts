/**
 * Default Sanitizer
 *
 * Provides default sanitization rules to prevent logging sensitive information.
 * This sanitizer:
 * - Completely redacts sensitive fields (passwords, tokens, etc.)
 * - Masks partially sensitive fields (emails, phones)
 * - Handles nested objects and arrays recursively
 * - Detects sensitive patterns in strings
 *
 * @example
 * ```typescript
 * const sanitizer = new DefaultSanitizer();
 * const safe = sanitizer.sanitize({
 *   password: 'secret123',
 *   email: 'user@example.com'
 * });
 * // Result: { password: '[REDACTED]', email: 'use***@example.com' }
 * ```
 */

import { BaseSanitizer } from '../core/sanitizer.interface';

/**
 * List of field names that should be completely redacted.
 *
 * Fields matching any of these names (case-insensitive, partial match)
 * will be replaced with '[REDACTED]' in the log output.
 *
 * @constant {string[]} SENSITIVE_FIELDS
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'secretKey',
  'secret_key',
  'privateKey',
  'private_key',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'pin',
  'ssn',
  'socialSecurityNumber',
];

/**
 * List of field names that should be partially masked instead of redacted.
 *
 * These fields retain some information for debugging while protecting
 * sensitive details. For example, emails show the domain but mask the username.
 *
 * @constant {string[]} MASKABLE_FIELDS
 */
const MASKABLE_FIELDS = ['email', 'phone', 'phoneNumber', 'phone_number'];

/**
 * Regular expression patterns for detecting sensitive data in strings.
 *
 * These patterns are used to find and sanitize sensitive information
 * even when it's not in a structured field (e.g., in a message string).
 *
 * @constant {Object} SENSITIVE_PATTERNS
 * @property {RegExp} email - Matches email addresses
 * @property {RegExp} creditCard - Matches credit card numbers
 * @property {RegExp} phone - Matches phone numbers
 */
const SENSITIVE_PATTERNS = {
  email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  phone: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
};

/**
 * Default sanitizer implementation with comprehensive sensitive data detection.
 *
 * This sanitizer handles:
 * - Object fields (recursive)
 * - Arrays (recursive)
 * - Primitives and strings
 * - Pattern matching in strings
 *
 * @class DefaultSanitizer
 * @extends {BaseSanitizer}
 */
export class DefaultSanitizer extends BaseSanitizer {
  /**
   * Sanitize data recursively, removing or masking sensitive information.
   *
   * This method processes data structures recursively, applying sanitization
   * rules at every level. It handles objects, arrays, and primitives.
   *
   * @param {unknown} data - The data to sanitize (any type)
   * @returns {unknown} The sanitized data with sensitive information protected
   *
   * @example
   * ```typescript
   * const sanitizer = new DefaultSanitizer();
   * const safe = sanitizer.sanitize({
   *   user: {
   *     email: 'john@example.com',
   *     password: 'secret'
   *   }
   * });
   * // Result: { user: { email: 'joh***@example.com', password: '[REDACTED]' } }
   * ```
   */
  sanitize(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle primitives
    if (typeof data !== 'object') {
      return this.sanitizeString(String(data));
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    // Handle objects
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Check if field should be removed
      if (this.shouldRemoveField(lowerKey)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Check if field should be masked
      if (this.shouldMaskField(lowerKey)) {
        sanitized[key] = this.maskField(key, value);
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = this.sanitize(value);
    }

    return sanitized;
  }

  /**
   * Check if a field name indicates it should be completely redacted.
   *
   * @private
   * @param {string} key - The field name to check (case-insensitive)
   * @returns {boolean} True if the field should be redacted
   */
  private shouldRemoveField(key: string): boolean {
    return SENSITIVE_FIELDS.some((field) => key.includes(field.toLowerCase()));
  }

  /**
   * Check if a field name indicates it should be partially masked.
   *
   * @private
   * @param {string} key - The field name to check (case-insensitive)
   * @returns {boolean} True if the field should be masked
   */
  private shouldMaskField(key: string): boolean {
    return MASKABLE_FIELDS.some((field) => key.includes(field.toLowerCase()));
  }

  /**
   * Mask a field value, showing only safe portions.
   *
   * Special handling for:
   * - Email addresses: Shows first 3 chars of username + full domain
   * - Phone numbers: Shows last 4 digits only
   * - Other fields: Shows first 2 and last 2 characters
   *
   * @private
   * @param {string} key - The field name
   * @param {unknown} value - The value to mask
   * @returns {string} The masked value string
   */
  private maskField(key: string, value: unknown): string {
    const stringValue = String(value);

    // Mask email (keep first 3 chars and domain)
    if (key.toLowerCase().includes('email') && SENSITIVE_PATTERNS.email.test(stringValue)) {
      const match = stringValue.match(SENSITIVE_PATTERNS.email);
      if (match && match[0]) {
        const [username, domain] = match[0].split('@');
        const maskedUsername = username.slice(0, 3) + '***';
        return maskedUsername + '@' + domain;
      }
    }

    // Mask phone (keep last 4 digits)
    if (key.toLowerCase().includes('phone') && SENSITIVE_PATTERNS.phone.test(stringValue)) {
      return '***-***-' + stringValue.slice(-4);
    }

    // Generic masking for other fields
    if (stringValue.length > 4) {
      return stringValue.slice(0, 2) + '***' + stringValue.slice(-2);
    }

    return '***';
  }

  /**
   * Sanitize a string by replacing sensitive patterns.
   *
   * Scans the string for email addresses, credit card numbers, and phone numbers,
   * replacing them with masked versions or placeholders.
   *
   * @private
   * @param {string} str - The string to sanitize
   * @returns {string} The sanitized string with sensitive patterns replaced
   */
  private sanitizeString(str: string): string {
    let sanitized = str;

    // Replace credit card numbers
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, '[CARD_NUMBER]');

    // Replace emails
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, (match) => {
      const [username, domain] = match.split('@');
      return username.slice(0, 3) + '***@' + domain;
    });

    // Replace phone numbers
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone, '***-***-$&'.slice(-11));

    return sanitized;
  }
}
