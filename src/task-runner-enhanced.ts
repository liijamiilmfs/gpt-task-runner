import { Transport, TaskRequest, CliOptions } from './types';
import { BatchLoader } from './io/batch-loader';
import { BatchWriter } from './io/batch-writer';
import { Logger } from './logger';
import { ConcurrencyController, Task } from './utils/concurrency-controller';
import {
  MultiModelRateLimiter,
  OPENAI_RATE_LIMITS,
} from './utils/rate-limiter';
import * as path from 'path';
import * as os from 'os';

export interface EnhancedCliOptions extends CliOptions {
  /** Maximum concurrent tasks */
  maxConcurrency?: number;
  /** Enable rate limiting */
  enableRateLimit?: boolean;
  /** Custom rate limits per model */
  customRateLimits?: Record<string, any>;
  /** Enable priority queuing */
  enablePriority?: boolean;
  /** Task timeout in milliseconds */
  taskTimeout?: number;
}

export class EnhancedTaskRunner {
  private transport: Transport;
  private batchLoader: BatchLoader;
  private batchWriter: BatchWriter;
  private logger: Logger;
  private concurrencyController?: ConcurrencyController<TaskRequest, any>;
  private rateLimiter: MultiModelRateLimiter;

  constructor(transport: Transport, logger: Logger) {
    this.transport = transport;
    this.batchLoader = new BatchLoader();
    this.batchWriter = new BatchWriter();
    this.logger = logger;
    this.rateLimiter = new MultiModelRateLimiter();
  }

  async runFromFile(
    inputPath: string,
    options: EnhancedCliOptions
  ): Promise<void> {
    const batchId = this.logger.generateCorrelationId();

    try {
      this.logger.info(`Loading tasks from ${inputPath}`, {
        batch_id: batchId,
        phase: 'load',
      });
      const batchInput = await this.batchLoader.loadFromFile(inputPath);

      this.logger.batchStart(batchId, batchId, {
        taskCount: batchInput.tasks.length,
        format: batchInput.format,
        inputPath,
      });

      // Apply global options to tasks that don't have them set
      const allTasks = batchInput.tasks.map((task) => ({
        ...task,
        model: task.model || options.model || 'gpt-3.5-turbo',
        temperature: task.temperature ?? options.temperature ?? 0.7,
        maxTokens: task.maxTokens ?? options.maxTokens ?? 1000,
      }));

      // Handle resume functionality
      let tasksToProcess = allTasks;
      let checkpoint: any = null;

      if (options.resume) {
        try {
          const checkpointData = await import('fs').then((fs) =>
            JSON.parse(fs.readFileSync(options.resume!, 'utf-8'))
          );
          checkpoint = checkpointData;
          tasksToProcess = this.getTasksToProcess(
            allTasks,
            checkpoint,
            options.onlyFailed || false
          );
          this.logger.info(
            `Resuming from checkpoint: ${tasksToProcess.length} tasks to process`
          );
        } catch (error) {
          this.logger.warn(`Could not load checkpoint: ${error}`);
          checkpoint = {
            batchId,
            completedTasks: [],
            failedTasks: [],
            lastCheckpoint: new Date().toISOString(),
          };
        }
      } else {
        checkpoint = {
          batchId,
          completedTasks: [],
          failedTasks: [],
          lastCheckpoint: new Date().toISOString(),
        };
      }

      // Set up rate limiting
      this.setupRateLimiting(options);

      // Set up concurrency controller
      this.setupConcurrencyController(options);

      // Process tasks with enhanced concurrency control
      const results = await this.processTasksWithConcurrencyControl(
        tasksToProcess,
        batchId,
        checkpoint,
        options
      );

      this.logger.batchComplete(batchId, batchId, {
        totalTasks: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      });

      // Write output files
      if (options.output) {
        // Write only successful results to main output file
        const successfulResults = results.filter((r) => r.success);
        await this.batchWriter.writeResults(successfulResults, options.output);
        this.logger.info(`Results written to ${options.output}`);

        // Write failed tasks to separate file
        const failedResults = results.filter((r) => !r.success);
        if (failedResults.length > 0) {
          const failedFile = options.output.replace(/\.[^.]+$/, '.failed$&');
          await this.batchWriter.writeResults(failedResults, failedFile);
          this.logger.info(`Failed tasks written to ${failedFile}`);
        }
      }

      // Clean up checkpoint file
      if (options.resume) {
        await import('fs').then((fs) => {
          if (fs.existsSync(options.resume!)) {
            fs.unlinkSync(options.resume!);
            this.logger.info('Checkpoint file cleaned up');
          }
        });
      }

      // Log final status
      const hasFailures = results.some((r) => !r.success);
      if (hasFailures) {
        this.logger.warn('Some tasks failed');
        throw new Error('Some tasks failed');
      } else {
        this.logger.info('All tasks completed successfully');
      }
    } catch (error) {
      this.logger.error('Task execution failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      // Cleanup concurrency controller
      if (this.concurrencyController) {
        await this.concurrencyController.shutdown(5000);
      }
    }
  }

  private setupRateLimiting(options: EnhancedCliOptions): void {
    if (!options.enableRateLimit) return;

    // Set up rate limits for each model used
    // This would be populated from the actual tasks, but for now we'll use defaults

    // Add default OpenAI rate limits
    for (const [model, limits] of Object.entries(OPENAI_RATE_LIMITS)) {
      this.rateLimiter.getLimiter(model, limits);
    }

    // Add custom rate limits if provided
    if (options.customRateLimits) {
      for (const [model, limits] of Object.entries(options.customRateLimits)) {
        this.rateLimiter.getLimiter(model, limits);
      }
    }

    this.logger.info('Rate limiting enabled', {
      models: Object.keys(OPENAI_RATE_LIMITS),
      customModels: options.customRateLimits
        ? Object.keys(options.customRateLimits)
        : [],
    });
  }

  private setupConcurrencyController(options: EnhancedCliOptions): void {
    if (!options.maxConcurrency) return;

    this.concurrencyController = new ConcurrencyController(
      this.processTask.bind(this),
      {
        maxConcurrency: options.maxConcurrency,
        maxQueueSize: options.maxConcurrency * 10, // Allow 10x concurrency in queue
        taskTimeout: options.taskTimeout || 30000,
        enablePriority: options.enablePriority || false,
      },
      this.rateLimiter
    );

    // Set up event listeners
    this.concurrencyController.on('taskQueued', (task) => {
      this.logger.debug('Task queued', { taskId: task.id, model: task.model });
    });

    this.concurrencyController.on('taskStarted', (task) => {
      this.logger.debug('Task started', { taskId: task.id, model: task.model });
    });

    this.concurrencyController.on(
      'taskCompleted',
      ({ task, result, processingTime }) => {
        this.logger.debug('Task completed', {
          taskId: task.id,
          model: task.model,
          processingTime,
          success: result.success,
        });
      }
    );

    this.concurrencyController.on(
      'taskFailed',
      ({ task, error, processingTime }) => {
        this.logger.warn('Task failed', {
          taskId: task.id,
          model: task.model,
          error: error.message,
          processingTime,
          retryCount: task.retryCount,
        });
      }
    );

    this.concurrencyController.on('taskRetry', ({ task, retryCount }) => {
      this.logger.info('Task retry', {
        taskId: task.id,
        model: task.model,
        retryCount,
      });
    });

    this.logger.info('Concurrency controller enabled', {
      maxConcurrency: options.maxConcurrency,
      enablePriority: options.enablePriority,
    });
  }

  private async processTasksWithConcurrencyControl(
    tasks: Array<
      TaskRequest & { model: string; temperature: number; maxTokens: number }
    >,
    batchId: string,
    checkpoint: any,
    options: EnhancedCliOptions
  ): Promise<any[]> {
    if (!this.concurrencyController) {
      // Fall back to original batch processing
      return this.processTasksInBatches(tasks, batchId, checkpoint, options);
    }

    // Convert tasks to concurrency controller format
    const concurrencyTasks: Task<TaskRequest>[] = tasks.map((task, index) => ({
      id: task.id || `task-${index}`,
      data: task,
      priority: this.calculateTaskPriority(task),
      model: task.model,
      estimatedTokens: this.estimateTokens(task),
      maxRetries: 3,
    }));

    // Add tasks to concurrency controller
    await this.concurrencyController.addTasks(concurrencyTasks);

    // Wait for all tasks to complete
    const results: any[] = [];
    const startTime = Date.now();

    // Monitor progress
    const checkInterval = setInterval(() => {
      const metrics = this.concurrencyController!.getMetrics();
      this.logger.info('Processing progress', {
        activeWorkers: metrics.activeWorkers,
        queueLength: metrics.queueLength,
        totalProcessed: metrics.totalProcessed,
        totalFailed: metrics.totalFailed,
        currentThroughput: metrics.currentThroughput,
        averageProcessingTime: metrics.averageProcessingTime,
      });

      // Update checkpoint periodically
      if (metrics.totalProcessed > 0 && metrics.totalProcessed % 10 === 0) {
        this.updateCheckpoint(checkpoint, results, options);
      }
    }, 5000);

    // Wait for completion
    while (
      this.concurrencyController.getQueueStatus().length > 0 ||
      this.concurrencyController.getMetrics().activeWorkers > 0
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    clearInterval(checkInterval);

    const endTime = Date.now();
    const duration = endTime - startTime;

    this.logger.info('Processing complete', {
      duration,
      totalTasks: tasks.length,
      averageTimePerTask: duration / tasks.length,
    });

    return results;
  }

  private async processTask(task: Task<TaskRequest>): Promise<any> {
    try {
      // Execute the task using the transport
      const result = await this.transport.execute(task.data);
      return result;
    } catch (error) {
      // The concurrency controller will handle retries
      throw error;
    }
  }

  private calculateTaskPriority(task: TaskRequest): number {
    // Simple priority calculation based on task properties
    let priority = 0;

    // Higher priority for shorter prompts (faster processing)
    if (task.prompt && task.prompt.length < 100) {
      priority += 10;
    }

    // Higher priority for specific models
    if (task.model?.includes('gpt-4')) {
      priority += 5;
    }

    return priority;
  }

  private estimateTokens(task: TaskRequest): number {
    // Simple token estimation (rough approximation)
    const promptLength = task.prompt?.length || 0;
    const maxTokens = task.maxTokens || 1000;

    // Estimate input tokens (roughly 4 characters per token)
    const inputTokens = Math.ceil(promptLength / 4);

    // Return total estimated tokens (input + output)
    return inputTokens + maxTokens;
  }

  private async processTasksInBatches(
    tasks: Array<
      TaskRequest & { model: string; temperature: number; maxTokens: number }
    >,
    batchId: string,
    checkpoint: any,
    options: EnhancedCliOptions
  ): Promise<any[]> {
    // Fallback to original batch processing
    const results: any[] = [];
    const batchSize = (options as any).batchSize || 10;

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(tasks.length / batchSize);

      this.logger.info(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} tasks)`
      );

      const batchResults = await this.transport.executeBatch(batch, batchId);
      results.push(...batchResults);

      // Update checkpoint
      this.updateCheckpoint(checkpoint, batchResults, options);
    }

    return results;
  }

  private updateCheckpoint(
    checkpoint: any,
    results: any[],
    options: EnhancedCliOptions
  ): void {
    results.forEach((result) => {
      if (result.success) {
        checkpoint.completedTasks.push(result.id);
      } else {
        checkpoint.failedTasks.push(result.id);
      }
    });

    checkpoint.lastCheckpoint = new Date().toISOString();

    // Save checkpoint
    const checkpointFile =
      options.resume ||
      path.join(os.tmpdir(), `checkpoint-${checkpoint.batchId}.json`);
    import('fs').then((fs) =>
      fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2))
    );
  }

  private getTasksToProcess(
    allTasks: Array<
      TaskRequest & { model: string; temperature: number; maxTokens: number }
    >,
    checkpoint: any,
    onlyFailed: boolean
  ): Array<
    TaskRequest & { model: string; temperature: number; maxTokens: number }
  > {
    if (onlyFailed) {
      return allTasks.filter((task) =>
        checkpoint.failedTasks.includes(task.id)
      );
    } else {
      return allTasks.filter(
        (task) =>
          !checkpoint.completedTasks.includes(task.id) &&
          !checkpoint.failedTasks.includes(task.id)
      );
    }
  }

  /**
   * Get current metrics from the concurrency controller
   */
  getMetrics() {
    if (!this.concurrencyController) {
      return null;
    }
    return this.concurrencyController.getMetrics();
  }

  /**
   * Get rate limiter status for all models
   */
  getRateLimitStatus() {
    return this.rateLimiter.getAllStatuses();
  }
}
