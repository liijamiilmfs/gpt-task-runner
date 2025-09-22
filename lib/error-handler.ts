/**
 * Frontend Error Handler for Librán Voice Forge
 * 
 * Provides utilities for handling API errors and displaying user-friendly messages
 */

export interface ApiError {
  error: string
  code?: string
  requestId?: string
  retryable?: boolean
  retryAfter?: number
}

export interface ErrorDisplay {
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  retryable: boolean
  retryAfter?: number
  requestId?: string
}

/**
 * Map API error codes to user-friendly display information
 */
const ERROR_DISPLAY_MAP: Record<string, Omit<ErrorDisplay, 'requestId' | 'retryAfter'>> = {
  // Validation errors
  'VALIDATION_MISSING_TEXT': {
    title: 'Missing Text',
    message: 'Please enter some text to translate',
    severity: 'info',
    retryable: false
  },
  'VALIDATION_INVALID_TEXT': {
    title: 'Invalid Text',
    message: 'Please provide valid text to translate',
    severity: 'warning',
    retryable: false
  },
  'VALIDATION_INVALID_VARIANT': {
    title: 'Invalid Language Variant',
    message: 'Please select either Ancient or Modern Librán variant',
    severity: 'info',
    retryable: false
  },
  'VALIDATION_INVALID_VOICE': {
    title: 'Invalid Voice',
    message: 'Please select a valid voice option',
    severity: 'warning',
    retryable: false
  },
  'VALIDATION_INVALID_FORMAT': {
    title: 'Invalid Audio Format',
    message: 'Please select a valid audio format (MP3, WAV, or FLAC)',
    severity: 'warning',
    retryable: false
  },
  'VALIDATION_TEXT_TOO_LONG': {
    title: 'Text Too Long',
    message: 'Text is too long. Please shorten your input and try again',
    severity: 'warning',
    retryable: false
  },
  'VALIDATION_EMPTY_INPUT': {
    title: 'Empty Input',
    message: 'Please enter some text before translating',
    severity: 'info',
    retryable: false
  },

  // Translation errors
  'TRANSLATION_FAILED': {
    title: 'Translation Failed',
    message: 'Translation failed. Please try again or contact support if the issue persists',
    severity: 'error',
    retryable: true
  },
  'TRANSLATION_DICTIONARY_LOAD': {
    title: 'Translation Service Unavailable',
    message: 'Translation service is temporarily unavailable. Please try again later',
    severity: 'error',
    retryable: true
  },
  'TRANSLATION_TOKENIZATION': {
    title: 'Text Processing Error',
    message: 'Unable to process the text. Please check your input and try again',
    severity: 'warning',
    retryable: true
  },

  // TTS errors
  'TTS_GENERATION_FAILED': {
    title: 'Audio Generation Failed',
    message: 'Audio generation failed. Please try again or contact support if the issue persists',
    severity: 'error',
    retryable: true
  },
  'TTS_OPENAI_ERROR': {
    title: 'Voice Service Unavailable',
    message: 'Voice generation service is temporarily unavailable. Please try again later',
    severity: 'error',
    retryable: true
  },
  'TTS_CACHE_ERROR': {
    title: 'Audio Processing Slow',
    message: 'Audio generation may be slower than usual. Please try again',
    severity: 'warning',
    retryable: true
  },
  'TTS_AUDIO_PROCESSING': {
    title: 'Audio Processing Error',
    message: 'Failed to process audio. Please try again',
    severity: 'warning',
    retryable: true
  },

  // Rate limiting
  'RATE_LIMIT_EXCEEDED': {
    title: 'Too Many Requests',
    message: 'Too many requests. Please wait a moment before trying again',
    severity: 'warning',
    retryable: true
  },
  'RATE_LIMIT_DAILY_EXCEEDED': {
    title: 'Daily Limit Reached',
    message: 'Daily request limit reached. Please try again tomorrow',
    severity: 'error',
    retryable: false
  },
  'RATE_LIMIT_MONTHLY_EXCEEDED': {
    title: 'Monthly Limit Reached',
    message: 'Monthly request limit reached. Please try again next month',
    severity: 'error',
    retryable: false
  },

  // Budget limits
  'BUDGET_DAILY_EXCEEDED': {
    title: 'Daily Usage Limit',
    message: 'Daily usage limit reached. Please try again tomorrow',
    severity: 'error',
    retryable: false
  },
  'BUDGET_MONTHLY_EXCEEDED': {
    title: 'Monthly Usage Limit',
    message: 'Monthly usage limit reached. Please try again next month',
    severity: 'error',
    retryable: false
  },
  'BUDGET_CHARACTER_LIMIT': {
    title: 'Text Too Long',
    message: 'Text is too long for a single request. Please split into smaller chunks',
    severity: 'warning',
    retryable: false
  },

  // External API errors
  'OPENAI_API_ERROR': {
    title: 'Voice Service Error',
    message: 'Voice generation service is temporarily unavailable. Please try again later',
    severity: 'error',
    retryable: true
  },
  'OPENAI_QUOTA_EXCEEDED': {
    title: 'Service Quota Exceeded',
    message: 'Service quota exceeded. Please try again later',
    severity: 'error',
    retryable: true
  },
  'OPENAI_RATE_LIMIT': {
    title: 'Voice Service Busy',
    message: 'Voice service is busy. Please wait a moment and try again',
    severity: 'warning',
    retryable: true
  },
  'OPENAI_AUTHENTICATION': {
    title: 'Service Authentication Error',
    message: 'Voice service authentication error. Please contact support',
    severity: 'critical',
    retryable: false
  },

  // Internal errors
  'INTERNAL_SERVER_ERROR': {
    title: 'Server Error',
    message: 'An unexpected error occurred. Please try again or contact support',
    severity: 'error',
    retryable: true
  },
  'INTERNAL_CACHE_ERROR': {
    title: 'Service Slow',
    message: 'Service may be slower than usual. Please try again',
    severity: 'warning',
    retryable: true
  },
  'INTERNAL_METRICS_ERROR': {
    title: 'Service Working',
    message: 'Service is working but metrics collection failed',
    severity: 'info',
    retryable: true
  },

  // Network errors
  'NETWORK_TIMEOUT': {
    title: 'Request Timeout',
    message: 'Request timed out. Please check your connection and try again',
    severity: 'warning',
    retryable: true
  },
  'NETWORK_CONNECTION': {
    title: 'Connection Error',
    message: 'Connection error. Please check your internet connection and try again',
    severity: 'warning',
    retryable: true
  },
  'NETWORK_DNS': {
    title: 'Network Error',
    message: 'Network error. Please try again later',
    severity: 'warning',
    retryable: true
  }
}

/**
 * Convert an API error response to user-friendly display information
 */
export function handleApiError(apiError: ApiError): ErrorDisplay {
  const displayInfo = ERROR_DISPLAY_MAP[apiError.code || ''] || {
    title: 'Error',
    message: apiError.error || 'An unexpected error occurred',
    severity: 'error' as const,
    retryable: apiError.retryable || false
  }

  return {
    ...displayInfo,
    requestId: apiError.requestId,
    retryAfter: apiError.retryAfter
  }
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(errorDisplay: ErrorDisplay): number {
  if (!errorDisplay.retryable) return 0
  
  // Use provided retryAfter if available
  if (errorDisplay.retryAfter) {
    return errorDisplay.retryAfter
  }
  
  // Default retry delays based on severity
  switch (errorDisplay.severity) {
    case 'info':
      return 1000 // 1 second
    case 'warning':
      return 3000 // 3 seconds
    case 'error':
      return 10000 // 10 seconds
    case 'critical':
      return 30000 // 30 seconds
    default:
      return 5000 // 5 seconds
  }
}

/**
 * Format retry delay for display
 */
export function formatRetryDelay(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${Math.ceil(ms / 1000)}s`
  } else {
    const minutes = Math.ceil(ms / 60000)
    return `${minutes}m`
  }
}

/**
 * Check if an error should show a retry button
 */
export function shouldShowRetry(errorDisplay: ErrorDisplay): boolean {
  return errorDisplay.retryable && errorDisplay.severity !== 'critical'
}

/**
 * Get CSS classes for error display based on severity
 */
export function getErrorClasses(severity: ErrorDisplay['severity']): string {
  const baseClasses = 'p-4 rounded-lg border'
  
  switch (severity) {
    case 'info':
      return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`
    case 'warning':
      return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`
    case 'error':
      return `${baseClasses} bg-red-50 border-red-200 text-red-800`
    case 'critical':
      return `${baseClasses} bg-red-100 border-red-300 text-red-900 font-semibold`
    default:
      return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`
  }
}
