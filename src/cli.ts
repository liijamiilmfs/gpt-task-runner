#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { OpenAITransport } from './transports/openai-transport';
import { DryRunTransport } from './transports/dry-run-transport';
import { TaskRunner } from './task-runner';
import { Logger } from './logger';
import { CliOptions } from './types';

// Load environment variables
dotenv.config();

const program = new Command();

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
  .option('--max-retries <number>', 'Maximum number of retries for failed requests', '3')
  .option('--retry-delay <number>', 'Base delay between retries in milliseconds', '1000')
  .option('--timeout <number>', 'Request timeout in milliseconds', '60000')
  .action(async (options) => {
    const logger = new Logger(options.verbose ? 'debug' : 'info', options.json);

    // Validate options
    if (!options.input && !options.prompt) {
      logger.error('Either --input or --prompt must be specified');
      process.exit(1);
    }

    if (options.input && options.prompt) {
      logger.error('Cannot specify both --input and --prompt');
      process.exit(1);
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
        logger.error(
          'OPENAI_API_KEY environment variable is required for live execution'
        );
        process.exit(1);
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
        logger.info(`Configured retry settings: maxRetries=${retryConfig.maxRetries}, baseDelay=${retryConfig.baseDelayMs}ms, timeout=${retryConfig.timeoutMs}ms`);
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
    };

    // Execute tasks
    if (options.input) {
      await taskRunner.runFromFile(options.input, cliOptions);
    } else if (options.prompt) {
      await taskRunner.runSingleTask(options.prompt, cliOptions);
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
      logger.error('--input is required for validation');
      process.exit(1);
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
        logger.info('Sample task:', batchInput.tasks[0]);
      }

      process.exit(0);
    } catch (error) {
      logger.error('Validation failed', {
        error: error instanceof Error ? error.message : error,
      });
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
