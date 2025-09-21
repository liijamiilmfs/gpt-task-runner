import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as path from 'path'
import * as fs from 'fs'

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

// Create logs directory structure
const logsDir = path.join(process.cwd(), 'logs')
const logsSubDirs = {
  application: path.join(logsDir, 'application'),
  errors: path.join(logsDir, 'errors'),
  api: path.join(logsDir, 'api'),
  translation: path.join(logsDir, 'translation'),
  tts: path.join(logsDir, 'tts'),
  metrics: path.join(logsDir, 'metrics'),
  performance: path.join(logsDir, 'performance'),
  security: path.join(logsDir, 'security')
}

// Ensure all log directories exist
Object.values(logsSubDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Environment-based log rotation settings
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
const maxSize = isDevelopment ? '200m' : '100m'
const maxFiles = isDevelopment ? '7d' : '14d'

// Color coding for different log levels
const colors = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  info: '\x1b[36m', // Cyan
  http: '\x1b[35m', // Magenta
  debug: '\x1b[90m', // Gray
  success: '\x1b[32m', // Green
  reset: '\x1b[0m' // Reset
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

// Human-readable format for console
const humanReadableFormat = winston.format.printf(({ timestamp, level, message, service, environment, type, correlationId, ...meta }) => {
  const color = colors[level as keyof typeof colors] || colors.reset
  const reset = colors.reset
  const time = timestamp.replace('T', ' ').replace('Z', '')
  const serviceStr = service ? `[${service}]` : ''
  const envStr = environment && environment !== 'production' ? `[${environment}]` : ''
  const corrStr = correlationId ? `[${correlationId}]` : ''
  const typeStr = type ? `[${type}]` : ''
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
  
  return `${color}${time} ${serviceStr}${envStr}${corrStr}${typeStr} [${level.toUpperCase()}]${reset} ${message}${metaStr}`
})

// Configure daily rotate file transport for application logs
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsSubDirs.application, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: maxSize,
  maxFiles: maxFiles,
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
  filename: path.join(logsSubDirs.errors, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: isDevelopment ? '100m' : '50m',
  maxFiles: isDevelopment ? '14d' : '30d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  )
})

// API log transport
const apiRotateTransport = new DailyRotateFile({
  filename: path.join(logsSubDirs.api, 'api-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '50m',
  maxFiles: '7d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Translation log transport
const translationRotateTransport = new DailyRotateFile({
  filename: path.join(logsSubDirs.translation, 'translation-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '50m',
  maxFiles: '7d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.json()
  )
})

// TTS log transport
const ttsRotateTransport = new DailyRotateFile({
  filename: path.join(logsSubDirs.tts, 'tts-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '50m',
  maxFiles: '7d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Performance log transport
const performanceRotateTransport = new DailyRotateFile({
  filename: path.join(logsSubDirs.performance, 'performance-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '25m',
  maxFiles: '3d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Security log transport
const securityRotateTransport = new DailyRotateFile({
  filename: path.join(logsSubDirs.security, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'warn',
  maxSize: '25m',
  maxFiles: '30d',
  zippedArchive: true,
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
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
    errorRotateTransport,
    apiRotateTransport,
    translationRotateTransport,
    ttsRotateTransport,
    performanceRotateTransport,
    securityRotateTransport
  ]
})

// Add console transport for development with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      sanitizeFormat(),
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      humanReadableFormat
    )
  }))
}

// Add rotation event handlers for monitoring
dailyRotateTransport.on('rotate', (oldFilename, newFilename) => {
  console.log(`📁 Log rotated: ${oldFilename} -> ${newFilename}`)
  logger.info('Log file rotated', {
    type: 'log_rotation',
    oldFile: oldFilename,
    newFile: newFilename,
    reason: 'size_limit_reached'
  })
})

errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
  console.log(`🔴 Error log rotated: ${oldFilename} -> ${newFilename}`)
  logger.info('Error log file rotated', {
    type: 'log_rotation',
    oldFile: oldFilename,
    newFile: newFilename,
    reason: 'size_limit_reached'
  })
})

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

  // Error taxonomy logging with correlation ID
  errorTaxonomy: (errorCode: string, userMessage: string, category: string, severity: string, meta?: any) => {
    logger.error('Error Taxonomy', {
      type: 'error_taxonomy',
      errorCode,
      userMessage,
      category,
      severity,
      ...meta
    })
  },

  // Correlation ID logging
  withCorrelationId: (correlationId: string, meta?: any) => {
    return {
      correlationId,
      ...meta
    }
  },
  
  // Performance logging
  performance: (operation: string, duration: number, meta?: any) => {
    logger.info('Performance', {
      type: 'performance',
      operation,
      duration,
      ...meta
    })
  },

  // Security logging
  security: (event: string, meta?: any) => {
    logger.warn('Security Event', {
      type: 'security',
      event,
      ...meta
    })
  },

  // Metrics logging
  metrics: (metric: string, value: number, meta?: any) => {
    logger.info('Metrics', {
      type: 'metrics',
      metric,
      value,
      ...meta
    })
  }
}

export default logger