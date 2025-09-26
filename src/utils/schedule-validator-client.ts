/**
 * Client-side schedule validation utilities
 * This file contains only browser-compatible validation logic
 */

import validate from 'cron-validate';

/**
 * Validates a cron expression on the client side
 */
export function validateCronExpressionClient(cronExpression: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    const result = validate(cronExpression);
    if (result.isValid()) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: `Invalid cron expression: ${result.getError()?.join(', ')}`,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid cron expression: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validates a file path on the client side (basic validation only)
 */
export function validateFilePathClient(filePath: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!filePath || filePath.trim() === '') {
    errors.push('File path is required');
  }

  // Basic path validation
  if (filePath.includes('..')) {
    errors.push('File path cannot contain parent directory references (..)');
  }

  if (filePath.startsWith('/') || filePath.includes('\\')) {
    // This is a basic check - in a real app you might want more sophisticated validation
    // For now, we'll allow these but could add more restrictions
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a scheduled task on the client side
 */
export function validateScheduledTaskClient(task: {
  name: string;
  schedule: string;
  inputFile: string;
  outputFile?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!task.name || task.name.trim() === '') {
    errors.push('Task name is required');
  }

  if (!task.schedule || task.schedule.trim() === '') {
    errors.push('Cron schedule is required');
  } else {
    const cronValidation = validateCronExpressionClient(task.schedule);
    if (!cronValidation.isValid) {
      errors.push(cronValidation.error || 'Invalid cron expression');
    }
  }

  if (!task.inputFile || task.inputFile.trim() === '') {
    errors.push('Input file path is required');
  } else {
    const fileValidation = validateFilePathClient(task.inputFile);
    if (!fileValidation.isValid) {
      errors.push(...fileValidation.errors);
    }
  }

  if (task.outputFile && task.outputFile.trim() !== '') {
    const outputFileValidation = validateFilePathClient(task.outputFile);
    if (!outputFileValidation.isValid) {
      errors.push(...outputFileValidation.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}
