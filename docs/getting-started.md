# Getting Started

This guide will help you get started with **generic-logger**, a generic, customizable logging library that works across Browser, Node.js, React, and React Native.

## What is Generic Logger?

**Generic Logger** is a logging library that:
- Works across **all platforms** (Browser, Node.js, React, React Native)
- Has **zero dependencies** on third-party logging libraries
- Uses an **adapter pattern** - you provide your own logging library instances
- Includes **built-in sanitization** to protect sensitive data
- Supports **pluggable formatters** for structured JSON and plain text output
- Provides **cross-platform file logging** via custom file writer functions

## Prerequisites

- Node.js 16+ (for Node.js usage)
- TypeScript 4.0+ (recommended, but JavaScript is also supported)

## Installation

Install the package using npm or yarn:

```bash
npm install @thomassamoul/generic-logger
```

or

```bash
yarn add @thomassamoul/generic-logger
```

## Initialization

The logger uses a singleton pattern. Import the logger instance and register adapters:

```typescript
import { logger, ConsoleLoggerAdapter } from '@thomassamoul/generic-logger';

// Register an adapter
await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
  enabled: true,
  colorize: true,
});
```

## Your First Log

After registering an adapter, you can start logging:

```typescript
logger.info('Application started');
logger.debug('Debug information', { data: { userId: 123 } });
logger.warn('Warning message');
logger.error('Error occurred', new Error('Something went wrong'));
```

## Formatters

Formatters transform log entries into different output formats. The library includes three built-in formatters:

### JSON Formatter

Formats logs as structured JSON objects:

```typescript
import { LoggerRepository, JsonFormatter } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  formatters: {
    default: new JsonFormatter(),
  },
});

repo.log('info', 'User logged in', {
  tag: '[Auth]',
  data: { userId: 123 },
});
// Output: { "level": "info", "message": "User logged in", "tag": "[Auth]", ... }
```

### Plain Text Formatter

Formats logs as human-readable text:

```typescript
import { PlainTextFormatter } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  formatters: {
    default: new PlainTextFormatter(),
  },
});

repo.log('info', 'User logged in', {
  tag: '[Auth]',
  data: { userId: 123 },
});
// Output: [INFO] 2024-11-03T12:34:56.789Z [Auth] User logged in ...
```

### Combined Formatter

Produces both JSON and plain text output (default):

```typescript
import { CombinedFormatter } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  formatters: {
    default: new CombinedFormatter(),
  },
});

const output = formatter.format('info', 'Message', context);
// output.text = "[INFO] ..."
// output.json = { level: 'info', ... }
```

### Custom Formatters

Create your own formatter by implementing the `IFormatter` interface:

```typescript
import { IFormatter, LogLevel, LogContext } from '@thomassamoul/generic-logger';

class MyFormatter implements IFormatter {
  format(level: LogLevel, message: string, context?: LogContext) {
    return {
      text: `[${level.toUpperCase()}] ${message}`,
      json: { level, message, ...context },
    };
  }
}
```

## Adapters

Adapters connect the logger to specific logging libraries or outputs. The library includes several built-in adapters:

### Console Adapter

Simple console logger (no dependencies):

```typescript
import { ConsoleLoggerAdapter } from '@thomassamoul/generic-logger';

await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
  enabled: true,
  colorize: true, // Enable colored output in terminals
});
```

### File Adapter

File logging with custom writer function (cross-platform):

```typescript
import { FileLoggerAdapter } from '@thomassamoul/generic-logger';
import * as fs from 'fs/promises';

await logger.registerAdapter('file', new FileLoggerAdapter(), {
  enabled: true,
  formats: ['json', 'log'],
  directory: './logs',
  rotation: {
    enabled: true,
    strategy: 'size',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
  },
  fileWriter: async (message, level, context) => {
    // Implement rotation logic here based on rotation config
    const logFile = path.join('./logs', 'app.log');
    await fs.appendFile(logFile, message + '\n');
  },
});
```

### Sentry Adapter

Requires your pre-initialized Sentry instance:

```typescript
import { SentryLoggerAdapter } from '@thomassamoul/generic-logger';
import * as Sentry from '@sentry/react-native';

Sentry.init({ dsn: 'your-dsn' });

await logger.registerAdapter('sentry', new SentryLoggerAdapter(), {
  enabled: true,
  sentryInstance: Sentry,
});
```

### Mock Adapter (Testing)

In-memory adapter for testing:

```typescript
import { MockLoggerAdapter } from '@thomassamoul/generic-logger';

const mockAdapter = new MockLoggerAdapter();
await mockAdapter.initialize({ enabled: true });

await logger.registerAdapter('mock', mockAdapter, { enabled: true });

// Later in tests
const logs = mockAdapter.getLogs();
expect(logs).toHaveLength(1);
```

## Sanitization

The logger includes built-in sanitization to protect sensitive data:

```typescript
import { LoggerRepository, DefaultSanitizer } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  sanitization: {
    enabled: true,
    defaultSanitizer: new DefaultSanitizer(),
  },
});

// Sensitive fields are automatically redacted
repo.log('info', 'User data', {
  data: {
    password: 'secret123', // Will be redacted to [REDACTED]
    email: 'user@example.com', // Will be masked
    username: 'john', // Remains unchanged
  },
});
```

## Configuration

Configure the logger repository with formatters, sanitization, and severity levels:

```typescript
import {
  LoggerRepository,
  JsonFormatter,
  CombinedFormatter,
  DefaultSanitizer,
} from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  environment: 'dev', // 'dev' | 'stage' | 'prod'
  severity: 'debug', // Minimum log level
  formatters: {
    default: new CombinedFormatter(),
  },
  sanitization: {
    enabled: true,
    defaultSanitizer: new DefaultSanitizer(),
  },
});
```

## Next Steps

- Read the [Testing Guide](./testing.md) to learn how to test your logging code
- Check the [API Reference](../README.md#api-reference) for detailed API documentation
- Explore [Platform-Specific Examples](../README.md#platform-specific-examples) for your environment

