import { DefaultSanitizer } from '../../logger/sanitizers/default-sanitizer';

describe('DefaultSanitizer', () => {
  let sanitizer: DefaultSanitizer;

  beforeEach(() => {
    sanitizer = new DefaultSanitizer();
  });

  describe('sanitize', () => {
    it('should redact password fields', () => {
      const data = { password: 'secret123', username: 'user' };
      const sanitized = sanitizer.sanitize(data);
      expect((sanitized as any).password).toBe('[REDACTED]');
      expect((sanitized as any).username).toBe('user');
    });

    it('should redact token fields', () => {
      const data = { accessToken: 'token123', apiKey: 'key123' };
      const sanitized = sanitizer.sanitize(data);
      expect((sanitized as any).accessToken).toBe('[REDACTED]');
      expect((sanitized as any).apiKey).toBe('[REDACTED]');
    });

    it('should mask email addresses', () => {
      const data = { email: 'test@example.com' };
      const sanitized = sanitizer.sanitize(data);
      expect((sanitized as any).email).toContain('***');
      expect((sanitized as any).email).toContain('@example.com');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          password: 'secret',
          email: 'test@example.com',
        },
      };
      const sanitized = sanitizer.sanitize(data);
      expect((sanitized as any).user.password).toBe('[REDACTED]');
      expect((sanitized as any).user.email).toContain('***');
    });

    it('should handle arrays', () => {
      const data = [
        { password: 'secret1', username: 'user1' },
        { password: 'secret2', username: 'user2' },
      ];
      const sanitized = sanitizer.sanitize(data) as any[];
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].password).toBe('[REDACTED]');
    });

    it('should handle null and undefined', () => {
      expect(sanitizer.sanitize(null)).toBeNull();
      expect(sanitizer.sanitize(undefined)).toBeUndefined();
    });

    it('should sanitize strings containing sensitive patterns', () => {
      const data = 'Contact me at test@example.com';
      const sanitized = sanitizer.sanitize(data) as string;
      expect(sanitized).toContain('***');
    });
  });
});

