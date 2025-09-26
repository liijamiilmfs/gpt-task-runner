import { ErrorCodes, ErrorInfo } from '../types';

export interface ErrorTaxonomyEntry {
  code: ErrorCodes;
  userMessage: string;
  technicalMessage: string;
  isRetryable: boolean;
  suggestedAction: string;
  documentationUrl?: string;
  httpStatus?: number;
  category:
    | 'API'
    | 'FILE'
    | 'VALIDATION'
    | 'CONFIG'
    | 'SYSTEM'
    | 'BUSINESS'
    | 'GENERIC';
}

export class ErrorTaxonomy {
  private static readonly TAXONOMY: Record<ErrorCodes, ErrorTaxonomyEntry> = {
    // API and Transport Errors
    [ErrorCodes.RATE_LIMIT]: {
      code: ErrorCodes.RATE_LIMIT,
      userMessage:
        'Request rate limit exceeded. Please wait before making more requests.',
      technicalMessage: 'Rate limit exceeded',
      isRetryable: true,
      suggestedAction:
        'Wait a few minutes before retrying. Consider reducing batch size or request frequency.',
      documentationUrl: 'https://platform.openai.com/docs/guides/rate-limits',
      httpStatus: 429,
      category: 'API',
    },
    [ErrorCodes.TIMEOUT]: {
      code: ErrorCodes.TIMEOUT,
      userMessage:
        'Request timed out. The operation took too long to complete.',
      technicalMessage: 'Request timeout',
      isRetryable: true,
      suggestedAction:
        'Retry the operation. If persistent, check network connection or increase timeout settings.',
      category: 'API',
    },
    [ErrorCodes.AUTH]: {
      code: ErrorCodes.AUTH,
      userMessage:
        'Authentication failed. Please check your API key and permissions.',
      technicalMessage: 'Authentication failed',
      isRetryable: false,
      suggestedAction:
        'Verify your API key is correct and has the necessary permissions. Check your OpenAI account status.',
      documentationUrl:
        'https://platform.openai.com/docs/api-reference/authentication',
      httpStatus: 401,
      category: 'API',
    },
    [ErrorCodes.INPUT]: {
      code: ErrorCodes.INPUT,
      userMessage:
        'Invalid input provided. Please check your request format and content.',
      technicalMessage: 'Invalid input or bad request',
      isRetryable: false,
      suggestedAction:
        'Review your input data format. Ensure required fields are provided and values are valid.',
      httpStatus: 400,
      category: 'API',
    },
    [ErrorCodes.QUOTA]: {
      code: ErrorCodes.QUOTA,
      userMessage:
        'Quota exceeded or billing issue. Please check your account limits.',
      technicalMessage: 'Quota exceeded or billing issue',
      isRetryable: false,
      suggestedAction:
        'Check your OpenAI account billing and usage limits. Upgrade your plan if needed.',
      documentationUrl: 'https://platform.openai.com/account/billing',
      category: 'API',
    },
    [ErrorCodes.SERVER_ERROR]: {
      code: ErrorCodes.SERVER_ERROR,
      userMessage:
        'Server error occurred. The service is temporarily unavailable.',
      technicalMessage: 'Server error',
      isRetryable: true,
      suggestedAction:
        'Retry after a few minutes. If the issue persists, check OpenAI status page.',
      documentationUrl: 'https://status.openai.com/',
      httpStatus: 500,
      category: 'API',
    },
    [ErrorCodes.NETWORK]: {
      code: ErrorCodes.NETWORK,
      userMessage:
        'Network connection error. Please check your internet connection.',
      technicalMessage: 'Network error',
      isRetryable: true,
      suggestedAction:
        'Check your internet connection and firewall settings. Retry the operation.',
      category: 'API',
    },

    // File and I/O Errors
    [ErrorCodes.FILE_NOT_FOUND]: {
      code: ErrorCodes.FILE_NOT_FOUND,
      userMessage:
        'File not found. Please check the file path and ensure the file exists.',
      technicalMessage: 'File not found',
      isRetryable: false,
      suggestedAction:
        'Verify the file path is correct and the file exists. Check file permissions.',
      category: 'FILE',
    },
    [ErrorCodes.FILE_PERMISSION]: {
      code: ErrorCodes.FILE_PERMISSION,
      userMessage:
        'Permission denied. You do not have access to read or write this file.',
      technicalMessage: 'File permission denied',
      isRetryable: false,
      suggestedAction:
        'Check file permissions and ensure you have read/write access. Try running with elevated permissions if needed.',
      category: 'FILE',
    },
    [ErrorCodes.FILE_FORMAT]: {
      code: ErrorCodes.FILE_FORMAT,
      userMessage:
        'Invalid file format. The file format is not supported or corrupted.',
      technicalMessage: 'Invalid file format',
      isRetryable: false,
      suggestedAction:
        'Ensure the file is in the correct format (CSV or JSONL). Check file encoding and structure.',
      category: 'FILE',
    },
    [ErrorCodes.FILE_CORRUPT]: {
      code: ErrorCodes.FILE_CORRUPT,
      userMessage: 'File is corrupted or contains invalid data.',
      technicalMessage: 'File corruption detected',
      isRetryable: false,
      suggestedAction:
        'Verify file integrity. Try recreating the file or use a backup.',
      category: 'FILE',
    },

    // Validation Errors
    [ErrorCodes.VALIDATION]: {
      code: ErrorCodes.VALIDATION,
      userMessage: 'Data validation failed. Please check your input data.',
      technicalMessage: 'Validation error',
      isRetryable: false,
      suggestedAction:
        'Review input data against the expected schema. Fix any validation errors.',
      category: 'VALIDATION',
    },
    [ErrorCodes.SCHEMA]: {
      code: ErrorCodes.SCHEMA,
      userMessage:
        'Data schema mismatch. The data structure does not match the expected format.',
      technicalMessage: 'Schema validation failed',
      isRetryable: false,
      suggestedAction:
        'Ensure your data matches the expected schema. Check field names and types.',
      category: 'VALIDATION',
    },
    [ErrorCodes.REQUIRED_FIELD]: {
      code: ErrorCodes.REQUIRED_FIELD,
      userMessage:
        'Required field is missing. Please provide all required information.',
      technicalMessage: 'Required field missing',
      isRetryable: false,
      suggestedAction: 'Add the missing required field(s) to your input data.',
      category: 'VALIDATION',
    },
    [ErrorCodes.INVALID_FORMAT]: {
      code: ErrorCodes.INVALID_FORMAT,
      userMessage:
        'Invalid data format. Please check the format of your input.',
      technicalMessage: 'Invalid format',
      isRetryable: false,
      suggestedAction:
        'Check the format of your input data. Ensure it matches the expected format.',
      category: 'VALIDATION',
    },

    // Configuration Errors
    [ErrorCodes.CONFIG]: {
      code: ErrorCodes.CONFIG,
      userMessage:
        'Configuration error. Please check your settings and configuration files.',
      technicalMessage: 'Configuration error',
      isRetryable: false,
      suggestedAction:
        'Review your configuration files and environment variables. Ensure all required settings are provided.',
      category: 'CONFIG',
    },
    [ErrorCodes.CONFIG_MISSING]: {
      code: ErrorCodes.CONFIG_MISSING,
      userMessage:
        'Required configuration is missing. Please provide the necessary configuration.',
      technicalMessage: 'Missing configuration',
      isRetryable: false,
      suggestedAction:
        'Add the missing configuration. Check environment variables and config files.',
      category: 'CONFIG',
    },
    [ErrorCodes.CONFIG_INVALID]: {
      code: ErrorCodes.CONFIG_INVALID,
      userMessage:
        'Invalid configuration. Please check your configuration values.',
      technicalMessage: 'Invalid configuration',
      isRetryable: false,
      suggestedAction:
        'Verify configuration values are correct and within valid ranges.',
      category: 'CONFIG',
    },

    // System Errors
    [ErrorCodes.MEMORY]: {
      code: ErrorCodes.MEMORY,
      userMessage:
        'Insufficient memory available. The system is running low on memory.',
      technicalMessage: 'Memory allocation failed',
      isRetryable: true,
      suggestedAction:
        'Reduce batch size, close other applications, or restart the system.',
      category: 'SYSTEM',
    },
    [ErrorCodes.DISK_SPACE]: {
      code: ErrorCodes.DISK_SPACE,
      userMessage: 'Insufficient disk space. Free up space to continue.',
      technicalMessage: 'Disk space exhausted',
      isRetryable: true,
      suggestedAction:
        'Free up disk space by deleting temporary files or moving data to another location.',
      category: 'SYSTEM',
    },
    [ErrorCodes.PROCESS]: {
      code: ErrorCodes.PROCESS,
      userMessage:
        'Process error occurred. The operation could not be completed.',
      technicalMessage: 'Process execution failed',
      isRetryable: true,
      suggestedAction:
        'Retry the operation. If persistent, restart the application.',
      category: 'SYSTEM',
    },

    // Business Logic Errors
    [ErrorCodes.BATCH_FAILED]: {
      code: ErrorCodes.BATCH_FAILED,
      userMessage:
        'Batch processing failed. Some tasks in the batch could not be completed.',
      technicalMessage: 'Batch processing failed',
      isRetryable: true,
      suggestedAction:
        'Review failed tasks and retry with --only-failed flag. Check individual task errors.',
      category: 'BUSINESS',
    },
    [ErrorCodes.CHECKPOINT]: {
      code: ErrorCodes.CHECKPOINT,
      userMessage:
        'Checkpoint operation failed. Unable to save or restore progress.',
      technicalMessage: 'Checkpoint error',
      isRetryable: true,
      suggestedAction:
        'Check file permissions for checkpoint directory. Try without --resume flag.',
      category: 'BUSINESS',
    },
    [ErrorCodes.RESUME]: {
      code: ErrorCodes.RESUME,
      userMessage:
        'Resume operation failed. Unable to continue from previous checkpoint.',
      technicalMessage: 'Resume failed',
      isRetryable: false,
      suggestedAction:
        'Check if checkpoint file exists and is valid. Start fresh if needed.',
      category: 'BUSINESS',
    },

    // Generic Errors
    [ErrorCodes.UNKNOWN]: {
      code: ErrorCodes.UNKNOWN,
      userMessage:
        'An unknown error occurred. Please try again or contact support.',
      technicalMessage: 'Unknown error',
      isRetryable: true,
      suggestedAction:
        'Retry the operation. If the issue persists, check logs for more details.',
      category: 'GENERIC',
    },
    [ErrorCodes.INTERNAL]: {
      code: ErrorCodes.INTERNAL,
      userMessage: 'Internal error occurred. This is likely a temporary issue.',
      technicalMessage: 'Internal error',
      isRetryable: true,
      suggestedAction:
        'Retry the operation. If persistent, restart the application.',
      category: 'GENERIC',
    },
  };

  /**
   * Get error taxonomy entry by error code
   */
  static getEntry(code: ErrorCodes): ErrorTaxonomyEntry {
    return this.TAXONOMY[code];
  }

  /**
   * Classify an error and return enhanced error information
   */
  static classifyError(
    error: Error
  ): ErrorInfo & { taxonomy: ErrorTaxonomyEntry } {
    const code = this.determineErrorCode(error);
    const taxonomy = this.getEntry(code);

    return {
      code,
      message: taxonomy.userMessage,
      technicalMessage: taxonomy.technicalMessage,
      isRetryable: taxonomy.isRetryable,
      httpStatus: taxonomy.httpStatus,
      originalError: error,
      taxonomy,
    };
  }

  /**
   * Determine error code from error object
   */
  private static determineErrorCode(error: Error): ErrorCodes {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // File and I/O errors
    if (message.includes('enoent') || message.includes('no such file')) {
      return ErrorCodes.FILE_NOT_FOUND;
    }
    if (message.includes('eacces') || message.includes('permission denied')) {
      return ErrorCodes.FILE_PERMISSION;
    }
    if (
      message.includes('invalid format') ||
      message.includes('unsupported format')
    ) {
      return ErrorCodes.FILE_FORMAT;
    }
    if (message.includes('corrupt') || message.includes('invalid data')) {
      return ErrorCodes.FILE_CORRUPT;
    }

    // API and transport errors
    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorCodes.RATE_LIMIT;
    }
    if (message.includes('timeout') || message.includes('etimedout')) {
      return ErrorCodes.TIMEOUT;
    }
    if (
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('api key')
    ) {
      return ErrorCodes.AUTH;
    }
    if (
      message.includes('quota') ||
      message.includes('billing') ||
      message.includes('payment')
    ) {
      return ErrorCodes.QUOTA;
    }
    if (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return ErrorCodes.SERVER_ERROR;
    }
    if (
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('enotfound')
    ) {
      return ErrorCodes.NETWORK;
    }
    if (
      message.includes('invalid') ||
      message.includes('bad request') ||
      message.includes('must be provided')
    ) {
      return ErrorCodes.INPUT;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid input')) {
      return ErrorCodes.VALIDATION;
    }
    if (message.includes('schema') || message.includes('structure')) {
      return ErrorCodes.SCHEMA;
    }
    if (
      message.includes('required field') ||
      message.includes('missing required')
    ) {
      return ErrorCodes.REQUIRED_FIELD;
    }

    // Configuration errors
    if (message.includes('config') || message.includes('configuration')) {
      return ErrorCodes.CONFIG;
    }
    if (
      message.includes('missing config') ||
      message.includes('environment variable')
    ) {
      return ErrorCodes.CONFIG_MISSING;
    }

    // System errors
    if (message.includes('memory') || message.includes('out of memory')) {
      return ErrorCodes.MEMORY;
    }
    if (message.includes('disk space') || message.includes('no space')) {
      return ErrorCodes.DISK_SPACE;
    }
    if (message.includes('process') || message.includes('execution')) {
      return ErrorCodes.PROCESS;
    }

    // Business logic errors
    if (message.includes('batch') && message.includes('fail')) {
      return ErrorCodes.BATCH_FAILED;
    }
    if (message.includes('checkpoint')) {
      return ErrorCodes.CHECKPOINT;
    }
    if (message.includes('resume')) {
      return ErrorCodes.RESUME;
    }

    // Circuit breaker errors
    if (
      name.includes('circuitbreaker') ||
      message.includes('circuit breaker')
    ) {
      return ErrorCodes.SERVER_ERROR;
    }

    return ErrorCodes.UNKNOWN;
  }

  /**
   * Get all error codes by category
   */
  static getErrorsByCategory(
    category: ErrorTaxonomyEntry['category']
  ): ErrorTaxonomyEntry[] {
    return Object.values(this.TAXONOMY).filter(
      (entry) => entry.category === category
    );
  }

  /**
   * Get troubleshooting information for an error code
   */
  static getTroubleshootingInfo(code: ErrorCodes): {
    code: string;
    userMessage: string;
    suggestedAction: string;
    documentationUrl?: string;
  } {
    const entry = this.getEntry(code);
    return {
      code: entry.code,
      userMessage: entry.userMessage,
      suggestedAction: entry.suggestedAction,
      documentationUrl: entry.documentationUrl,
    };
  }

  /**
   * Generate a user-friendly error summary
   */
  static generateErrorSummary(error: Error): string {
    const errorInfo = this.classifyError(error);
    const { userMessage, suggestedAction, code } = errorInfo.taxonomy;

    return `${code}: ${userMessage}\n\nSuggested Action: ${suggestedAction}`;
  }
}
