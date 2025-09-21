/**
 * Error Taxonomy System for Librán Voice Forge
 * 
 * Provides standardized error handling with:
 * - Correlation IDs for tracking
 * - User-friendly error messages
 * - Structured error logging
 * - Error categorization and mapping
 */

export interface ErrorContext {
  requestId?: string
  userId?: string
  operation?: string
  timestamp?: string
  [key: string]: any
}

export interface ErrorDetails {
  code: string
  message: string
  userMessage: string
  category: ErrorCategory
  severity: ErrorSeverity
  retryable: boolean
  context?: ErrorContext
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  BUDGET_LIMIT = 'budget_limit',
  TRANSLATION = 'translation',
  TTS = 'tts',
  CACHE = 'cache',
  EXTERNAL_API = 'external_api',
  INTERNAL = 'internal',
  NETWORK = 'network',
  TIMEOUT = 'timeout'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCode {
  // Validation Errors (4xx)
  VALIDATION_MISSING_TEXT = 'VALIDATION_MISSING_TEXT',
  VALIDATION_INVALID_TEXT = 'VALIDATION_INVALID_TEXT',
  VALIDATION_INVALID_VARIANT = 'VALIDATION_INVALID_VARIANT',
  VALIDATION_INVALID_VOICE = 'VALIDATION_INVALID_VOICE',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_TEXT_TOO_LONG = 'VALIDATION_TEXT_TOO_LONG',
  VALIDATION_EMPTY_INPUT = 'VALIDATION_EMPTY_INPUT',
  
  // Translation Errors (5xx)
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',
  TRANSLATION_DICTIONARY_LOAD = 'TRANSLATION_DICTIONARY_LOAD',
  TRANSLATION_TOKENIZATION = 'TRANSLATION_TOKENIZATION',
  
  // TTS Errors (5xx)
  TTS_GENERATION_FAILED = 'TTS_GENERATION_FAILED',
  TTS_OPENAI_ERROR = 'TTS_OPENAI_ERROR',
  TTS_CACHE_ERROR = 'TTS_CACHE_ERROR',
  TTS_AUDIO_PROCESSING = 'TTS_AUDIO_PROCESSING',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_DAILY_EXCEEDED = 'RATE_LIMIT_DAILY_EXCEEDED',
  RATE_LIMIT_MONTHLY_EXCEEDED = 'RATE_LIMIT_MONTHLY_EXCEEDED',
  
  // Budget Limits (429)
  BUDGET_DAILY_EXCEEDED = 'BUDGET_DAILY_EXCEEDED',
  BUDGET_MONTHLY_EXCEEDED = 'BUDGET_MONTHLY_EXCEEDED',
  BUDGET_CHARACTER_LIMIT = 'BUDGET_CHARACTER_LIMIT',
  
  // External API Errors (5xx)
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  OPENAI_QUOTA_EXCEEDED = 'OPENAI_QUOTA_EXCEEDED',
  OPENAI_RATE_LIMIT = 'OPENAI_RATE_LIMIT',
  OPENAI_AUTHENTICATION = 'OPENAI_AUTHENTICATION',
  
  // Internal Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INTERNAL_CACHE_ERROR = 'INTERNAL_CACHE_ERROR',
  INTERNAL_METRICS_ERROR = 'INTERNAL_METRICS_ERROR',
  
  // Network Errors (5xx)
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION = 'NETWORK_CONNECTION',
  NETWORK_DNS = 'NETWORK_DNS'
}

// Error definitions with user-friendly messages
const ERROR_DEFINITIONS: Record<ErrorCode, Omit<ErrorDetails, 'context'>> = {
  // Validation Errors
  [ErrorCode.VALIDATION_MISSING_TEXT]: {
    code: ErrorCode.VALIDATION_MISSING_TEXT,
    message: 'Text is required and must be a string',
    userMessage: 'Please enter some text to translate',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false
  },
  [ErrorCode.VALIDATION_INVALID_TEXT]: {
    code: ErrorCode.VALIDATION_INVALID_TEXT,
    message: 'Invalid text format provided',
    userMessage: 'Please provide valid text to translate',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false
  },
  [ErrorCode.VALIDATION_INVALID_VARIANT]: {
    code: ErrorCode.VALIDATION_INVALID_VARIANT,
    message: 'Variant must be either "ancient" or "modern"',
    userMessage: 'Please select either Ancient or Modern Librán variant',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false
  },
  [ErrorCode.VALIDATION_INVALID_VOICE]: {
    code: ErrorCode.VALIDATION_INVALID_VOICE,
    message: 'Invalid voice parameter',
    userMessage: 'Please select a valid voice option',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false
  },
  [ErrorCode.VALIDATION_INVALID_FORMAT]: {
    code: ErrorCode.VALIDATION_INVALID_FORMAT,
    message: 'Invalid format parameter',
    userMessage: 'Please select a valid audio format (MP3, WAV, or FLAC)',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false
  },
  [ErrorCode.VALIDATION_TEXT_TOO_LONG]: {
    code: ErrorCode.VALIDATION_TEXT_TOO_LONG,
    message: 'Text exceeds maximum length limit',
    userMessage: 'Text is too long. Please shorten your input and try again',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false
  },
  [ErrorCode.VALIDATION_EMPTY_INPUT]: {
    code: ErrorCode.VALIDATION_EMPTY_INPUT,
    message: 'Empty input provided',
    userMessage: 'Please enter some text before translating',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false
  },

  // Translation Errors
  [ErrorCode.TRANSLATION_FAILED]: {
    code: ErrorCode.TRANSLATION_FAILED,
    message: 'Translation process failed',
    userMessage: 'Translation failed. Please try again or contact support if the issue persists',
    category: ErrorCategory.TRANSLATION,
    severity: ErrorSeverity.HIGH,
    retryable: true
  },
  [ErrorCode.TRANSLATION_DICTIONARY_LOAD]: {
    code: ErrorCode.TRANSLATION_DICTIONARY_LOAD,
    message: 'Failed to load translation dictionary',
    userMessage: 'Translation service is temporarily unavailable. Please try again later',
    category: ErrorCategory.TRANSLATION,
    severity: ErrorSeverity.HIGH,
    retryable: true
  },
  [ErrorCode.TRANSLATION_TOKENIZATION]: {
    code: ErrorCode.TRANSLATION_TOKENIZATION,
    message: 'Failed to tokenize input text',
    userMessage: 'Unable to process the text. Please check your input and try again',
    category: ErrorCategory.TRANSLATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },

  // TTS Errors
  [ErrorCode.TTS_GENERATION_FAILED]: {
    code: ErrorCode.TTS_GENERATION_FAILED,
    message: 'TTS generation failed',
    userMessage: 'Audio generation failed. Please try again or contact support if the issue persists',
    category: ErrorCategory.TTS,
    severity: ErrorSeverity.HIGH,
    retryable: true
  },
  [ErrorCode.TTS_OPENAI_ERROR]: {
    code: ErrorCode.TTS_OPENAI_ERROR,
    message: 'OpenAI TTS service error',
    userMessage: 'Voice generation service is temporarily unavailable. Please try again later',
    category: ErrorCategory.TTS,
    severity: ErrorSeverity.HIGH,
    retryable: true
  },
  [ErrorCode.TTS_CACHE_ERROR]: {
    code: ErrorCode.TTS_CACHE_ERROR,
    message: 'TTS cache operation failed',
    userMessage: 'Audio generation may be slower than usual. Please try again',
    category: ErrorCategory.TTS,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },
  [ErrorCode.TTS_AUDIO_PROCESSING]: {
    code: ErrorCode.TTS_AUDIO_PROCESSING,
    message: 'Audio processing failed',
    userMessage: 'Failed to process audio. Please try again',
    category: ErrorCategory.TTS,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please wait a moment before trying again',
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },
  [ErrorCode.RATE_LIMIT_DAILY_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_DAILY_EXCEEDED,
    message: 'Daily rate limit exceeded',
    userMessage: 'Daily request limit reached. Please try again tomorrow',
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.HIGH,
    retryable: false
  },
  [ErrorCode.RATE_LIMIT_MONTHLY_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_MONTHLY_EXCEEDED,
    message: 'Monthly rate limit exceeded',
    userMessage: 'Monthly request limit reached. Please try again next month',
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.HIGH,
    retryable: false
  },

  // Budget Limits
  [ErrorCode.BUDGET_DAILY_EXCEEDED]: {
    code: ErrorCode.BUDGET_DAILY_EXCEEDED,
    message: 'Daily budget limit exceeded',
    userMessage: 'Daily usage limit reached. Please try again tomorrow',
    category: ErrorCategory.BUDGET_LIMIT,
    severity: ErrorSeverity.HIGH,
    retryable: false
  },
  [ErrorCode.BUDGET_MONTHLY_EXCEEDED]: {
    code: ErrorCode.BUDGET_MONTHLY_EXCEEDED,
    message: 'Monthly budget limit exceeded',
    userMessage: 'Monthly usage limit reached. Please try again next month',
    category: ErrorCategory.BUDGET_LIMIT,
    severity: ErrorSeverity.HIGH,
    retryable: false
  },
  [ErrorCode.BUDGET_CHARACTER_LIMIT]: {
    code: ErrorCode.BUDGET_CHARACTER_LIMIT,
    message: 'Character limit exceeded for single request',
    userMessage: 'Text is too long for a single request. Please split into smaller chunks',
    category: ErrorCategory.BUDGET_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    retryable: false
  },

  // External API Errors
  [ErrorCode.OPENAI_API_ERROR]: {
    code: ErrorCode.OPENAI_API_ERROR,
    message: 'OpenAI API error',
    userMessage: 'Voice generation service is temporarily unavailable. Please try again later',
    category: ErrorCategory.EXTERNAL_API,
    severity: ErrorSeverity.HIGH,
    retryable: true
  },
  [ErrorCode.OPENAI_QUOTA_EXCEEDED]: {
    code: ErrorCode.OPENAI_QUOTA_EXCEEDED,
    message: 'OpenAI quota exceeded',
    userMessage: 'Service quota exceeded. Please try again later',
    category: ErrorCategory.EXTERNAL_API,
    severity: ErrorSeverity.HIGH,
    retryable: true
  },
  [ErrorCode.OPENAI_RATE_LIMIT]: {
    code: ErrorCode.OPENAI_RATE_LIMIT,
    message: 'OpenAI rate limit exceeded',
    userMessage: 'Voice service is busy. Please wait a moment and try again',
    category: ErrorCategory.EXTERNAL_API,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },
  [ErrorCode.OPENAI_AUTHENTICATION]: {
    code: ErrorCode.OPENAI_AUTHENTICATION,
    message: 'OpenAI authentication failed',
    userMessage: 'Voice service authentication error. Please contact support',
    category: ErrorCategory.EXTERNAL_API,
    severity: ErrorSeverity.CRITICAL,
    retryable: false
  },

  // Internal Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    userMessage: 'An unexpected error occurred. Please try again or contact support',
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.CRITICAL,
    retryable: true
  },
  [ErrorCode.INTERNAL_CACHE_ERROR]: {
    code: ErrorCode.INTERNAL_CACHE_ERROR,
    message: 'Cache operation failed',
    userMessage: 'Service may be slower than usual. Please try again',
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },
  [ErrorCode.INTERNAL_METRICS_ERROR]: {
    code: ErrorCode.INTERNAL_METRICS_ERROR,
    message: 'Metrics collection failed',
    userMessage: 'Service is working but metrics collection failed',
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.LOW,
    retryable: true
  },

  // Network Errors
  [ErrorCode.NETWORK_TIMEOUT]: {
    code: ErrorCode.NETWORK_TIMEOUT,
    message: 'Network timeout',
    userMessage: 'Request timed out. Please check your connection and try again',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },
  [ErrorCode.NETWORK_CONNECTION]: {
    code: ErrorCode.NETWORK_CONNECTION,
    message: 'Network connection error',
    userMessage: 'Connection error. Please check your internet connection and try again',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  },
  [ErrorCode.NETWORK_DNS]: {
    code: ErrorCode.NETWORK_DNS,
    message: 'DNS resolution failed',
    userMessage: 'Network error. Please try again later',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    retryable: true
  }
}

export class ErrorTaxonomy {
  /**
   * Create a standardized error with correlation ID and context
   */
  static createError(
    errorCode: ErrorCode,
    context?: ErrorContext,
    originalError?: Error
  ): ErrorDetails {
    const definition = ERROR_DEFINITIONS[errorCode]
    if (!definition) {
      throw new Error(`Unknown error code: ${errorCode}`)
    }

    return {
      ...definition,
      context: {
        requestId: this.generateCorrelationId(),
        timestamp: new Date().toISOString(),
        ...context
      }
    }
  }

  /**
   * Generate a correlation ID for request tracking
   */
  static generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Map HTTP status codes to error categories
   */
  static getStatusFromCategory(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 400
      case ErrorCategory.AUTHENTICATION:
        return 401
      case ErrorCategory.AUTHORIZATION:
        return 403
      case ErrorCategory.RATE_LIMIT:
      case ErrorCategory.BUDGET_LIMIT:
        return 429
      case ErrorCategory.TRANSLATION:
      case ErrorCategory.TTS:
      case ErrorCategory.CACHE:
      case ErrorCategory.EXTERNAL_API:
      case ErrorCategory.INTERNAL:
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
        return 500
      default:
        return 500
    }
  }

  /**
   * Get retry delay based on error category and severity
   */
  static getRetryDelay(category: ErrorCategory, severity: ErrorSeverity): number {
    if (category === ErrorCategory.RATE_LIMIT || category === ErrorCategory.BUDGET_LIMIT) {
      return 60000 // 1 minute
    }
    
    if (category === ErrorCategory.EXTERNAL_API) {
      return 5000 // 5 seconds
    }
    
    switch (severity) {
      case ErrorSeverity.LOW:
        return 1000 // 1 second
      case ErrorSeverity.MEDIUM:
        return 3000 // 3 seconds
      case ErrorSeverity.HIGH:
        return 10000 // 10 seconds
      case ErrorSeverity.CRITICAL:
        return 30000 // 30 seconds
      default:
        return 5000 // 5 seconds
    }
  }

  /**
   * Check if an error should be retried
   */
  static shouldRetry(errorDetails: ErrorDetails): boolean {
    return errorDetails.retryable && 
           errorDetails.severity !== ErrorSeverity.CRITICAL
  }

  /**
   * Get all errors by category
   */
  static getErrorsByCategory(category: ErrorCategory): ErrorCode[] {
    return Object.keys(ERROR_DEFINITIONS).filter(
      code => ERROR_DEFINITIONS[code as ErrorCode].category === category
    ) as ErrorCode[]
  }

  /**
   * Get all errors by severity
   */
  static getErrorsBySeverity(severity: ErrorSeverity): ErrorCode[] {
    return Object.keys(ERROR_DEFINITIONS).filter(
      code => ERROR_DEFINITIONS[code as ErrorCode].severity === severity
    ) as ErrorCode[]
  }
}

/**
 * Utility function to create error responses for API routes
 */
export function createErrorResponse(
  errorCode: ErrorCode,
  context?: ErrorContext,
  originalError?: Error
) {
  const errorDetails = ErrorTaxonomy.createError(errorCode, context, originalError)
  const statusCode = ErrorTaxonomy.getStatusFromCategory(errorDetails.category)
  
  return {
    status: statusCode,
    body: {
      error: errorDetails.userMessage,
      code: errorDetails.code,
      requestId: errorDetails.context?.requestId,
      retryable: errorDetails.retryable,
      retryAfter: errorDetails.retryable ? ErrorTaxonomy.getRetryDelay(errorDetails.category, errorDetails.severity) : undefined
    }
  }
}
