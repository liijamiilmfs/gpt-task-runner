import * as path from 'path'
import * as fs from 'fs'

type PinoDestinationStream = {
  write: (chunk: any) => void
  flush?: () => void
  end?: () => void
}

type LoggerLike = {
  debug: (data: any) => void
  info: (data: any) => void
  warn: (data: any) => void
  error: (data: any) => void
}

type PinoModule = {
  (options?: any, destination?: any): LoggerLike
  destination: (options?: any) => PinoDestinationStream
  multistream: (streams: Array<{ level?: string, stream: PinoDestinationStream }>) => any
  transport?: (options: any) => PinoDestinationStream
  stdTimeFunctions?: { isoTime: () => string }
}

function formatForConsole(data: any): string {
  if (typeof data === 'string') {
    return data
  }

  try {
    return JSON.stringify(data)
  } catch (error) {
    return String(data)
  }
}

function createConsoleDestination(): PinoDestinationStream {
  return {
    write(chunk: any) {
      const output = formatForConsole(chunk)
      // eslint-disable-next-line no-console
      console.log(output)
    }
  }
}

function createConsoleLogger(): LoggerLike {
  return {
    debug(data: any) {
      // eslint-disable-next-line no-console
      console.debug(formatForConsole(data))
    },
    info(data: any) {
      // eslint-disable-next-line no-console
      console.info(formatForConsole(data))
    },
    warn(data: any) {
      // eslint-disable-next-line no-console
      console.warn(formatForConsole(data))
    },
    error(data: any) {
      // eslint-disable-next-line no-console
      console.error(formatForConsole(data))
    }
  }
}

function loadPinoModule(): PinoModule | null {
  try {
    // eslint-disable-next-line global-require
    return require('pino') as PinoModule
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('pino module not found, using console-based logger fallback.', {
      error: error instanceof Error ? error.message : String(error)
    })
    return null
  }
}

const pinoModule = loadPinoModule()
const fallbackDestination = createConsoleDestination()

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
  /sk-[a-zA-Z0-9]{5,}/g, // OpenAI API keys
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
]

// Sanitize sensitive data from log objects
export function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data
    SENSITIVE_PATTERNS.forEach(pattern => {
      pattern.lastIndex = 0 // Reset regex state to avoid global flag issues
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })
    return sanitized
  }
  
  if (typeof data === 'object' && data !== null) {
    // Use JSON.stringify/parse to handle circular references safely
    try {
      const jsonString = JSON.stringify(data, (key, value) => {
        // Check if key matches sensitive patterns
        if (SENSITIVE_PATTERNS.some(pattern => {
          pattern.lastIndex = 0 // Reset regex state to avoid global flag issues
          return pattern.test(key)
        })) {
          return '[REDACTED]'
        }
        
        // Check if value is a string and contains sensitive data
        if (typeof value === 'string') {
          let sanitizedValue = value
          SENSITIVE_PATTERNS.forEach(pattern => {
            pattern.lastIndex = 0 // Reset regex state to avoid global flag issues
            sanitizedValue = sanitizedValue.replace(pattern, '[REDACTED]')
          })
          return sanitizedValue
        }
        
        return value
      })
      return JSON.parse(jsonString)
    } catch (error) {
      // If JSON.stringify fails due to circular reference, return a safe representation
      return '[Circular Reference]'
    }
  }
  
  return data
}

// Create logs directory structure
const logsDir = path.join(process.cwd(), 'logs')
const logsSubDirs = {
  application: path.join(logsDir, 'application'),
  api: path.join(logsDir, 'api'),
  translation: path.join(logsDir, 'translation'),
  tts: path.join(logsDir, 'tts'),
  errors: path.join(logsDir, 'errors'),
  performance: path.join(logsDir, 'performance'),
  security: path.join(logsDir, 'security')
} as const

function ensureWritableDirectory(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    } else {
      // Ensure we actually have write access to the existing directory
      fs.accessSync(dir, fs.constants.W_OK)
    }
    return true
  } catch (error) {
    return false
  }
}

// Environment detection (must be first)
const isDev = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

const fileLoggingEnabled = !isDev && ensureWritableDirectory(logsDir) &&
  Object.values(logsSubDirs).every(ensureWritableDirectory)

if (!fileLoggingEnabled && !isDev) {
  // eslint-disable-next-line no-console
  console.warn('File-based logging disabled: logs directory is not writable. Falling back to console logging only.')
}

// Base logger configuration
const baseConfig = {
  service: 'libran-voice-forge',
  env: process.env.NODE_ENV || 'development'
}

const prettyPrintOptions = {
  colorize: true,
  translateTime: 'SYS:standard',
  singleLine: false,
  messageKey: 'msg',
  ignore: 'service,env,event,ctx,err,corr_id,duration_ms,status,route,user_id'
} as const

function createPrettyStream(): PinoDestinationStream | null {
  if (!pinoModule || !isDev || isTest) {
    return null
  }

  // Skip pino transport in development to avoid worker path issues
  // Use direct pino-pretty instead
  try {
    // eslint-disable-next-line global-require
    const pretty = require('pino-pretty')
    if (typeof pretty === 'function') {
      return pretty(prettyPrintOptions)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('pino-pretty could not be loaded. Continuing without pretty logging.', {
      error: error instanceof Error ? error.message : String(error)
    })
  }

  return null
}

// Create rotating file streams
function getStdoutDestination(): PinoDestinationStream {
  if (pinoModule) {
    return pinoModule.destination(1)
  }

  return fallbackDestination
}

function createRotatingStream(logDir: string, filename: string): PinoDestinationStream {
  if (!pinoModule || !fileLoggingEnabled) {
    return getStdoutDestination() // stdout fallback when filesystem is read-only or pino missing
  }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const filePath = path.join(logDir, `${filename}-${today}.log`)

  return pinoModule.destination({
    dest: filePath,
    sync: false,
    minLength: 0,
    maxLength: 0
  })
}


// Create main logger with simple stream (no workers)
const logger = pinoModule ? pinoModule({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  base: baseConfig,
  timestamp: pinoModule.stdTimeFunctions?.isoTime ?? (() => new Date().toISOString()),
  formatters: {
    level(label: string) { return { level: label } }
  }

}, (() => {
  // Use simple destination to avoid worker issues
  if (isDev && !isTest) {
    // In development, use pino-pretty directly without transport
    try {
      const pretty = require('pino-pretty')
      return pretty({
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: false,
        messageKey: 'msg',
        ignore: 'service,env,event,ctx,err,corr_id,duration_ms,status,route,user_id'
      })
    } catch (error) {
      // Fallback to stdout if pino-pretty is not available
      console.warn('pino-pretty not available, using stdout')
      return getStdoutDestination()
    }
  } else {
    // In production, use file logging if available, otherwise stdout
    if (fileLoggingEnabled) {
      return createRotatingStream(logsSubDirs.application, 'application')
    } else {
      return getStdoutDestination()
    }
  }
})()) : createConsoleLogger()

// Note: We use the main logger with daily rotation instead of separate file loggers
// to avoid creating empty files and duplicate logging

// Log event types (SCREAMING_SNAKE_CASE)
export const LogEvents = {
  // API events
  API_REQUEST: 'API_REQUEST',
  API_RESPONSE: 'API_RESPONSE',
  API_ERROR: 'API_ERROR',
  
  // Translation events
  TRANSLATE_START: 'TRANSLATE_START',
  TRANSLATE_DONE: 'TRANSLATE_DONE',
  TRANSLATE_ERROR: 'TRANSLATE_ERROR',
  UNKNOWN_TOKEN: 'UNKNOWN_TOKEN',
  
  // TTS events
  TTS_START: 'TTS_START',
  TTS_DONE: 'TTS_DONE',
  TTS_ERROR: 'TTS_ERROR',
  TTS_CACHE_HIT: 'TTS_CACHE_HIT',
  TTS_CACHE_MISS: 'TTS_CACHE_MISS',
  TTS_RATE_LIMIT: 'TTS_RATE_LIMIT',
  
  // System events
  SERVICE_START: 'SERVICE_START',
  SERVICE_STOP: 'SERVICE_STOP',
  CONFIG_LOAD: 'CONFIG_LOAD',
  
  // Error events
  VALIDATION_FAIL: 'VALIDATION_FAIL',
  AUTH_FAIL: 'AUTH_FAIL',
  RATE_LIMIT: 'RATE_LIMIT',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // Performance events
  PERF_SLOW_QUERY: 'PERF_SLOW_QUERY',
  PERF_HIGH_MEMORY: 'PERF_HIGH_MEMORY',
  PERF_CACHE_MISS: 'PERF_CACHE_MISS',
  
  // Security events
  SEC_AUTH_FAIL: 'SEC_AUTH_FAIL',
  SEC_RATE_LIMIT: 'SEC_RATE_LIMIT',
  SEC_SUSPICIOUS: 'SEC_SUSPICIOUS'
} as const

// Error types for err object
export const ErrorTypes = {
  VALIDATION_ERROR: 'validation_error',
  AUTH_ERROR: 'auth_error',
  RATE_LIMIT: 'rate_limit',
  EXTERNAL_API: 'external_api',
  INTERNAL: 'internal',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  CONFIG: 'config'
} as const

// Normalize log data to our schema
function normalizeLogData(data: any): any {
  const sanitized = sanitizeLogData(data)
  
  // Convert duration from seconds to milliseconds
  if (sanitized.duration && typeof sanitized.duration === 'number') {
    sanitized.duration_ms = Math.round(sanitized.duration * 1000)
    delete sanitized.duration
  }
  
  return sanitized
}

// Generate correlation ID
export function generateCorrelationId(): string {
  // Generate a consistent 26-character correlation ID
  const part1 = Math.random().toString(36).substring(2, 15).padEnd(13, '0')
  const part2 = Math.random().toString(36).substring(2, 15).padEnd(13, '0')
  return part1 + part2
}

// Main logging interface
export const log = {
  // Basic logging methods
  debug: (msg: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    logger.debug(normalizeLogData({ ...normalized, msg }))
  },
  
  info: (msg: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    logger.info(normalizeLogData({ ...normalized, msg }))
  },
  
  warn: (msg: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    logger.warn(normalizeLogData({ ...normalized, msg }))
  },
  
  error: (msg: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    logger.error(normalizeLogData({ ...normalized, msg }))
  },

  // Structured logging methods
  apiRequest: (method: string, url: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.API_REQUEST,
      corr_id: corrId,
      route: url.replace(/\/api\/[^\/]+\/[^\/]+/g, '/api/[endpoint]/[id]'), // Sanitize dynamic URLs
      ctx: {
        method,
        url: url.replace(/\/api\/[^\/]+\/[^\/]+/g, '/api/[endpoint]/[id]'),
        ...normalized
      }
    }
    logger.info(normalizeLogData({ ...logData, msg: 'API Request' }))
  },

  apiResponse: (method: string, url: string, statusCode: number, durationMs: number, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.API_RESPONSE,
      corr_id: corrId,
      status: statusCode,
      duration_ms: durationMs,
      route: url.replace(/\/api\/[^\/]+\/[^\/]+/g, '/api/[endpoint]/[id]'),
      ctx: {
        method,
        url: url.replace(/\/api\/[^\/]+\/[^\/]+/g, '/api/[endpoint]/[id]'),
        ...normalized
      }
    }
    logger.info(normalizeLogData({ ...logData, msg: 'API Response' }))
  },

  translation: (text: string, variant: string, result: string, confidence: number, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.TRANSLATE_DONE,
      corr_id: corrId,
      ctx: {
        variant,
        text_length: text.length,
        result_length: result.length,
        confidence,
        words_total: text.split(/\s+/).length,
        words_translated: result.split(/\s+/).length,
        words_unknown: (normalized.unknownWords || 0),
        ...normalized
      }
    }
    logger.info(normalizeLogData({ ...logData, msg: 'Translation completed' }))
  },

  tts: (text: string, voice: string, durationMs: number, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.TTS_DONE,
      corr_id: corrId,
      duration_ms: durationMs,
      ctx: {
        voice,
        text_length: text.length,
        ...normalized
      }
    }
    logger.info(normalizeLogData({ ...logData, msg: 'TTS Generation completed' }))
  },

  ttsCacheHit: (text: string, voice: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.TTS_CACHE_HIT,
      corr_id: corrId,
      ctx: {
        voice,
        text_length: text.length,
        ...normalized
      }
    }
    logger.info(normalizeLogData({ ...logData, msg: 'TTS Cache Hit' }))
  },

  ttsRateLimit: (text: string, voice: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.TTS_RATE_LIMIT,
      corr_id: corrId,
      status: 429,
      err: {
        type: ErrorTypes.RATE_LIMIT,
        code: 'RATE_LIMIT',
        msg: 'TTS request throttled'
      },
      ctx: {
        voice,
        text_length: text.length,
        ...normalized
      }
    }
    logger.error(normalizeLogData({ ...logData, msg: 'TTS request throttled' }))
  },

  unknownToken: (token: string, variant: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.UNKNOWN_TOKEN,
      corr_id: corrId,
      ctx: {
        token,
        variant,
        ...normalized
      }
    }
    logger.warn(normalizeLogData({ ...logData, msg: 'Unknown token encountered' }))
  },

  validationFail: (field: string, reason: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.VALIDATION_FAIL,
      corr_id: corrId,
      status: 400,
      err: {
        type: ErrorTypes.VALIDATION_ERROR,
        msg: 'Invalid input'
      },
      ctx: {
        field,
        reason,
        ...normalized
      }
    }
    logger.warn(normalizeLogData({ ...logData, msg: 'Validation failed' }))
  },

  errorWithContext: (error: Error, event: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event,
      corr_id: corrId,
      err: {
        type: ErrorTypes.INTERNAL,
        msg: error.message,
        stack: error.stack
      },
      ctx: {
        error_name: error.name,
        ...normalized
      }
    }
    logger.error(normalizeLogData({ ...logData, msg: 'Error occurred' }))
  },

  performance: (operation: string, durationMs: number, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.PERF_SLOW_QUERY,
      corr_id: corrId,
      duration_ms: durationMs,
      ctx: {
        operation,
        ...normalized
      }
    }
    logger.info(normalizeLogData({ ...logData, msg: 'Performance metric' }))
  },

  security: (event: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event,
      corr_id: corrId,
      ctx: {
        ...normalized
      }
    }
    logger.warn(normalizeLogData({ ...logData, msg: 'Security event' }))
  },

  // Legacy compatibility methods
  http: (msg: string, data?: any) => log.info(`[HTTP] ${msg}`, data),
  
  errorTaxonomy: (errorCode: string, userMessage: string, category: string, severity: string, corrId: string, data?: any) => {
    const normalized = normalizeLogData(data || {})
    const logData = {
      event: LogEvents.INTERNAL_ERROR,
      corr_id: corrId,
      err: {
        type: ErrorTypes.INTERNAL,
        code: errorCode,
        msg: userMessage
      },
      ctx: {
        category,
        severity,
        ...normalized
      }
    }
    logger.error(normalizeLogData({ ...logData, msg: 'Error Taxonomy' }))
  },

  withCorrelationId: (correlationId: string, data?: any) => {
    return {
      corr_id: correlationId,
      ...normalizeLogData(data || {})
    }
  }
}

export default logger