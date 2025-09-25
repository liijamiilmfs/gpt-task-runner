import { Transport, TaskRequest, CliOptions } from './types';
import { DryRunTransport } from './transports/dry-run-transport';
import { BatchLoader } from './io/batch-loader';
import { BatchWriter } from './io/batch-writer';
import { Logger } from './logger';
import { MemoryMonitor } from './utils/memory-monitor';
import * as crypto from 'crypto';
import * as path from 'path';
import * as os from 'os';

export class TaskRunner {
  private transport: Transport;
  private batchLoader: BatchLoader;
  private batchWriter: BatchWriter;
  private logger: Logger;
  private memoryMonitor: MemoryMonitor;

  constructor(transport: Transport, logger: Logger) {
    this.transport = transport;
    this.batchLoader = new BatchLoader();
    this.batchWriter = new BatchWriter();
    this.logger = logger;
    this.memoryMonitor = new MemoryMonitor();
  }

  async runFromFile(inputPath: string, options: CliOptions): Promise<void> {
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
      let checkpoint: Record<string, unknown> | null = null;

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
          this.logger.warn('Failed to load checkpoint, processing all tasks', {
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      // Initialize checkpoint if not resuming
      if (!checkpoint) {
        checkpoint = {
          batchId,
          completedTasks: [],
          failedTasks: [],
          lastCheckpoint: new Date().toISOString(),
          totalTasks: allTasks.length,
        };
      }

      const results: TaskResponse[] = [];
      const batchSize = options.batchSize || 10;
      const maxInflight = options.maxInflight || 5;
      const checkpointInterval = options.checkpointInterval || 10;

      // Process tasks in batches with inflight limiting
      for (let i = 0; i < tasksToProcess.length; i += batchSize) {
        const batch = tasksToProcess.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(tasksToProcess.length / batchSize);

        this.logger.info(
          `Processing batch ${batchNumber}/${totalBatches} (${batch.length} tasks)`
        );

        // Monitor memory usage
        const memoryStats = this.memoryMonitor.getMemoryUsageMB();
        this.logger.debug('Memory usage', {
          heapUsed: `${memoryStats.heapUsed.toFixed(2)}MB`,
          heapTotal: `${memoryStats.heapTotal.toFixed(2)}MB`,
          rss: `${memoryStats.rss.toFixed(2)}MB`,
        });

        // Process batch with inflight limiting
        const batchResults = await this.processBatchWithInflightLimit(
          batch,
          batchId,
          maxInflight
        );
        results.push(...batchResults);

        // Update checkpoint
        batchResults.forEach((result) => {
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
          path.join(os.tmpdir(), `checkpoint-${batchId}.json`);
        await import('fs').then((fs) =>
          fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2))
        );
      }

      // Log final memory statistics
      const finalMemoryStats = this.memoryMonitor.getSummary();
      this.logger.info('Processing complete - Memory summary', {
        peakHeapUsed: finalMemoryStats.peak
          ? `${(finalMemoryStats.peak.heapUsed / 1024 / 1024).toFixed(2)}MB`
          : 'N/A',
        currentHeapUsed: `${(finalMemoryStats.current.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        memoryGrowthRate: `${finalMemoryStats.growthRate.toFixed(2)}MB/s`,
        totalSnapshots: finalMemoryStats.snapshots,
      });

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

      // If dry run, also output the dry run results
      if (options.dryRun && this.transport instanceof DryRunTransport) {
        const dryRunResults = (
          this.transport as DryRunTransport
        ).getDryRunResults();
        const dryRunOutput = options.output
          ? options.output.replace(/\.[^.]+$/, '.dry-run$&')
          : 'dry-run-results.jsonl';

        await this.batchWriter.writeDryRunResults(dryRunResults, dryRunOutput);
        this.logger.info(`Dry run results written to ${dryRunOutput}`);
      }

      // Clean up checkpoint file if all tasks completed successfully
      if (
        checkpoint.completedTasks.length + checkpoint.failedTasks.length ===
        checkpoint.totalTasks
      ) {
        const checkpointFile = options.resume || 'checkpoint.json';
        try {
          await import('fs').then((fs) => fs.unlinkSync(checkpointFile));
          this.logger.info('Checkpoint file cleaned up');
        } catch {
          // Ignore cleanup errors
        }
      }

      // Exit with appropriate code
      const hasFailures = results.some((r) => !r.success);
      if (hasFailures) {
        this.logger.warn('Some tasks failed');
        throw new Error('Some tasks failed');
      } else {
        this.logger.info('All tasks completed successfully');
      }
    } catch (error) {
      this.logger.error('Task execution failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async runSingleTask(prompt: string, options: CliOptions): Promise<void> {
    try {
      const task: TaskRequest = {
        id: `single-task-${Date.now()}`,
        prompt,
        ...(options.model && { model: options.model }),
        ...(options.temperature && { temperature: options.temperature }),
        ...(options.maxTokens && { maxTokens: options.maxTokens }),
      };

      this.logger.info('Executing single task', { taskId: task.id });
      const result = await this.transport.execute(task);

      if (result.success) {
        this.logger.info('Task completed successfully');
        console.log('\n--- Response ---');
        console.log(result.response);
        console.log('\n--- Usage ---');
        console.log(`Prompt tokens: ${result.usage?.promptTokens}`);
        console.log(`Completion tokens: ${result.usage?.completionTokens}`);
        console.log(`Total tokens: ${result.usage?.totalTokens}`);
        console.log(`Cost: $${result.cost?.toFixed(6)}`);
      } else {
        this.logger.error('Task failed', { error: result.error });
        process.exit(1);
      }
    } catch (error) {
      this.logger.error('Task execution failed', {
        error: error instanceof Error ? error.message : error,
      });
      process.exit(1);
    }
  }

  /**
   * Generate a stable idempotency key for a task
   */
  generateIdempotencyKey(task: TaskRequest): string {
    const content = {
      prompt: task.prompt,
      messages: task.messages,
      model: task.model,
      temperature: task.temperature,
      maxTokens: task.maxTokens,
    };

    const contentString = JSON.stringify(content, Object.keys(content).sort());
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  /**
   * Process a batch of tasks with inflight limiting
   */
  private async processBatchWithInflightLimit(
    tasks: TaskRequest[],
    batchId: string,
    _maxInflight: number
  ): Promise<TaskResponse[]> {
    // For now, use the existing executeBatch method
    // TODO: Implement proper inflight limiting with sub-batching
    return await this.transport.executeBatch(tasks, batchId);
  }

  /**
   * Get tasks to process based on checkpoint and resume options
   */
  getTasksToProcess(
    allTasks: Array<
      TaskRequest & { model: string; temperature: number; maxTokens: number }
    >,
    checkpoint: Record<string, unknown> | null,
    onlyFailed: boolean
  ): Array<
    TaskRequest & { model: string; temperature: number; maxTokens: number }
  > {
    if (onlyFailed) {
      // Process only failed tasks
      return allTasks.filter((task) =>
        checkpoint.failedTasks?.includes(task.id)
      );
    } else {
      // Process remaining tasks (not completed and not failed)
      const completedTasks = new Set(checkpoint.completedTasks || []);
      const failedTasks = new Set(checkpoint.failedTasks || []);

      return allTasks.filter(
        (task) => !completedTasks.has(task.id) && !failedTasks.has(task.id)
      );
    }
  }
}
