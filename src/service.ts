import * as Service from 'node-windows';
import * as cron from 'node-cron';
import * as path from 'path';
import { TaskRunner } from './task-runner';
import { DryRunTransport } from './transports/dry-run-transport';
import { OpenAITransport } from './transports/openai-transport';
import { BatchLoader } from './io/batch-loader';
import { Database } from './database/database';
import { Logger } from './logger';
import { CliOptions } from './types';

interface ScheduledTask {
  id?: string;
  name: string;
  schedule: string;
  isDryRun: boolean;
  inputFile: string;
  outputFile: string;
}

class GPTTaskService {
  private logger: Logger;
  private database: Database;
  // private taskRunner!: TaskRunner; // Not used in current implementation
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  constructor() {
    this.logger = new Logger('info');
    this.database = new Database();
    // this.taskRunner = new TaskRunner(new DryRunTransport(), this.logger); // Not used in current implementation
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Service is already running');
      return;
    }

    try {
      this.logger.info('Starting GPT Task Runner Service...');
      await this.database.logServiceEvent('info', 'Service starting');

      // Load scheduled tasks from database
      await this.loadScheduledTasks();

      // Start the service
      this.isRunning = true;
      this.logger.info('GPT Task Runner Service started successfully');

      // Keep the service running
      this.keepAlive();
    } catch (error) {
      this.logger.error('Failed to start service', {
        error: error instanceof Error ? error.message : error,
      });
      await this.database.logServiceEvent('error', 'Service failed to start', {
        error,
      });
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Service is not running');
      return;
    }

    try {
      this.logger.info('Stopping GPT Task Runner Service...');
      await this.database.logServiceEvent('info', 'Service stopping');

      // Stop all scheduled tasks
      for (const [taskId, scheduledTask] of this.scheduledTasks) {
        scheduledTask.stop();
        this.logger.info(`Stopped scheduled task: ${taskId}`);
      }
      this.scheduledTasks.clear();

      this.isRunning = false;
      this.database.close();
      this.logger.info('GPT Task Runner Service stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping service', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  private async loadScheduledTasks(): Promise<void> {
    try {
      const tasks = await this.database.getActiveScheduledTasks();
      this.logger.info(`Loading ${tasks.length} active scheduled tasks`);

      for (const task of tasks) {
        await this.scheduleTask(task as unknown as ScheduledTask);
      }
    } catch (error) {
      this.logger.error('Failed to load scheduled tasks', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private async scheduleTask(task: ScheduledTask): Promise<void> {
    try {
      const scheduledTask = cron.schedule(
        task.schedule,
        async () => {
          await this.executeScheduledTask(task);
        },
        {
          // scheduled: false, // This property doesn't exist in TaskOptions
          timezone: 'America/New_York', // Default timezone, can be made configurable
        }
      );

      this.scheduledTasks.set(task.id!, scheduledTask);
      scheduledTask.start();

      this.logger.info(
        `Scheduled task '${task.name}' with schedule '${task.schedule}'`
      );
      await this.database.logServiceEvent(
        'info',
        `Scheduled task '${task.name}' started`,
        { taskId: task.id }
      );
    } catch (error) {
      this.logger.error(`Failed to schedule task '${task.name}'`, {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private async executeScheduledTask(task: ScheduledTask): Promise<void> {
    let realExecutionId: string | null = null;

    try {
      this.logger.info(`Executing scheduled task: ${task.name}`);
      await this.database.logServiceEvent(
        'info',
        `Executing scheduled task '${task.name}'`,
        { taskId: task.id }
      );

      // Update last run time
      await this.updateTaskLastRun(task.id!);

      // Create transport based on dry run setting
      const transport = task.isDryRun
        ? new DryRunTransport()
        : new OpenAITransport(
            process.env['OPENAI_API_KEY']!,
            process.env['OPENAI_BASE_URL']
          );

      // Create task runner
      const taskRunner = new TaskRunner(transport, this.logger);

      // Load and execute tasks
      const batchLoader = new BatchLoader();
      const batchInput = await batchLoader.loadFromFile(task.inputFile);

      const cliOptions: CliOptions = {
        dryRun: task.isDryRun,
        input: task.inputFile,
        output: task.outputFile,
        verbose: false,
      };

      // Record execution start and capture the real execution ID
      realExecutionId = await this.database.saveTaskExecution({
        request: JSON.stringify(batchInput),
        status: 'running',
        isDryRun: task.isDryRun,
      });

      // Execute tasks
      await taskRunner.runFromFile(task.inputFile, cliOptions);

      // Record execution completion using the real execution ID
      if (realExecutionId) {
        await this.database.updateTaskExecution(realExecutionId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      }

      this.logger.info(`Completed scheduled task: ${task.name}`);
      await this.database.logServiceEvent(
        'info',
        `Completed scheduled task '${task.name}'`,
        { taskId: task.id, executionId: realExecutionId || undefined }
      );
    } catch (error) {
      this.logger.error(`Failed to execute scheduled task '${task.name}'`, {
        error: error instanceof Error ? error.message : error,
      });

      // Only update execution status if we have a real execution ID
      if (realExecutionId) {
        await this.database.updateTaskExecution(realExecutionId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString(),
        });
      }

      await this.database.logServiceEvent(
        'error',
        `Failed scheduled task '${task.name}'`,
        {
          taskId: task.id,
          executionId: realExecutionId,
          error: error instanceof Error ? error.message : error,
        }
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async updateTaskLastRun(_taskId: string): Promise<void> {
    // This would update the lastRun field in the database
    // Implementation depends on your database schema
  }

  private keepAlive(): void {
    // Keep the service running
    setInterval(() => {
      if (this.isRunning) {
        this.logger.debug('Service heartbeat');
      }
    }, 60000); // Heartbeat every minute
  }

  // Public methods for service management
  async addScheduledTask(task: ScheduledTask): Promise<string> {
    const taskId = await this.database.saveScheduledTask(
      task as unknown as Record<string, unknown>
    );
    await this.scheduleTask({ ...task, id: taskId });
    return taskId;
  }

  async removeScheduledTask(taskId: string): Promise<void> {
    const scheduledTask = this.scheduledTasks.get(taskId);
    if (scheduledTask) {
      scheduledTask.stop();
      this.scheduledTasks.delete(taskId);
    }
    // Also remove from database
  }

  async getServiceStatus(): Promise<{
    isRunning: boolean;
    scheduledTasks: number;
    metrics: Record<string, unknown>;
  }> {
    const metrics = await this.database.getTaskMetrics();
    return {
      isRunning: this.isRunning,
      scheduledTasks: this.scheduledTasks.size,
      metrics: metrics as unknown as Record<string, unknown>,
    };
  }
}

// Service wrapper for node-windows
const service = new Service.Service({
  name: 'GPT Task Runner',
  description: 'GPT-powered task runner and automation service',
  script: path.join(__dirname, 'service.js'),
  nodeOptions: ['--max_old_space_size=4096'],
});

// Service event handlers
service.on('install', () => {
  console.log('GPT Task Runner service installed');
  service.start();
});

service.on('uninstall', () => {
  console.log('GPT Task Runner service uninstalled');
});

service.on('start', () => {
  console.log('GPT Task Runner service started');
  const gptService = new GPTTaskService();
  gptService.start().catch(console.error);
});

service.on('stop', () => {
  console.log('GPT Task Runner service stopped');
});

// If this file is run directly, start the service
if (require.main === module) {
  const gptService = new GPTTaskService();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await gptService.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await gptService.stop();
    process.exit(0);
  });

  gptService.start().catch(console.error);
}

export { GPTTaskService };
