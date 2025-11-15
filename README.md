<img width="1200" height="627" alt="ChatGPT Image Nov 5, 2025, 01_43_49 AM (1)" src="https://github.com/user-attachments/assets/6ba56a56-3a5f-4b0e-a5e6-de8b7acba0ce" />

# @thomassamoul/generic-logger

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
npm install @thomassamoul/generic-logger
```

## Documentation

- [Getting Started Guide](./docs/getting-started.md) - Learn the basics
- [Testing Guide](./docs/testing.md) - Test your logging code with Jest

## Quick Start

### Basic Usage (Console Only)

```typescript
import { logger, ConsoleLoggerAdapter } from '@thomassamoul/generic-logger';

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
import { logger, SentryLoggerAdapter } from '@thomassamoul/generic-logger';
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
import { logger, WinstonLoggerAdapter } from '@thomassamoul/generic-logger';
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
import { logger, DataDogLoggerAdapter } from '@thomassamoul/generic-logger';
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
import { logger, ConsoleLoggerAdapter, SentryLoggerAdapter } from '@thomassamoul/generic-logger';
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

The `LoggerRepository` is the central facade that manages multiple adapters, handles sanitization, and applies formatters:

```typescript
import { LoggerRepository, CombinedFormatter } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  sanitization: {
    enabled: true,
  },
  formatters: {
    default: new CombinedFormatter(), // Optional: format logs
  },
});

// Register adapters
await repo.registerAdapter('console', new ConsoleLoggerAdapter(), { enabled: true });

// Log messages
// Pipeline: sanitize → format → adapters
repo.log('info', 'Message', { tag: '[Feature]', data: { key: 'value' } });
```

### Formatters

Formatters transform log entries into different output formats (plain text, JSON, or both). The library includes three built-in formatters:

**JSON Formatter** - Produces structured JSON output:
```typescript
import { JsonFormatter } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  formatters: { default: new JsonFormatter() },
});
```

**Plain Text Formatter** - Produces human-readable text:
```typescript
import { PlainTextFormatter } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  formatters: { default: new PlainTextFormatter() },
});
```

**Combined Formatter** - Produces both JSON and text (default):
```typescript
import { CombinedFormatter } from '@thomassamoul/generic-logger';

const repo = LoggerRepository.getInstance({
  formatters: { default: new CombinedFormatter() },
});
```

Adapters receive formatted output via `context.metadata._formattedOutput` and can use either `text` or `json` properties.

### Adapters

Adapters are implementations that connect to specific logging libraries. This package includes:

- **ConsoleLoggerAdapter**: Simple console logger (no dependencies)
- **SentryLoggerAdapter**: For Sentry (requires your Sentry instance)
- **DataDogLoggerAdapter**: For DataDog (requires your DataDog instance)
- **WinstonLoggerAdapter**: For Winston (requires your Winston logger)
- **FileLoggerAdapter**: For file logging (requires custom file writer function)
- **MockLoggerAdapter**: In-memory adapter for testing (see [Testing Guide](./docs/testing.md))

### Creating Custom Adapters

You can create custom adapters for any logging library:

```typescript
import { ILoggerAdapter, LogLevel, LogContext } from '@thomassamoul/generic-logger';

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
import { logger, DefaultSanitizer } from '@thomassamoul/generic-logger';

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
import { BaseSanitizer } from '@thomassamoul/generic-logger';

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
import { sanitizerRegistry } from '@thomassamoul/generic-logger';
sanitizerRegistry.register('Auth', new CustomSanitizer());

// Use it
logger.info('Login attempt', {
  tag: 'Auth', // Will use the Auth sanitizer
  data: { password: 'secret' },
});
```

### Per-Call Sanitization

```typescript
import { DefaultSanitizer } from '@thomassamoul/generic-logger';

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
import { logger, ConsoleLoggerAdapter } from '@thomassamoul/generic-logger';

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
import { logger, ConsoleLoggerAdapter, WinstonLoggerAdapter, FileLoggerAdapter } from '@thomassamoul/generic-logger';
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
import { logger, ConsoleLoggerAdapter } from '@thomassamoul/generic-logger';

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
import { logger, ConsoleLoggerAdapter, SentryLoggerAdapter } from '@thomassamoul/generic-logger';
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

Complete configuration options for the logger repository:

```typescript
interface LoggerRepositoryConfig {
  /**
   * Environment setting - affects default configurations
   * - 'dev': Development environment (more verbose logging)
   * - 'stage': Staging environment
   * - 'prod': Production environment (minimal logging)
   */
  environment?: 'dev' | 'stage' | 'prod';

  /**
   * Adapter configurations (optional - use registerAdapter() instead)
   * This is mainly for convenience and legacy support
   */
  adapters?: AdapterConfigs;

  /**
   * Sanitization configuration
   */
  sanitization?: {
    /**
     * Enable/disable automatic data sanitization
     * @default true
     */
    enabled?: boolean;
    
    /**
     * Custom default sanitizer instance
     * If not provided, uses DefaultSanitizer
     */
    defaultSanitizer?: ISanitizer;
  };

  /**
   * Minimum log level to process
   * Logs below this level will be ignored globally
   * - 'debug': All logs (debug, info, warn, error)
   * - 'info': Info, warn, error (default)
   * - 'warn': Warning and error only
   * - 'error': Error only
   * @default 'info'
   */
  severity?: 'debug' | 'info' | 'warn' | 'error';
}
```

### Adapter Configurations

#### ConsoleAdapterConfig

Simple console logging adapter with optional colorization:

```typescript
interface ConsoleAdapterConfig {
  /**
   * Enable/disable the console adapter
   */
  enabled: boolean;

  /**
   * Enable ANSI color codes for terminal output
   * - Colors work in Node.js terminals
   * - May not work in browser consoles
   * @default false
   */
  colorize?: boolean;
}
```

**Example:**
```typescript
await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
  enabled: true,
  colorize: true  // Enable colored output
});
```

#### SentryAdapterConfig

Sentry integration adapter - requires your pre-initialized Sentry instance:

```typescript
interface SentryAdapterConfig {
  /**
   * Enable/disable the Sentry adapter
   */
  enabled: boolean;

  /**
   * Pre-initialized Sentry instance
   * Compatible with:
   * - @sentry/react-native
   * - @sentry/browser
   * - @sentry/node
   * 
   * You must initialize Sentry yourself before passing it here
   */
  sentryInstance: any;
}
```

**Example:**
```typescript
import * as Sentry from '@sentry/react-native';

// Initialize Sentry first
Sentry.init({
  dsn: 'your-dsn-here',
  environment: 'production',
  tracesSampleRate: 1.0,
});

// Then register adapter
await logger.registerAdapter('sentry', new SentryLoggerAdapter(), {
  enabled: true,
  sentryInstance: Sentry
});
```

#### WinstonAdapterConfig

Winston logger integration - requires your pre-configured Winston logger:

```typescript
interface WinstonAdapterConfig {
  /**
   * Enable/disable the Winston adapter
   */
  enabled: boolean;

  /**
   * Pre-configured Winston logger instance
   * Create your logger with transports, formats, etc. before passing it
   */
  winstonInstance: any;
}
```

**Example:**
```typescript
import winston from 'winston';

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ],
});

await logger.registerAdapter('winston', new WinstonLoggerAdapter(), {
  enabled: true,
  winstonInstance: winstonLogger
});
```

#### DataDogAdapterConfig

DataDog integration adapter - requires your pre-initialized DataDog instance:

```typescript
interface DataDogAdapterConfig {
  /**
   * Enable/disable the DataDog adapter
   */
  enabled: boolean;

  /**
   * Pre-initialized DataDog instance
   * Compatible with:
   * - @datadog/mobile-react-native
   * - @datadog/browser-rum
   * - datadog-logs-js
   */
  datadogInstance: any;
}
```

**Example:**
```typescript
import { DatadogProvider, Configuration } from '@datadog/mobile-react-native';

const config = new Configuration('client-token', 'application-id', {
  env: 'production',
  service: 'my-app'
});
DatadogProvider.initialize(config);

await logger.registerAdapter('datadog', new DataDogLoggerAdapter(), {
  enabled: true,
  datadogInstance: DatadogProvider
});
```

#### FileAdapterConfig

File logging adapter with custom file writer function and rotation support:

```typescript
interface FileAdapterConfig {
  /**
   * Enable/disable the file adapter
   */
  enabled: boolean;

  /**
   * Custom file writer function
   * Required for actual file writing
   * If not provided, logs are buffered in memory
   * 
   * For rotation support, implement rotation logic inside this function
   * based on the rotation config. The rotation config is provided in
   * context.metadata._rotationConfig and formatted text is in context.metadata._formattedText.
   * 
   * @param message - Formatted log message
   * @param level - Log level
   * @param context - Log context with data, metadata, etc.
   *                 Contains _formattedText and _rotationConfig in metadata
   */
  fileWriter?: (message: string, level: LogLevel, context?: LogContext) => Promise<void>;

  /**
   * Output formats for log entries
   * - 'json': JSON format
   * - 'log': Plain text format
   * @default ['json']
   */
  formats?: ('json' | 'log')[];

  /**
   * File rotation configuration (informational)
   * Implement rotation logic in your fileWriter based on these settings
   */
  rotation?: {
    enabled?: boolean;
    strategy?: 'size' | 'time' | 'size-and-time';
    maxSize?: number; // bytes
    maxFiles?: number;
    pattern?: string; // 'YYYY-MM-DD', etc.
    retentionDays?: number;
  };

  /**
   * Maximum file size in bytes before rotation
   * (Deprecated - use rotation.maxSize instead)
   * @deprecated
   */
  maxSize?: number;

  /**
   * Maximum number of log files to keep
   * (Deprecated - use rotation.maxFiles instead)
   * @deprecated
   */
  maxFiles?: number;

  /**
   * Directory for log files
   * (Informational - use in your fileWriter implementation)
   */
  directory?: string;

  /**
   * Per-adapter minimum log level
   * @default 'info'
   */
  severity?: LogLevel;
}
```

**Example (Node.js with rotation):**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

await logger.registerAdapter('file', new FileLoggerAdapter(), {
  enabled: true,
  formats: ['json', 'log'],
  directory: './logs',
  rotation: {
    enabled: true,
    strategy: 'size-and-time',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    pattern: 'YYYY-MM-DD',
    retentionDays: 30,
  },
  fileWriter: async (message, level, context) => {
    const rotationConfig = context?.metadata?._rotationConfig;
    const formattedText = context?.metadata?._formattedText || message;
    const logDir = './logs';
    
    // Implement rotation logic based on rotationConfig
    if (rotationConfig?.enabled) {
      const logFile = path.join(logDir, 'app.log');
      const stats = await fs.stat(logFile).catch(() => null);
      
      // Check if rotation is needed (size-based)
      if (stats && rotationConfig.maxSize && stats.size >= rotationConfig.maxSize) {
        // Rotate file (rename with timestamp, create new file)
        const timestamp = new Date().toISOString().split('T')[0];
        await fs.rename(logFile, path.join(logDir, `app.${timestamp}.log`));
        
        // Clean up old files if maxFiles exceeded
        if (rotationConfig.maxFiles) {
          // Implementation to delete oldest files
        }
      }
    }
    
    // Write to file
    const logFile = path.join(logDir, 'app.log');
    await fs.appendFile(logFile, formattedText);
  }
});
```

#### Base Adapter Configuration

All adapters inherit from this base configuration:

```typescript
interface LoggerAdapterConfig {
  /**
   * Enable/disable this adapter
   */
  enabled: boolean;

  /**
   * Minimum log level for this specific adapter
   * Overrides global severity setting
   * @default 'info'
   */
  severity?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Additional adapter-specific configuration
   */
  [key: string]: unknown;
}
```

### LogContext Configuration

Complete context options for log entries:

```typescript
interface LogContext {
  /**
   * Custom tag for categorizing logs (e.g., '[Auth]', '[Payment]')
   * Useful for filtering and sanitization
   */
  tag?: string;

  /**
   * File name where the log originated
   * Auto-detected if not provided
   */
  file?: string;

  /**
   * Function or component name where the log originated
   * Auto-detected if not provided
   */
  function?: string;

  /**
   * Additional data object to include in the log
   * Will be sanitized if sanitization is enabled
   */
  data?: any;

  /**
   * Error object to log
   * Will be formatted appropriately by adapters
   */
  error?: Error | any;

  /**
   * Timestamp override
   * Defaults to current time if not provided
   */
  timestamp?: Date;

  /**
   * Additional metadata (key-value pairs)
   * Useful for structured logging
   */
  metadata?: Record<string, unknown>;

  /**
   * Custom sanitizer for this specific log call
   * Overrides default and tag-based sanitizers
   */
  sanitizer?: ISanitizer;

  /**
   * Skip sanitization for this call
   * Use with caution - sensitive data may be logged
   */
  skipSanitization?: boolean;
}
```

### Example Log Output

When using the console adapter with colorization enabled, you'll see output like this:

#### Debug Level (Green)
```
[DEBUG] 2024-11-03T12:34:56.789Z [UserService.getUser:user-service.ts] Fetching user data
```
*(In terminal: Green text)*

#### Info Level (Cyan)
```
[INFO] 2024-11-03T12:34:56.789Z [UserService.getUser:user-service.ts] User found: john@example.com
```
*(In terminal: Cyan text)*

#### Warning Level (Yellow)
```
[WARN] 2024-11-03T12:34:56.789Z [PaymentService.process:payment-service.ts] Payment retry attempt 3
```
*(In terminal: Yellow text)*

#### Error Level (Red)
```
[ERROR] 2024-11-03T12:34:56.789Z [DatabaseService.connect:database-service.ts] Connection failed
```
*(In terminal: Red text)*

#### With Context Data
```typescript
logger.info('User logged in', {
  tag: '[Auth]',
  data: { userId: 123, email: 'user@example.com' }
});
```

**Output:**
```
[INFO] 2024-11-03T12:34:56.789Z [Auth] User logged in { userId: 123, email: 'user@example.com' }
```

#### With Error Object
```typescript
logger.error('Payment processing failed', new Error('Insufficient funds'), {
  tag: '[Payment]',
  data: { transactionId: 'tx-123', amount: 100 }
});
```

**Output:**
```
[ERROR] 2024-11-03T12:34:56.789Z [Payment] Payment processing failed
Error: {
  message: "Insufficient funds",
  stack: "Error: Insufficient funds\n    at PaymentService.process..."
}
{ transactionId: 'tx-123', amount: 100 }
```

#### With Sanitization
```typescript
logger.info('User registration', {
  data: {
    username: 'john',
    password: 'secret123',  // Will be redacted
    email: 'john@example.com' // Will be masked
  }
});
```

**Output:**
```
[INFO] 2024-11-03T12:34:56.789Z User registration { 
  username: 'john',
  password: '[REDACTED]',
  email: 'joh***@example.com'
}
```

#### Multiple Adapters
When using multiple adapters, the same log goes to all enabled adapters:

```typescript
// Console adapter (colored output in terminal)
await logger.registerAdapter('console', new ConsoleLoggerAdapter(), {
  enabled: true,
  colorize: true
});

// Sentry adapter (errors go to Sentry)
await logger.registerAdapter('sentry', new SentryLoggerAdapter(), {
  enabled: true,
  sentryInstance: Sentry
});

logger.error('Critical error occurred', error);
```

**Result:**
- Console: Shows colored error in terminal
- Sentry: Creates error event with breadcrumbs and context

## Testing

The package includes comprehensive tests and a `MockLoggerAdapter` for testing your code. See the [Testing Guide](./docs/testing.md) for detailed information.

### Quick Start with MockLoggerAdapter

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
    LoggerRepository.resetInstance();
  });

  it('should log correctly', () => {
    logger.info('Test message');
    
    const logs = mockAdapter.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
  });
});
```

For more examples and advanced testing patterns, see the [Testing Guide](./docs/testing.md).

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
} from '@thomassamoul/generic-logger';
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

