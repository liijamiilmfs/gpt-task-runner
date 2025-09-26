#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { OpenAITransport } from './transports/openai-transport';
import { DryRunTransport } from './transports/dry-run-transport';
import { TaskRunner } from './task-runner';
import { Logger } from './logger';
import { CliOptions, ErrorCodes, ScheduledTask } from './types';
import { ErrorTaxonomy } from './utils/error-taxonomy';
import {
  getExitCodeFromErrorCode,
  getExitCodeDescription,
} from './utils/exit-codes';
import { Database } from './database/database';
import {
  validateScheduledTask,
  getNextRunTimes,
} from './utils/schedule-validator';

// Load environment variables
dotenv.config();

const program = new Command();

/**
 * Handle errors with enhanced taxonomy system
 */
function handleError(error: Error, logger: Logger): never {
  const errorInfo = ErrorTaxonomy.classifyError(error);
  const exitCode = getExitCodeFromErrorCode(errorInfo.code as ErrorCodes);

  // Log the error with taxonomy information
  logger.error(`Error: ${errorInfo.message}`);
  logger.error(`Error Code: ${errorInfo.code}`);
  logger.error(`Suggested Action: ${errorInfo.taxonomy.suggestedAction}`);

  if (errorInfo.taxonomy.documentationUrl) {
    logger.error(`Documentation: ${errorInfo.taxonomy.documentationUrl}`);
  }

  if (errorInfo.technicalMessage) {
    logger.error(`Technical Details: ${errorInfo.technicalMessage}`);
  }
  if (errorInfo.originalError) {
    logger.error(`Original Error: ${errorInfo.originalError.message}`);
  }

  logger.error(`Exit Code: ${exitCode} (${getExitCodeDescription(exitCode)})`);

  process.exit(exitCode);
}

program
  .name('gpt-task-runner')
  .description('A powerful task runner and automation tool for GPT models')
  .version('1.0.0');

program
  .command('run')
  .description('Run tasks from a file or single prompt')
  .option('-i, --input <path>', 'Input file path (CSV or JSONL)')
  .option('-p, --prompt <text>', 'Single prompt to execute')
  .option('-o, --output <path>', 'Output file path (CSV or JSONL)')
  .option('--dry-run', 'Simulate execution without making API calls')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--json', 'Output logs in JSON format')
  .option('--model <model>', 'OpenAI model to use', 'gpt-3.5-turbo')
  .option('--temperature <number>', 'Temperature for generation', '0.7')
  .option('--max-tokens <number>', 'Maximum tokens to generate', '1000')
  .option(
    '--max-retries <number>',
    'Maximum number of retries for failed requests',
    '3'
  )
  .option(
    '--retry-delay <number>',
    'Base delay between retries in milliseconds',
    '1000'
  )
  .option('--timeout <number>', 'Request timeout in milliseconds', '60000')
  .option('--batch-size <number>', 'Number of tasks per batch', '10')
  .option('--max-inflight <number>', 'Maximum concurrent tasks', '5')
  .option(
    '--checkpoint-interval <number>',
    'Checkpoint interval in tasks',
    '10'
  )
  .action(async (options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', options.json);

    // Validate options
    if (!options.input && !options.prompt) {
      const error = new Error('Either --input or --prompt must be specified');
      handleError(error, logger);
    }

    if (options.input && options.prompt) {
      const error = new Error('Cannot specify both --input and --prompt');
      handleError(error, logger);
    }

    // Create transport
    let transport;
    if (options.dryRun) {
      logger.info(
        'Running in dry-run mode - no external API calls will be made'
      );
      transport = new DryRunTransport();
    } else {
      const apiKey = process.env['OPENAI_API_KEY'];
      if (!apiKey) {
        const error = new Error(
          'OPENAI_API_KEY environment variable is required for live execution'
        );
        handleError(error, logger);
      }

      const baseURL = process.env['OPENAI_BASE_URL'];

      // Create retry configuration from CLI options
      const retryConfig = {
        maxRetries: parseInt(options.maxRetries) || 3,
        baseDelayMs: parseInt(options.retryDelay) || 1000,
        timeoutMs: parseInt(options.timeout) || 60000,
      };

      transport = new OpenAITransport(apiKey, baseURL, retryConfig);

      if (options.verbose) {
        logger.info(
          `Configured retry settings: maxRetries=${retryConfig.maxRetries}, baseDelay=${retryConfig.baseDelayMs}ms, timeout=${retryConfig.timeoutMs}ms`
        );
      }
    }

    // Create task runner
    const taskRunner = new TaskRunner(transport, logger);

    // Parse numeric options
    const cliOptions: CliOptions = {
      dryRun: options.dryRun || false,
      input: options.input,
      output: options.output,
      verbose: options.verbose || false,
      model: options.model,
      temperature: parseFloat(options.temperature),
      maxTokens: parseInt(options.maxTokens),
      maxRetries: parseInt(options.maxRetries) || 3,
      retryDelay: parseInt(options.retryDelay) || 1000,
      timeout: parseInt(options.timeout) || 60000,
      batchSize: parseInt(options.batchSize) || 10,
      maxInflight: parseInt(options.maxInflight) || 5,
      checkpointInterval: parseInt(options.checkpointInterval) || 10,
    };

    // Execute tasks
    try {
      if (options.input) {
        await taskRunner.runFromFile(options.input, cliOptions);
      } else if (options.prompt) {
        await taskRunner.runSingleTask(options.prompt, cliOptions);
      }
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

program
  .command('validate')
  .description('Validate input file format without execution')
  .option('-i, --input <path>', 'Input file path to validate')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', options.json);

    if (!options.input) {
      const error = new Error('--input is required for validation');
      handleError(error, logger);
    }

    try {
      const { BatchLoader } = await import('./io/batch-loader');
      const batchLoader = new BatchLoader();

      logger.info(`Validating ${options.input}`);
      const batchInput = await batchLoader.loadFromFile(options.input);

      logger.info(`✓ File is valid`);
      logger.info(`✓ Format: ${batchInput.format}`);
      logger.info(`✓ Tasks: ${batchInput.tasks.length}`);

      // Show sample task
      if (batchInput.tasks.length > 0) {
        logger.info('Sample task:', { task: batchInput.tasks[0] });
      }

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Schedule command group
const scheduleCommand = program
  .command('schedule')
  .description('Manage scheduled tasks');

// Schedule add command
scheduleCommand
  .command('add')
  .description('Add a new scheduled task')
  .option('-n, --name <name>', 'Task name (required)')
  .option('-s, --schedule <cron>', 'Cron expression (required)')
  .option('-i, --input <path>', 'Input file path (required)')
  .option('-o, --output <path>', 'Output file path (optional)')
  .option('--dry-run', 'Run in dry-run mode', false)
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', false);

    try {
      // Validate required options
      if (!options.name) {
        const error = new Error('--name is required');
        handleError(error, logger);
      }
      if (!options.schedule) {
        const error = new Error('--schedule is required');
        handleError(error, logger);
      }
      if (!options.input) {
        const error = new Error('--input is required');
        handleError(error, logger);
      }

      // Create scheduled task object
      const task: ScheduledTask = {
        name: options.name,
        schedule: options.schedule,
        inputFile: options.input,
        outputFile: options.output,
        isDryRun: options.dryRun || false,
        isActive: true,
      };

      // Validate the task
      const validation = validateScheduledTask(task);
      if (!validation.isValid) {
        const error = new Error(
          `Validation failed: ${validation.errors.join(', ')}`
        );
        handleError(error, logger);
      }

      // Save to database
      const database = new Database();
      const taskId = await database.saveScheduledTask(
        task as unknown as Record<string, unknown>
      );

      logger.info(`✓ Scheduled task created successfully`);
      logger.info(`  ID: ${taskId}`);
      logger.info(`  Name: ${task.name}`);
      logger.info(`  Schedule: ${task.schedule}`);
      logger.info(`  Input: ${task.inputFile}`);
      if (task.outputFile) {
        logger.info(`  Output: ${task.outputFile}`);
      }
      logger.info(`  Dry Run: ${task.isDryRun ? 'Yes' : 'No'}`);

      // Show next run times
      try {
        const nextRuns = getNextRunTimes(task.schedule, 3);
        logger.info(`  Next runs:`);
        nextRuns.forEach((date, index) => {
          logger.info(`    ${index + 1}. ${date.toLocaleString()}`);
        });
      } catch (error) {
        logger.warn(
          `  Could not calculate next run times: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Schedule list command
scheduleCommand
  .command('list')
  .description('List all scheduled tasks')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', false);

    try {
      const database = new Database();
      const tasks = await database.getScheduledTasks();

      if (tasks.length === 0) {
        logger.info('No scheduled tasks found');
        process.exit(0);
      }

      logger.info(`Found ${tasks.length} scheduled task(s):`);
      logger.info('');

      tasks.forEach((task, index) => {
        const taskData = task as unknown as ScheduledTask;
        logger.info(`${index + 1}. ${taskData.name}`);
        logger.info(`   ID: ${taskData.id}`);
        logger.info(`   Schedule: ${taskData.schedule}`);
        logger.info(`   Input: ${taskData.inputFile}`);
        if (taskData.outputFile) {
          logger.info(`   Output: ${taskData.outputFile}`);
        }
        logger.info(`   Dry Run: ${taskData.isDryRun ? 'Yes' : 'No'}`);
        logger.info(`   Active: ${taskData.isActive ? 'Yes' : 'No'}`);
        if (taskData.createdAt) {
          logger.info(
            `   Created: ${new Date(taskData.createdAt).toLocaleString()}`
          );
        }
        if (taskData.lastRun) {
          logger.info(
            `   Last Run: ${new Date(taskData.lastRun).toLocaleString()}`
          );
        }
        logger.info('');
      });

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Schedule update command
scheduleCommand
  .command('update <id>')
  .description('Update a scheduled task')
  .option('-n, --name <name>', 'New task name')
  .option('-s, --schedule <cron>', 'New cron expression')
  .option('-i, --input <path>', 'New input file path')
  .option('-o, --output <path>', 'New output file path')
  .option('--dry-run', 'Set dry-run mode')
  .option('--no-dry-run', 'Disable dry-run mode')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (id, options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', false);

    try {
      const database = new Database();

      // Check if task exists
      const existingTask = await database.getScheduledTask(id);
      if (!existingTask) {
        const error = new Error(`Scheduled task with ID '${id}' not found`);
        handleError(error, logger);
      }

      // Build update object
      const updates: Record<string, unknown> = {};

      if (options.name !== undefined) {
        updates.name = options.name;
      }
      if (options.schedule !== undefined) {
        updates.schedule = options.schedule;
      }
      if (options.input !== undefined) {
        updates.inputFile = options.input;
      }
      if (options.output !== undefined) {
        updates.outputFile = options.output;
      }
      if (options.dryRun !== undefined) {
        updates.isDryRun = options.dryRun;
      }

      if (Object.keys(updates).length === 0) {
        logger.info('No updates specified');
        process.exit(0);
      }

      // Validate updated task if critical fields are being updated
      if (updates.name || updates.schedule || updates.inputFile) {
        const updatedTask = {
          ...existingTask,
          ...updates,
        } as unknown as ScheduledTask;
        const validation = validateScheduledTask(updatedTask);
        if (!validation.isValid) {
          const error = new Error(
            `Validation failed: ${validation.errors.join(', ')}`
          );
          handleError(error, logger);
        }
      }

      // Update the task
      await database.updateScheduledTask(id, updates);

      logger.info(`✓ Scheduled task updated successfully`);
      logger.info(`  ID: ${id}`);
      Object.entries(updates).forEach(([key, value]) => {
        logger.info(`  ${key}: ${value}`);
      });

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Schedule delete command
scheduleCommand
  .command('delete <id>')
  .description('Delete a scheduled task')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (id, options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', false);

    try {
      const database = new Database();

      // Check if task exists
      const existingTask = await database.getScheduledTask(id);
      if (!existingTask) {
        const error = new Error(`Scheduled task with ID '${id}' not found`);
        handleError(error, logger);
      }

      // Delete the task
      await database.deleteScheduledTask(id);

      logger.info(`✓ Scheduled task deleted successfully`);
      logger.info(`  ID: ${id}`);
      logger.info(`  Name: ${existingTask.name}`);

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Schedule enable command
scheduleCommand
  .command('enable <id>')
  .description('Enable a scheduled task')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (id, options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', false);

    try {
      const database = new Database();

      // Check if task exists
      const existingTask = await database.getScheduledTask(id);
      if (!existingTask) {
        const error = new Error(`Scheduled task with ID '${id}' not found`);
        handleError(error, logger);
      }

      // Enable the task
      await database.enableScheduledTask(id);

      logger.info(`✓ Scheduled task enabled successfully`);
      logger.info(`  ID: ${id}`);
      logger.info(`  Name: ${existingTask.name}`);

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Schedule disable command
scheduleCommand
  .command('disable <id>')
  .description('Disable a scheduled task')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (id, options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', false);

    try {
      const database = new Database();

      // Check if task exists
      const existingTask = await database.getScheduledTask(id);
      if (!existingTask) {
        const error = new Error(`Scheduled task with ID '${id}' not found`);
        handleError(error, logger);
      }

      // Disable the task
      await database.disableScheduledTask(id);

      logger.info(`✓ Scheduled task disabled successfully`);
      logger.info(`  ID: ${id}`);
      logger.info(`  Name: ${existingTask.name}`);

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Schedule next command
scheduleCommand
  .command('next')
  .description('Show next scheduled run times for all active tasks')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', false);

    try {
      const database = new Database();
      const tasks = await database.getScheduledTasks();

      if (tasks.length === 0) {
        logger.info('No active scheduled tasks found');
        process.exit(0);
      }

      logger.info(`Next run times for ${tasks.length} active task(s):`);
      logger.info('');

      for (const task of tasks) {
        const taskData = task as unknown as ScheduledTask;
        try {
          const nextRuns = getNextRunTimes(taskData.schedule, 3);
          logger.info(`${taskData.name} (${taskData.schedule}):`);
          nextRuns.forEach((date, index) => {
            logger.info(`  ${index + 1}. ${date.toLocaleString()}`);
          });
          logger.info('');
        } catch (error) {
          logger.warn(
            `${taskData.name}: Could not calculate next run times - ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      process.exit(0);
    } catch (error) {
      handleError(error as Error, logger);
    }
  });

// Parse command line arguments
program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
