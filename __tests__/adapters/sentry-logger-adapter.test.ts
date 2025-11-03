import { SentryLoggerAdapter } from '../../logger/adapters/sentry-logger-adapter';

describe('SentryLoggerAdapter', () => {
  let adapter: SentryLoggerAdapter;
  let mockSentry: any;

  beforeEach(() => {
    adapter = new SentryLoggerAdapter();
    mockSentry = {
      addBreadcrumb: jest.fn(),
      captureMessage: jest.fn(),
      captureException: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('initialize', () => {
    it('should initialize with valid Sentry instance', async () => {
      await adapter.initialize({
        enabled: true,
        sentryInstance: mockSentry,
      });
      expect(adapter.isEnabled()).toBe(true);
    });

    it('should not initialize when Sentry instance is missing', async () => {
      await adapter.initialize({
        enabled: true,
        sentryInstance: null,
      });
      expect(adapter.isEnabled()).toBe(false);
    });

    it('should not initialize when disabled', async () => {
      await adapter.initialize({
        enabled: false,
        sentryInstance: mockSentry,
      });
      expect(adapter.isEnabled()).toBe(false);
    });
  });

  describe('log', () => {
    beforeEach(async () => {
      await adapter.initialize({
        enabled: true,
        sentryInstance: mockSentry,
      });
    });

    it('should add breadcrumb for all levels', () => {
      adapter.log('info', 'test message', { tag: 'test' });
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'test message',
        level: 'info',
        category: 'test',
        data: undefined,
      });
    });

    it('should capture error for error level', () => {
      const error = new Error('test error');
      adapter.log('error', 'test message', { error });
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.any(Object),
          extra: expect.any(Object),
        })
      );
    });

    it('should capture message for warn level', () => {
      adapter.log('warn', 'test message');
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          level: 'warning',
        })
      );
    });

    it('should not log when disabled', async () => {
      await adapter.initialize({ enabled: false, sentryInstance: mockSentry });
      adapter.log('info', 'test message');
      expect(mockSentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should flush Sentry instance', async () => {
      await adapter.initialize({
        enabled: true,
        sentryInstance: mockSentry,
      });
      await adapter.destroy();
      expect(mockSentry.flush).toHaveBeenCalled();
    });
  });
});

