import { ErrorCodes } from '../types';

/**
 * Exit codes for the GPT Task Runner CLI
 * These codes provide structured feedback about the operation result
 */
export enum ExitCodes {
  // Success codes
  SUCCESS = 0,
  SUCCESS_WITH_WARNINGS = 1,

  // API and Transport errors (10-19)
  RATE_LIMIT_ERROR = 10,
  TIMEOUT_ERROR = 11,
  AUTH_ERROR = 12,
  INPUT_ERROR = 13,
  QUOTA_ERROR = 14,
  SERVER_ERROR = 15,
  NETWORK_ERROR = 16,

  // File and I/O errors (20-29)
  FILE_NOT_FOUND_ERROR = 20,
  FILE_PERMISSION_ERROR = 21,
  FILE_FORMAT_ERROR = 22,
  FILE_CORRUPT_ERROR = 23,

  // Validation errors (30-39)
  VALIDATION_ERROR = 30,
  SCHEMA_ERROR = 31,
  REQUIRED_FIELD_ERROR = 32,
  INVALID_FORMAT_ERROR = 33,

  // Configuration errors (40-49)
  CONFIG_ERROR = 40,
  CONFIG_MISSING_ERROR = 41,
  CONFIG_INVALID_ERROR = 42,

  // System errors (50-59)
  MEMORY_ERROR = 50,
  DISK_SPACE_ERROR = 51,
  PROCESS_ERROR = 52,

  // Business logic errors (60-69)
  BATCH_FAILED_ERROR = 60,
  CHECKPOINT_ERROR = 61,
  RESUME_ERROR = 62,

  // Generic errors (70-79)
  UNKNOWN_ERROR = 70,
  INTERNAL_ERROR = 71,

  // Special cases (80-89)
  PARTIAL_SUCCESS = 80,
  DRY_RUN_SUCCESS = 81,
}

/**
 * Mapping from ErrorCodes to ExitCodes
 */
export const ERROR_TO_EXIT_CODE_MAP: Record<ErrorCodes, ExitCodes> = {
  // API and Transport Errors
  [ErrorCodes.RATE_LIMIT]: ExitCodes.RATE_LIMIT_ERROR,
  [ErrorCodes.TIMEOUT]: ExitCodes.TIMEOUT_ERROR,
  [ErrorCodes.AUTH]: ExitCodes.AUTH_ERROR,
  [ErrorCodes.INPUT]: ExitCodes.INPUT_ERROR,
  [ErrorCodes.QUOTA]: ExitCodes.QUOTA_ERROR,
  [ErrorCodes.SERVER_ERROR]: ExitCodes.SERVER_ERROR,
  [ErrorCodes.NETWORK]: ExitCodes.NETWORK_ERROR,

  // File and I/O Errors
  [ErrorCodes.FILE_NOT_FOUND]: ExitCodes.FILE_NOT_FOUND_ERROR,
  [ErrorCodes.FILE_PERMISSION]: ExitCodes.FILE_PERMISSION_ERROR,
  [ErrorCodes.FILE_FORMAT]: ExitCodes.FILE_FORMAT_ERROR,
  [ErrorCodes.FILE_CORRUPT]: ExitCodes.FILE_CORRUPT_ERROR,

  // Validation Errors
  [ErrorCodes.VALIDATION]: ExitCodes.VALIDATION_ERROR,
  [ErrorCodes.SCHEMA]: ExitCodes.SCHEMA_ERROR,
  [ErrorCodes.REQUIRED_FIELD]: ExitCodes.REQUIRED_FIELD_ERROR,
  [ErrorCodes.INVALID_FORMAT]: ExitCodes.INVALID_FORMAT_ERROR,

  // Configuration Errors
  [ErrorCodes.CONFIG]: ExitCodes.CONFIG_ERROR,
  [ErrorCodes.CONFIG_MISSING]: ExitCodes.CONFIG_MISSING_ERROR,
  [ErrorCodes.CONFIG_INVALID]: ExitCodes.CONFIG_INVALID_ERROR,

  // System Errors
  [ErrorCodes.MEMORY]: ExitCodes.MEMORY_ERROR,
  [ErrorCodes.DISK_SPACE]: ExitCodes.DISK_SPACE_ERROR,
  [ErrorCodes.PROCESS]: ExitCodes.PROCESS_ERROR,

  // Business Logic Errors
  [ErrorCodes.BATCH_FAILED]: ExitCodes.BATCH_FAILED_ERROR,
  [ErrorCodes.CHECKPOINT]: ExitCodes.CHECKPOINT_ERROR,
  [ErrorCodes.RESUME]: ExitCodes.RESUME_ERROR,

  // Generic Errors
  [ErrorCodes.UNKNOWN]: ExitCodes.UNKNOWN_ERROR,
  [ErrorCodes.INTERNAL]: ExitCodes.INTERNAL_ERROR,
};

/**
 * Get exit code from error code
 */
export function getExitCodeFromErrorCode(errorCode: ErrorCodes): ExitCodes {
  return ERROR_TO_EXIT_CODE_MAP[errorCode] || ExitCodes.UNKNOWN_ERROR;
}

/**
 * Get human-readable description of exit code
 */
export function getExitCodeDescription(exitCode: ExitCodes): string {
  const descriptions: Record<ExitCodes, string> = {
    // Success codes
    [ExitCodes.SUCCESS]: 'Operation completed successfully',
    [ExitCodes.SUCCESS_WITH_WARNINGS]: 'Operation completed with warnings',

    // API and Transport errors
    [ExitCodes.RATE_LIMIT_ERROR]: 'Rate limit exceeded',
    [ExitCodes.TIMEOUT_ERROR]: 'Request timeout',
    [ExitCodes.AUTH_ERROR]: 'Authentication failed',
    [ExitCodes.INPUT_ERROR]: 'Invalid input provided',
    [ExitCodes.QUOTA_ERROR]: 'Quota exceeded or billing issue',
    [ExitCodes.SERVER_ERROR]: 'Server error occurred',
    [ExitCodes.NETWORK_ERROR]: 'Network connection error',

    // File and I/O errors
    [ExitCodes.FILE_NOT_FOUND_ERROR]: 'File not found',
    [ExitCodes.FILE_PERMISSION_ERROR]: 'File permission denied',
    [ExitCodes.FILE_FORMAT_ERROR]: 'Invalid file format',
    [ExitCodes.FILE_CORRUPT_ERROR]: 'File corruption detected',

    // Validation errors
    [ExitCodes.VALIDATION_ERROR]: 'Data validation failed',
    [ExitCodes.SCHEMA_ERROR]: 'Schema validation failed',
    [ExitCodes.REQUIRED_FIELD_ERROR]: 'Required field missing',
    [ExitCodes.INVALID_FORMAT_ERROR]: 'Invalid data format',

    // Configuration errors
    [ExitCodes.CONFIG_ERROR]: 'Configuration error',
    [ExitCodes.CONFIG_MISSING_ERROR]: 'Missing configuration',
    [ExitCodes.CONFIG_INVALID_ERROR]: 'Invalid configuration',

    // System errors
    [ExitCodes.MEMORY_ERROR]: 'Memory allocation failed',
    [ExitCodes.DISK_SPACE_ERROR]: 'Disk space exhausted',
    [ExitCodes.PROCESS_ERROR]: 'Process execution failed',

    // Business logic errors
    [ExitCodes.BATCH_FAILED_ERROR]: 'Batch processing failed',
    [ExitCodes.CHECKPOINT_ERROR]: 'Checkpoint operation failed',
    [ExitCodes.RESUME_ERROR]: 'Resume operation failed',

    // Generic errors
    [ExitCodes.UNKNOWN_ERROR]: 'Unknown error occurred',
    [ExitCodes.INTERNAL_ERROR]: 'Internal error occurred',

    // Special cases
    [ExitCodes.PARTIAL_SUCCESS]: 'Partial success - some tasks failed',
    [ExitCodes.DRY_RUN_SUCCESS]: 'Dry run completed successfully',
  };

  return descriptions[exitCode] || 'Unknown exit code';
}

/**
 * Determine if exit code indicates success
 */
export function isSuccessExitCode(exitCode: ExitCodes): boolean {
  return (
    exitCode === ExitCodes.SUCCESS ||
    exitCode === ExitCodes.SUCCESS_WITH_WARNINGS ||
    exitCode === ExitCodes.DRY_RUN_SUCCESS
  );
}

/**
 * Determine if exit code indicates partial success
 */
export function isPartialSuccessExitCode(exitCode: ExitCodes): boolean {
  return (
    exitCode === ExitCodes.SUCCESS_WITH_WARNINGS ||
    exitCode === ExitCodes.PARTIAL_SUCCESS
  );
}
