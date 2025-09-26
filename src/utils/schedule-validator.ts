import * as fs from 'fs';
import * as path from 'path';
import validate from 'cron-validate';
import { CronJob } from 'cron';

// This file is server-side only - do not import in client components

/**
 * Validates a cron expression
 */
export function validateCronExpression(cronExpression: string): {
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
 * Validates that a file path exists and is readable
 */
export function validateFilePath(
  filePath: string,
  fileType: 'input' | 'output'
): {
  isValid: boolean;
  error?: string;
} {
  try {
    // Resolve the path relative to current working directory
    const resolvedPath = path.resolve(filePath);

    if (fileType === 'input') {
      // Input file must exist and be readable
      if (!fs.existsSync(resolvedPath)) {
        return {
          isValid: false,
          error: `Input file does not exist: ${filePath}`,
        };
      }

      if (!fs.statSync(resolvedPath).isFile()) {
        return {
          isValid: false,
          error: `Input path is not a file: ${filePath}`,
        };
      }

      // Check if file is readable
      try {
        fs.accessSync(resolvedPath, fs.constants.R_OK);
      } catch {
        return {
          isValid: false,
          error: `Input file is not readable: ${filePath}`,
        };
      }
    } else {
      // Output file - check if directory exists and is writable
      const outputDir = path.dirname(resolvedPath);

      if (!fs.existsSync(outputDir)) {
        return {
          isValid: false,
          error: `Output directory does not exist: ${outputDir}`,
        };
      }

      if (!fs.statSync(outputDir).isDirectory()) {
        return {
          isValid: false,
          error: `Output path is not a directory: ${outputDir}`,
        };
      }

      // Check if directory is writable
      try {
        fs.accessSync(outputDir, fs.constants.W_OK);
      } catch {
        return {
          isValid: false,
          error: `Output directory is not writable: ${outputDir}`,
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validates a scheduled task configuration
 */
export function validateScheduledTask(task: {
  name: string;
  schedule: string;
  inputFile: string;
  outputFile?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate name
  if (!task.name || task.name.trim().length === 0) {
    errors.push('Task name is required');
  } else if (task.name.length > 100) {
    errors.push('Task name must be 100 characters or less');
  }

  // Validate cron expression
  const cronValidation = validateCronExpression(task.schedule);
  if (!cronValidation.isValid) {
    errors.push(cronValidation.error!);
  }

  // Validate input file
  const inputValidation = validateFilePath(task.inputFile, 'input');
  if (!inputValidation.isValid) {
    errors.push(inputValidation.error!);
  }

  // Validate output file if provided
  if (task.outputFile) {
    const outputValidation = validateFilePath(task.outputFile, 'output');
    if (!outputValidation.isValid) {
      errors.push(outputValidation.error!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get next run times for a cron expression
 */
export function getNextRunTimes(
  cronExpression: string,
  count: number = 5
): Date[] {
  try {
    const validation = validate(cronExpression);
    if (!validation.isValid()) {
      throw new Error(
        `Invalid cron expression: ${validation.getError()?.join(', ')}`
      );
    }

    // Use the cron library's built-in nextDates method for accurate calculation
    const job = new CronJob(cronExpression, () => {}, null, false, 'UTC');
    const nextDates = job.nextDates(count);

    if (!nextDates || nextDates.length === 0) {
      return [];
    }

    // Convert Luxon DateTime objects to JavaScript Date objects
    return nextDates.map((date) => date.toJSDate());
  } catch (error) {
    throw new Error(
      `Failed to calculate next run times: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
