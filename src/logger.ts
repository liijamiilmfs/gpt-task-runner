import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  batch_id?: string;
  task_id?: string;
  corr_id?: string;
  phase?: string;
  [key: string]: any;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  batch_id?: string;
  task_id?: string;
  corr_id?: string;
  phase?: string;
  details?: any;
}

export class Logger {
  private logger: winston.Logger;
  private jsonMode: boolean;
  private sensitiveKeys: Set<string>;

  constructor(level: string = 'info', jsonMode: boolean = false) {
    this.jsonMode = jsonMode;

    // Common sensitive keys to sanitize
    this.sensitiveKeys = new Set([
      'api_key',
      'apiKey',
      'token',
      'password',
      'secret',
      'key',
      'authorization',
      'auth',
      'credential',
      'openai_api_key',
      'OPENAI_API_KEY',
      'prompt',
      'response',
      'content',
    ]);

    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(this.formatLogEntry)
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(this.formatLogEntry)
          ),
        }),
      ],
    });
  }

  private formatLogEntry = (info: any) => {
    // Extract the structured log entry from the second parameter
    const logEntry = info[1] || info;
    const {
      timestamp,
      level,
      message,
      batch_id,
      task_id,
      corr_id,
      phase,
      details,
    } = logEntry;

    if (this.jsonMode) {
      // JSON mode - return structured JSON
      const structuredEntry = {
        timestamp,
        level: level.replace(/\x1b\[[0-9;]*m/g, ''), // Remove color codes
        message,
        batch_id,
        task_id,
        corr_id,
        phase,
        details: details ? this.sanitizeData(details) : undefined,
      };
      return JSON.stringify(structuredEntry);
    } else {
      // Pretty mode - return human-readable format
      let logLine = `${timestamp} [${level}]`;

      if (corr_id) logLine += ` [${corr_id}]`;
      if (batch_id) logLine += ` [batch:${batch_id}]`;
      if (task_id) logLine += ` [task:${task_id}]`;
      if (phase) logLine += ` [${phase}]`;

      logLine += ` ${message}`;

      if (details && Object.keys(details).length > 0) {
        logLine += ` ${JSON.stringify(this.sanitizeData(details))}`;
      }

      return logLine;
    }
  };

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Check if key contains sensitive information
      const isSensitive = Array.from(this.sensitiveKeys).some((sensitiveKey) =>
        lowerKey.includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof value === 'string' &&
        this.containsSensitiveContent(value)
      ) {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private containsSensitiveContent(str: string): boolean {
    // Check for API key patterns, tokens, etc.
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{20,}/, // OpenAI API key pattern
      /[a-zA-Z0-9]{32,}/, // Generic long tokens
      /Bearer\s+[a-zA-Z0-9]+/, // Bearer tokens
    ];

    return sensitivePatterns.some((pattern) => pattern.test(str));
  }

  private sanitizeString(str: string): string {
    // Replace sensitive patterns with [REDACTED]
    return str
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]')
      .replace(/Bearer\s+[a-zA-Z0-9]+/g, 'Bearer [REDACTED_TOKEN]')
      .replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED_TOKEN]');
  }

  private createLogEntry(
    level: string,
    message: string,
    context?: LogContext,
    details?: any
  ): StructuredLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      batch_id: context?.batch_id,
      task_id: context?.task_id,
      corr_id: context?.corr_id,
      phase: context?.phase,
      details: details ? this.sanitizeData(details) : undefined,
    };
  }

  // Generate a new correlation ID
  generateCorrelationId(): string {
    return uuidv4();
  }

  info(message: string, context?: LogContext, details?: any): void {
    const logEntry = this.createLogEntry('info', message, context, details);
    this.logger.info(message, logEntry);
  }

  error(message: string, context?: LogContext, details?: any): void {
    const logEntry = this.createLogEntry('error', message, context, details);
    this.logger.error(message, logEntry);
  }

  warn(message: string, context?: LogContext, details?: any): void {
    const logEntry = this.createLogEntry('warn', message, context, details);
    this.logger.warn(message, logEntry);
  }

  debug(message: string, context?: LogContext, details?: any): void {
    const logEntry = this.createLogEntry('debug', message, context, details);
    this.logger.debug(message, logEntry);
  }

  verbose(message: string, context?: LogContext, details?: any): void {
    const logEntry = this.createLogEntry('verbose', message, context, details);
    this.logger.verbose(message, logEntry);
  }

  // Convenience methods for common logging patterns
  taskStart(
    taskId: string,
    batchId?: string,
    corrId?: string,
    details?: any
  ): void {
    this.info(
      'Task started',
      { task_id: taskId, batch_id: batchId, corr_id: corrId, phase: 'start' },
      details
    );
  }

  taskComplete(
    taskId: string,
    batchId?: string,
    corrId?: string,
    details?: any
  ): void {
    this.info(
      'Task completed',
      {
        task_id: taskId,
        batch_id: batchId,
        corr_id: corrId,
        phase: 'complete',
      },
      details
    );
  }

  taskError(
    taskId: string,
    batchId?: string,
    corrId?: string,
    details?: any
  ): void {
    this.error(
      'Task failed',
      { task_id: taskId, batch_id: batchId, corr_id: corrId, phase: 'error' },
      details
    );
  }

  batchStart(batchId: string, corrId?: string, details?: any): void {
    this.info(
      'Batch started',
      { batch_id: batchId, corr_id: corrId, phase: 'batch_start' },
      details
    );
  }

  batchComplete(batchId: string, corrId?: string, details?: any): void {
    this.info(
      'Batch completed',
      { batch_id: batchId, corr_id: corrId, phase: 'batch_complete' },
      details
    );
  }
}
