import { ConsoleLoggerAdapter } from '../../logger/adapters/console-logger-adapter';
import { LogLevel } from '../../logger/types';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

global.console = mockConsole as any;

describe('ConsoleLoggerAdapter', () => {
  let adapter: ConsoleLoggerAdapter;

  beforeEach(() => {
    adapter = new ConsoleLoggerAdapter();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with enabled config', async () => {
      await adapter.initialize({ enabled: true });
      expect(adapter.isEnabled()).toBe(true);
    });

    it('should initialize with disabled config', async () => {
      await adapter.initialize({ enabled: false });
      expect(adapter.isEnabled()).toBe(false);
    });
  });

  describe('log', () => {
    beforeEach(async () => {
      await adapter.initialize({ enabled: true });
    });

    it('should log debug messages', () => {
      adapter.log('debug', 'test message');
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('test message'),
        ''
      );
    });

    it('should log info messages', () => {
      adapter.log('info', 'test message');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('test message'),
        ''
      );
    });

    it('should log warn messages', () => {
      adapter.log('warn', 'test message');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('test message'),
        ''
      );
    });

    it('should log error messages', () => {
      adapter.log('error', 'test message');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('test message'),
        '',
        ''
      );
    });

    it('should include context data in logs', () => {
      adapter.log('info', 'test message', { data: { key: 'value' } });
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { key: 'value' }
      );
    });

    it('should handle error objects in context', () => {
      const error = new Error('test error');
      adapter.log('error', 'test message', { error });
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should not log when disabled', async () => {
      await adapter.initialize({ enabled: false });
      adapter.log('info', 'test message');
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should disable the adapter', async () => {
      await adapter.initialize({ enabled: true });
      await adapter.destroy();
      expect(adapter.isEnabled()).toBe(false);
    });
  });
});

