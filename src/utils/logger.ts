/**
 * Structured logging utility with correlation ID support
 * Provides consistent logging across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

/**
 * Logger class with structured logging and correlation ID support
 */
export class Logger {
  
  constructor(private readonly service: string) {}

  /**
   * Log debug message
   * @param message - Debug message
   * @param metadata - Additional metadata
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   * @param message - Info message
   * @param metadata - Additional metadata
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   * @param message - Warning message
   * @param metadata - Additional metadata
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   * @param message - Error message
   * @param metadata - Additional metadata
   * @param error - Error object
   */
  error(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log('error', message, metadata, error);
  }

  /**
   * Core logging method with structured output
   * @param level - Log level
   * @param message - Log message
   * @param metadata - Additional metadata
   * @param error - Error object for error logs
   */
  private log(
    level: LogLevel, 
    message: string, 
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: metadata?.correlationId as string,
      metadata: { 
        service: this.service,
        ...metadata 
      },
      error
    };

    // In production, this would integrate with proper logging service
    // For now, structured console output
    if (level === 'error') {
      console.error(JSON.stringify(logEntry, null, 2));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }
}
