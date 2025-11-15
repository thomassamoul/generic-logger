# Testing with Jest

Generic Logger provides testing utilities to help you test code that uses logging. This guide shows you how to set up and use the testing features, inspired by React Native Reanimated's testing approach.

## Setup

### 1. Install Jest

Make sure you have Jest installed:

```bash
npm install --save-dev jest @types/jest
```

### 2. Configure Jest

Create or update your `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest-setup.js'],
};
```

### 3. Create Setup File

Create `jest-setup.js` in your project root:

```javascript
// Reset logger repository between tests
const { LoggerRepository } = require('@thomassamoul/generic-logger');

beforeEach(() => {
  LoggerRepository.resetInstance();
});
```

## Using MockLoggerAdapter

The `MockLoggerAdapter` is an in-memory adapter that stores all logs for inspection during tests.

### Basic Usage

```typescript
import { MockLoggerAdapter, logger } from '@thomassamoul/generic-logger';

describe('MyFeature', () => {
  let mockAdapter: MockLoggerAdapter;

  beforeEach(async () => {
    mockAdapter = new MockLoggerAdapter();
    await mockAdapter.initialize({ enabled: true });
    await logger.registerAdapter('mock', mockAdapter, { enabled: true });
  });

  afterEach(() => {
    mockAdapter.clearLogs();
  });

  it('should log messages', () => {
    logger.info('Test message');
    
    const logs = mockAdapter.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].level).toBe('info');
  });
});
```

## API Reference

### MockLoggerAdapter Methods

#### `getLogs(): MockLogEntry[]`

Get all logged entries:

```typescript
const logs = mockAdapter.getLogs();
expect(logs).toHaveLength(3);
```

#### `getLogsByLevel(level: LogLevel): MockLogEntry[]`

Filter logs by level:

```typescript
const errorLogs = mockAdapter.getLogsByLevel('error');
expect(errorLogs).toHaveLength(1);
```

#### `getLogsByMessage(pattern: string | RegExp): MockLogEntry[]`

Filter logs by message pattern:

```typescript
const authLogs = mockAdapter.getLogsByMessage(/auth/i);
expect(authLogs.length).toBeGreaterThan(0);
```

#### `getLogsByTag(tag: string): MockLogEntry[]`

Filter logs by tag:

```typescript
const authLogs = mockAdapter.getLogsByTag('[Auth]');
expect(authLogs.length).toBeGreaterThan(0);
```

#### `hasLog(level: LogLevel, message: string | RegExp): boolean`

Check if a log entry exists:

```typescript
expect(mockAdapter.hasLog('error', 'Connection failed')).toBe(true);
expect(mockAdapter.hasLog('info', /user/i)).toBe(true);
```

#### `clearLogs(): void`

Clear all logged entries:

```typescript
mockAdapter.clearLogs();
expect(mockAdapter.getLogs()).toHaveLength(0);
```

#### `getLogCount(): number`

Get total number of logged entries:

```typescript
expect(mockAdapter.getLogCount()).toBe(5);
```

#### `getLogCountByLevel(level: LogLevel): number`

Get count of logs by level:

```typescript
expect(mockAdapter.getLogCountByLevel('error')).toBe(2);
```

## Fake Timers

You can use Jest's fake timers to control time-dependent logging:

```typescript
jest.useFakeTimers();

it('should log with timestamps', () => {
  logger.info('Message');
  
  const logs = mockAdapter.getLogs();
  const logTime = logs[0].timestamp;
  
  // Advance time
  jest.advanceTimersByTime(1000);
  
  logger.info('Another message');
  const newLogs = mockAdapter.getLogs();
  expect(newLogs[1].timestamp.getTime()).toBeGreaterThan(logTime.getTime());
});

afterEach(() => {
  jest.useRealTimers();
});
```

## Examples

### Example 1: Testing Error Logging

```typescript
describe('ErrorHandler', () => {
  let mockAdapter: MockLoggerAdapter;

  beforeEach(async () => {
    mockAdapter = new MockLoggerAdapter();
    await mockAdapter.initialize({ enabled: true });
    await logger.registerAdapter('mock', mockAdapter, { enabled: true });
  });

  it('should log errors with context', () => {
    const error = new Error('Something went wrong');
    logger.error('Operation failed', error, {
      tag: '[Operation]',
      data: { operationId: '123' },
    });

    const errorLogs = mockAdapter.getLogsByLevel('error');
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0].context?.error).toBe(error);
    expect(errorLogs[0].context?.tag).toBe('[Operation]');
    expect(errorLogs[0].context?.data).toEqual({ operationId: '123' });
  });
});
```

### Example 2: Testing Sanitization

```typescript
describe('Sanitization', () => {
  let mockAdapter: MockLoggerAdapter;

  beforeEach(async () => {
    const repo = LoggerRepository.getInstance({
      sanitization: { enabled: true },
    });
    mockAdapter = new MockLoggerAdapter();
    await mockAdapter.initialize({ enabled: true });
    await repo.registerAdapter('mock', mockAdapter, { enabled: true });
  });

  it('should sanitize sensitive data', () => {
    repo.log('info', 'User data', {
      data: {
        password: 'secret123',
        email: 'user@example.com',
      },
    });

    const logs = mockAdapter.getLogs();
    const context = logs[0].context;
    
    // Password should be redacted
    expect(context?.data?.password).toBe('[REDACTED]');
    
    // Email should be masked
    expect(context?.data?.email).toMatch(/^\w{3}\*\*\*@/);
  });
});
```

### Example 3: Testing Formatters

```typescript
describe('Formatters', () => {
  let mockAdapter: MockLoggerAdapter;

  beforeEach(async () => {
    const repo = LoggerRepository.getInstance({
      formatters: { default: new JsonFormatter() },
    });
    mockAdapter = new MockLoggerAdapter();
    await mockAdapter.initialize({ enabled: true });
    await repo.registerAdapter('mock', mockAdapter, { enabled: true });
  });

  it('should format logs as JSON', () => {
    repo.log('info', 'Test message', { tag: '[Test]' });

    const logs = mockAdapter.getLogs();
    const formattedOutput = logs[0].context?.metadata?._formattedOutput;
    
    expect(formattedOutput?.json).toBeDefined();
    expect(formattedOutput?.json?.level).toBe('info');
    expect(formattedOutput?.json?.message).toBe('Test message');
  });
});
```

### Example 4: Testing Multiple Log Levels

```typescript
describe('LogLevels', () => {
  let mockAdapter: MockLoggerAdapter;

  beforeEach(async () => {
    mockAdapter = new MockLoggerAdapter();
    await mockAdapter.initialize({ enabled: true });
    await logger.registerAdapter('mock', mockAdapter, { enabled: true });
  });

  it('should log at different levels', () => {
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    expect(mockAdapter.getLogCount()).toBe(4);
    expect(mockAdapter.getLogCountByLevel('debug')).toBe(1);
    expect(mockAdapter.getLogCountByLevel('info')).toBe(1);
    expect(mockAdapter.getLogCountByLevel('warn')).toBe(1);
    expect(mockAdapter.getLogCountByLevel('error')).toBe(1);
  });
});
```

## Custom Matchers

You can create custom Jest matchers for cleaner test assertions:

```typescript
// jest.setup.js or a separate matchers file
expect.extend({
  toHaveLogged(received, level, message) {
    const logs = received.getLogsByLevel(level);
    const hasMessage = logs.some(log => 
      typeof message === 'string' 
        ? log.message === message
        : message.test(log.message)
    );

    return {
      message: () =>
        `expected adapter to have logged ${level} message matching ${message}`,
      pass: hasMessage,
    };
  },
});

// Usage
expect(mockAdapter).toHaveLogged('error', 'Connection failed');
expect(mockAdapter).toHaveLogged('info', /user/i);
```

## Tips

1. **Reset between tests**: Always call `LoggerRepository.resetInstance()` in `beforeEach` to ensure clean state.

2. **Clear logs**: Use `mockAdapter.clearLogs()` in `afterEach` to avoid test pollution.

3. **Use fake timers**: For time-sensitive logging, use Jest's fake timers to control time.

4. **Test context**: Check both message and context to ensure full log information is captured.

5. **Test sanitization**: Verify that sensitive data is properly sanitized in test logs.

## Remarks

- Tests must run with Node 16 or newer
- The MockLoggerAdapter is designed for unit tests only
- For integration tests, consider using real adapters with appropriate configurations
- Formatted output is available in `context.metadata._formattedOutput` for testing formatters

## Recommended Testing Libraries

- [Jest](https://jestjs.io/) - JavaScript testing framework
- [@testing-library/react-native](https://callstack.github.io/react-native-testing-library/) - For React Native components
- [@testing-library/react-hooks](https://react-hooks-testing-library.com/) - For testing custom hooks

