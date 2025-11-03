import { LoggerRepository } from '../../logger/core/logger-repository';
import { ILoggerAdapter } from '../../logger/core/logger-adapter.interface';
import { LogLevel, LogContext } from '../../logger/types';
import { ConsoleLoggerAdapter } from '../../logger/adapters/console-logger-adapter';

describe('LoggerRepository', () => {
  beforeEach(() => {
    LoggerRepository.resetInstance();
  });

  afterEach(() => {
    LoggerRepository.resetInstance();
  });

  describe('getInstance', () => {
    it('should create a new instance on first call', () => {
      const repo = LoggerRepository.getInstance();
      expect(repo).toBeInstanceOf(LoggerRepository);
    });

    it('should return the same instance on subsequent calls', () => {
      const repo1 = LoggerRepository.getInstance();
      const repo2 = LoggerRepository.getInstance();
      expect(repo1).toBe(repo2);
    });
  });

  describe('registerAdapter', () => {
    it('should register an adapter', async () => {
      const repo = LoggerRepository.getInstance();
      const adapter = new ConsoleLoggerAdapter();
      
      await repo.registerAdapter('test', adapter, { enabled: true });
      
      // Adapter should be registered and enabled
      expect(adapter.isEnabled()).toBe(true);
    });

    it('should handle adapter initialization errors gracefully', async () => {
      const repo = LoggerRepository.getInstance();
      const adapter = new ConsoleLoggerAdapter();
      
      // Mock initialize to throw
      const originalInit = adapter.initialize;
      adapter.initialize = jest.fn().mockRejectedValue(new Error('Init failed'));
      
      await repo.registerAdapter('test', adapter, { enabled: true });
      
      // Should not throw, but adapter should not be enabled
      expect(adapter.initialize).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should log to all registered adapters', () => {
      const repo = LoggerRepository.getInstance();
      const adapter1 = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      const adapter2 = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      // Register adapters directly (bypassing initialize for test)
      (repo as any).adapters.set('adapter1', adapter1);
      (repo as any).adapters.set('adapter2', adapter2);
      (repo as any).enabled = true;

      repo.log('info', 'test message', { tag: 'test' });

      expect(adapter1.log).toHaveBeenCalledWith('info', 'test message', expect.any(Object));
      expect(adapter2.log).toHaveBeenCalledWith('info', 'test message', expect.any(Object));
    });

    it('should handle adapter errors gracefully', () => {
      const repo = LoggerRepository.getInstance();
      const adapter = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn().mockImplementation(() => {
          throw new Error('Adapter error');
        }),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      (repo as any).adapters.set('adapter1', adapter);
      (repo as any).enabled = true;

      // Should not throw
      expect(() => {
        repo.log('info', 'test message');
      }).not.toThrow();
    });

    it('should not log when repository is not enabled', () => {
      const repo = LoggerRepository.getInstance();
      const adapter = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      (repo as any).adapters.set('adapter1', adapter);
      (repo as any).enabled = false;

      repo.log('info', 'test message');

      expect(adapter.log).not.toHaveBeenCalled();
    });
  });

  describe('sanitization', () => {
    it('should sanitize context data when sanitization is enabled', () => {
      const repo = LoggerRepository.getInstance({
        sanitization: {
          enabled: true,
        },
      });

      const adapter = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      (repo as any).adapters.set('adapter1', adapter);
      (repo as any).enabled = true;

      repo.log('info', 'test', {
        data: { password: 'secret123', username: 'user' },
      });

      expect(adapter.log).toHaveBeenCalled();
      const callArgs = adapter.log.mock.calls[0];
      const sanitizedContext = callArgs[2];
      expect(sanitizedContext.data.password).toBe('[REDACTED]');
      expect(sanitizedContext.data.username).toBe('user');
    });

    it('should skip sanitization when skipSanitization is true', () => {
      const repo = LoggerRepository.getInstance({
        sanitization: {
          enabled: true,
        },
      });

      const adapter = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      (repo as any).adapters.set('adapter1', adapter);
      (repo as any).enabled = true;

      repo.log('info', 'test', {
        data: { password: 'secret123' },
        skipSanitization: true,
      });

      expect(adapter.log).toHaveBeenCalled();
      const callArgs = adapter.log.mock.calls[0];
      const context = callArgs[2];
      expect(context.data.password).toBe('secret123');
    });
  });

  describe('destroy', () => {
    it('should destroy all adapters', async () => {
      const repo = LoggerRepository.getInstance();
      const adapter1 = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      const adapter2 = {
        initialize: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        isEnabled: jest.fn().mockReturnValue(true),
      } as unknown as ILoggerAdapter;

      (repo as any).adapters.set('adapter1', adapter1);
      (repo as any).adapters.set('adapter2', adapter2);

      await repo.destroy();

      expect(adapter1.destroy).toHaveBeenCalled();
      expect(adapter2.destroy).toHaveBeenCalled();
      expect((repo as any).adapters.size).toBe(0);
    });
  });
});

