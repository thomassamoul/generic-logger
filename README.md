# @thomas/generic-logger

A generic, customizable logging library that works across **Browser**, **Node.js**, **React**, and **React Native** without initializing third-party dependencies. Users provide their own logging library instances, making this a truly generic solution.

## Features

- 🎯 **Generic & Dependency-Free**: No third-party libraries are initialized by this package
- 🔌 **Adapter Pattern**: Flexible adapter system for any logging library
- 🧹 **Built-in Sanitization**: Automatic data sanitization to prevent logging sensitive information
- 🔒 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🌐 **Cross-Platform**: Works in Browser, Node.js, React, and React Native
- 📦 **Dual Package**: Supports both ESM and CommonJS
- ⚙️ **Fully Customizable**: Configure adapters, sanitizers, and behavior as needed
- 🧪 **Tested**: Comprehensive unit tests with Jest

## Installation

```bash
npm install @thomas/generic-logger
```

## Quick Start

### Basic Usage (Console Only)

```typescript
import { logger, ConsoleLoggerAdapter } from '@thomas/generic-logger';

// Register the console adapter (no dependencies required)
await logger.registerAdapter(
  'console',
  new ConsoleLoggerAdapter(),
  { enabled: true, colorize: true }
);

// Start logging
logger.info('Application started');
logger.debug('Debug information', { data: { userId: 123 } });
logger.warn('Warning message');
logger.error('Error occurred', new Error('Something went wrong'));
```

### With Sentry (Browser/React Native/Node)

```typescript
import { logger, SentryLoggerAdapter } from '@thomas/generic-logger';
import * as Sentry from '@sentry/react-native'; // or @sentry/browser, @sentry/node

// Initialize Sentry yourself
Sentry.init({
  dsn: 'your-dsn-here',
  environment: 'production',
});

// Register the adapter with your Sentry instance
await logger.registerAdapter(
  'sentry',
  new SentryLoggerAdapter(),
  { enabled: true, sentryInstance: Sentry }
);

logger.error('Error logged to Sentry', error);
```

### With Winston (Node.js)

```typescript
import { logger, WinstonLoggerAdapter } from '@thomas/generic-logger';
import winston from 'winston';

// Create your Winston logger
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Register the adapter
await logger.registerAdapter(
  'winston',
  new WinstonLoggerAdapter(),
  { enabled: true, winstonInstance: winstonLogger }
);

logger.info('This will be logged by Winston');
```

### With DataDog

```typescript
import { logger, DataDogLoggerAdapter } from '@thomas/generic-logger';
import { DatadogProvider, Configuration } from '@datadog/mobile-react-native';

// Initialize DataDog yourself
const config = new Configuration('client-token', 'app-id');
DatadogProvider.initialize(config);

// Register the adapter
await logger.registerAdapter(
  'datadog',
  new DataDogLoggerAdapter(),
  { enabled: true, datadogInstance: DatadogProvider }
);

logger.info('Logged to DataDog');
```

### Multiple Adapters

```typescript
import { logger, ConsoleLoggerAdapter, SentryLoggerAdapter } from '@thomas/generic-logger';
import * as Sentry from '@sentry/react-native';

Sentry.init({ dsn: 'your-dsn' });

// Register multiple adapters - logs will go to all of them
await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
  enabled: true,
  colorize: true,
});

await logger.registerAdapter('sentry', new SentryLoggerAdapter(), {
  enabled: true,
  sentryInstance: Sentry,
});

// This log will go to both console and Sentry
logger.info('Logged to both console and Sentry');
```

## Core Concepts

### Logger Repository

The `LoggerRepository` is the central facade that manages multiple adapters and handles sanitization:

```typescript
import { LoggerRepository } from '@thomas/generic-logger';

const repo = LoggerRepository.getInstance({
  sanitization: {
    enabled: true,
  },
});

// Register adapters
await repo.registerAdapter('console', new ConsoleLoggerAdapter(), { enabled: true });

// Log messages
repo.log('info', 'Message', { tag: '[Feature]', data: { key: 'value' } });
```

### Adapters

Adapters are implementations that connect to specific logging libraries. This package includes:

- **ConsoleLoggerAdapter**: Simple console logger (no dependencies)
- **SentryLoggerAdapter**: For Sentry (requires your Sentry instance)
- **DataDogLoggerAdapter**: For DataDog (requires your DataDog instance)
- **WinstonLoggerAdapter**: For Winston (requires your Winston logger)
- **FileLoggerAdapter**: For file logging (requires custom file writer function)

### Creating Custom Adapters

You can create custom adapters for any logging library:

```typescript
import { ILoggerAdapter, LogLevel, LogContext } from '@thomas/generic-logger';

class MyCustomAdapter extends ILoggerAdapter<MyLoggerInstance> {
  private myLogger: MyLoggerInstance;

  async initialize(config: any): Promise<void> {
    // Initialize your logger here
    this.myLogger = config.myLoggerInstance;
  }

  isEnabled(): boolean {
    return !!this.myLogger;
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isEnabled()) return;
    // Implement your logging logic
    this.myLogger.log(level, message, context);
  }

  async destroy(): Promise<void> {
    // Cleanup if needed
    this.myLogger = undefined;
  }
}

// Use it
await logger.registerAdapter('custom', new MyCustomAdapter(), {
  enabled: true,
  myLoggerInstance: myLogger,
});
```

## Sanitization

The logger includes built-in sanitization to prevent logging sensitive information.

### Default Sanitization

The `DefaultSanitizer` automatically redacts common sensitive fields:

```typescript
import { logger, DefaultSanitizer } from '@thomas/generic-logger';

logger.info('User data', {
  data: {
    password: 'secret123', // Will be redacted to [REDACTED]
    token: 'abc123',      // Will be redacted
    email: 'user@example.com', // Will be masked
    username: 'john',     // Will remain unchanged
  },
});
```

### Custom Sanitizer

```typescript
import { BaseSanitizer } from '@thomas/generic-logger';

class CustomSanitizer extends BaseSanitizer {
  sanitize(data: unknown): unknown {
    // Your sanitization logic
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      delete sanitized.secretField;
      return sanitized;
    }
    return data;
  }
}

// Register for a specific tag
import { sanitizerRegistry } from '@thomas/generic-logger';
sanitizerRegistry.register('Auth', new CustomSanitizer());

// Use it
logger.info('Login attempt', {
  tag: 'Auth', // Will use the Auth sanitizer
  data: { password: 'secret' },
});
```

### Per-Call Sanitization

```typescript
import { DefaultSanitizer } from '@thomas/generic-logger';

// Use a specific sanitizer for this call
logger.info('Message', {
  data: { sensitive: 'data' },
  sanitizer: new CustomSanitizer(),
});

// Skip sanitization
logger.info('Safe message', {
  data: { public: 'data' },
  skipSanitization: true,
});
```

## Platform-Specific Examples

### Browser

```typescript
import { logger, ConsoleLoggerAdapter } from '@thomas/generic-logger';

// Console adapter works in browser
await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
  enabled: true,
  colorize: false, // Colors may not work in browser console
});

// Or use with Sentry Browser
import * as Sentry from '@sentry/browser';
Sentry.init({ dsn: 'your-dsn' });
await logger.registerAdapter('sentry', new SentryLoggerAdapter(), {
  enabled: true,
  sentryInstance: Sentry,
});
```

### Node.js

```typescript
import { logger, ConsoleLoggerAdapter, WinstonLoggerAdapter, FileLoggerAdapter } from '@thomas/generic-logger';
import winston from 'winston';
import * as fs from 'fs/promises';

// Console
await logger.registerAdapter('console', new ConsoleLoggerAdapter(), { enabled: true });

// Winston
const winstonLogger = winston.createLogger({ /* config */ });
await logger.registerAdapter('winston', new WinstonLoggerAdapter(), {
  enabled: true,
  winstonInstance: winstonLogger,
});

// File with custom writer
await logger.registerAdapter('file', new FileLoggerAdapter(), {
  enabled: true,
  fileWriter: async (message, level, context) => {
    await fs.appendFile('app.log', JSON.stringify({ message, level, context }) + '\n');
  },
});
```

### React

```typescript
import { useEffect } from 'react';
import { logger, ConsoleLoggerAdapter } from '@thomas/generic-logger';

function App() {
  useEffect(() => {
    const initLogger = async () => {
      await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
        enabled: true,
        colorize: true,
      });
    };
    initLogger();
  }, []);

  // Use logger throughout your app
  logger.info('Component rendered');
}
```

### React Native

```typescript
import { useEffect } from 'react';
import { logger, ConsoleLoggerAdapter, SentryLoggerAdapter } from '@thomas/generic-logger';
import * as Sentry from '@sentry/react-native';

useEffect(() => {
  const initLogger = async () => {
    // Console adapter
    await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
      enabled: __DEV__,
      colorize: true,
    });

    // Sentry adapter
    if (!__DEV__) {
      Sentry.init({ dsn: 'your-dsn' });
      await logger.registerAdapter('sentry', new SentryLoggerAdapter(), {
        enabled: true,
        sentryInstance: Sentry,
      });
    }
  };
  initLogger();
}, []);
```

## API Reference

### Logger Methods

```typescript
logger.debug(message: string, context?: LogContext): void;
logger.info(message: string, context?: LogContext): void;
logger.warn(message: string, context?: LogContext): void;
logger.error(message: string, error?: Error | any, context?: LogContext): void;
logger.log(level: LogLevel, message: string, context?: LogContext): void;
```

### LogContext

```typescript
interface LogContext {
  tag?: string;              // Custom tag (e.g., '[Auth]')
  file?: string;             // File name
  function?: string;         // Function name
  data?: any;                // Additional data
  error?: Error | any;       // Error object
  timestamp?: Date;          // Timestamp override
  metadata?: Record<string, unknown>; // Additional metadata
  sanitizer?: ISanitizer;    // Custom sanitizer for this call
  skipSanitization?: boolean; // Skip sanitization
}
```

### LoggerRepository Methods

```typescript
// Register an adapter
await repository.registerAdapter(
  name: string,
  adapter: ILoggerAdapter,
  config?: any
): Promise<void>;

// Unregister an adapter
await repository.unregisterAdapter(name: string): Promise<void>;

// Log a message
repository.log(level: LogLevel, message: string, options?: EnhancedLogOptions): void;

// Get configuration
repository.getConfig(): Readonly<LoggerRepositoryConfig>;

// Update configuration
await repository.updateConfig(config: Partial<LoggerRepositoryConfig>): Promise<void>;

// Cleanup
await repository.destroy(): Promise<void>;
```

## Configuration

### Repository Configuration

```typescript
interface LoggerRepositoryConfig {
  environment?: LoggerEnvironment; // 'dev' | 'stage' | 'prod'
  adapters?: AdapterConfigs;      // Optional (use registerAdapter instead)
  sanitization?: {
    enabled?: boolean;
    defaultSanitizer?: ISanitizer;
  };
  severity?: LogLevel;            // Minimum log level
}
```

### Adapter Configurations

#### ConsoleAdapterConfig
```typescript
{
  enabled: boolean;
  colorize?: boolean;
}
```

#### SentryAdapterConfig
```typescript
{
  enabled: boolean;
  sentryInstance: any; // Your initialized Sentry instance
}
```

#### WinstonAdapterConfig
```typescript
{
  enabled: boolean;
  winstonInstance: any; // Your Winston logger instance
}
```

#### DataDogAdapterConfig
```typescript
{
  enabled: boolean;
  datadogInstance: any; // Your DataDog instance
}
```

#### FileAdapterConfig
```typescript
{
  enabled: boolean;
  fileWriter?: (message: string, level: LogLevel, context?: LogContext) => Promise<void>;
  formats?: ('json' | 'log')[];
  maxSize?: number;
  maxFiles?: number;
  directory?: string;
}
```

## Testing

The package includes comprehensive tests. To run them:

```bash
npm test
npm run test:coverage
```

### Testing Your Code

```typescript
import { LoggerRepository } from '@thomas/generic-logger';

describe('MyFeature', () => {
  afterEach(() => {
    LoggerRepository.resetInstance();
  });

  it('should log correctly', () => {
    const repo = LoggerRepository.getInstance();
    // ... your test code
  });
});
```

## TypeScript Support

Full TypeScript definitions are included. The package exports all types:

```typescript
import type {
  LogLevel,
  LogContext,
  LoggerRepositoryConfig,
  ILoggerAdapter,
  ISanitizer,
  // ... and more
} from '@thomas/generic-logger';
```

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`npm test`)
2. Type checking passes (`npm run type-check`)
3. Code follows existing patterns
4. New features include tests

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.

