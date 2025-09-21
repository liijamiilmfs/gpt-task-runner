import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as path from 'path'

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = [
  /api[_-]?key/gi,
  /password/gi,
  /secret/gi,
  /token/gi,
  /auth/gi,
  /credential/gi,
  /openai[_-]?key/gi,
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI API keys
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
]

// Sanitize sensitive data from log messages
function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })
    return sanitized
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[lowerKey] = sanitizeLogData(value)
      }
    }

    return sanitized
  }
  
  return data
}

// Custom format that sanitizes sensitive data
const sanitizeFormat = winston.format((info) => {
  const infoWithSymbols = info as Record<string | symbol, any>

  for (const key of Object.keys(infoWithSymbols)) {
    infoWithSymbols[key] = sanitizeLogData(infoWithSymbols[key])
  }

  const splatKey = Symbol.for('splat')
  if (Array.isArray(infoWithSymbols[splatKey])) {
    infoWithSymbols[splatKey] = infoWithSymbols[splatKey].map(item => sanitizeLogData(item))
  }

  const messageKey = Symbol.for('message')
  if (infoWithSymbols[messageKey]) {
    infoWithSymbols[messageKey] = sanitizeLogData(infoWithSymbols[messageKey])
  }

  return info
})

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs')

// Configure daily rotate file transport
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  )
})

// Error log transport
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  )
})

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'libran-voice-forge',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    dailyRotateTransport,
    errorRotateTransport
  ]
})

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      sanitizeFormat(),
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, service, environment, ...meta }) => {
        const serviceStr = service ? `[${service}]` : ''
        const envStr = environment && environment !== 'production' ? `[${environment}]` : ''
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
        return `${timestamp} ${serviceStr}${envStr} [${level}]: ${message}${metaStr}`
      })
    )
  }))
}

// Log levels for different types of operations
export const LogLevels = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug'
} as const

// Structured logging methods
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.info(`[HTTP] ${message}`, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // API request logging
  apiRequest: (method: string, url: string, meta?: any) => {
    logger.info('API Request', {
      type: 'api_request',
      method,
      url: url.replace(/\/api\/[^\/]+\/[^\/]+/g, '/api/[endpoint]/[id]'), // Sanitize dynamic URLs
      ...meta
    })
  },
  
  // API response logging
  apiResponse: (method: string, url: string, statusCode: number, responseTime: number, meta?: any) => {
    logger.info('API Response', {
      type: 'api_response',
      method,
      url: url.replace(/\/api\/[^\/]+\/[^\/]+/g, '/api/[endpoint]/[id]'),
      statusCode,
      responseTime,
      ...meta
    })
  },
  
  // Translation logging
  translation: (text: string, variant: string, result: string, confidence: number, meta?: any) => {
    logger.info('Translation', {
      type: 'translation',
      textLength: text.length,
      variant,
      resultLength: result.length,
      confidence,
      ...meta
    })
  },
  
  // TTS logging
  tts: (text: string, voice: string, duration: number, meta?: any) => {
    logger.info('TTS Generation', {
      type: 'tts',
      textLength: text.length,
      voice,
      duration,
      ...meta
    })
  },
  
  // Error logging with context
  errorWithContext: (error: Error, context: string, meta?: any) => {
    logger.error('Error occurred', {
      type: 'error',
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...meta
    })
  },
  
  // Performance logging
  performance: (operation: string, duration: number, meta?: any) => {
    logger.info('Performance', {
      type: 'performance',
      operation,
      duration,
      ...meta
    })
  }
}

export default logger
