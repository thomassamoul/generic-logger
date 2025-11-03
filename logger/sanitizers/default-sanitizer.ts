/**
 * Default Sanitizer
 *
 * Default sanitization rules to prevent logging sensitive information
 */

import { BaseSanitizer } from '../core/sanitizer.interface';

/**
 * Fields to completely remove from logs
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
 * Fields to mask (show only partial info)
 */
const MASKABLE_FIELDS = ['email', 'phone', 'phoneNumber', 'phone_number'];

/**
 * Regex patterns for sensitive data
 */
const SENSITIVE_PATTERNS = {
  email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  phone: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
};

export class DefaultSanitizer extends BaseSanitizer {
  /**
   * Sanitize data recursively
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
   * Check if a field should be completely removed
   */
  private shouldRemoveField(key: string): boolean {
    return SENSITIVE_FIELDS.some((field) => key.includes(field));
  }

  /**
   * Check if a field should be masked
   */
  private shouldMaskField(key: string): boolean {
    return MASKABLE_FIELDS.some((field) => key.includes(field));
  }

  /**
   * Mask a field value
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
   * Sanitize a string for sensitive patterns
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
