/**
 * Sanitizer Registry
 *
 * Global registry for managing sanitizers per feature/tag
 */

import { ISanitizer } from '../core/sanitizer.interface';

/**
 * Global registry of sanitizers
 */
class SanitizerRegistry {
  private sanitizers: Map<string, ISanitizer> = new Map();

  /**
   * Register a sanitizer for a specific tag/feature
   */
  register(tag: string, sanitizer: ISanitizer): void {
    this.sanitizers.set(tag.toLowerCase(), sanitizer);
  }

  /**
   * Unregister a sanitizer for a specific tag/feature
   */
  unregister(tag: string): void {
    this.sanitizers.delete(tag.toLowerCase());
  }

  /**
   * Get a sanitizer for a specific tag/feature
   */
  get(tag?: string): ISanitizer | undefined {
    if (!tag) return undefined;
    return this.sanitizers.get(tag.toLowerCase());
  }

  /**
   * Clear all registered sanitizers
   */
  clear(): void {
    this.sanitizers.clear();
  }

  /**
   * Check if a sanitizer is registered for a tag
   */
  has(tag: string): boolean {
    return this.sanitizers.has(tag.toLowerCase());
  }
}

// Singleton instance
export const sanitizerRegistry = new SanitizerRegistry();
