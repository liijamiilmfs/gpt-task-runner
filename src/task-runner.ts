import { Transport, TaskRequest, CliOptions } from './types';
import { DryRunTransport } from './transports/dry-run-transport';
import { BatchLoader } from './io/batch-loader';
import { BatchWriter } from './io/batch-writer';
import { Logger } from './logger';

export class TaskRunner {
  private transport: Transport;
  private batchLoader: BatchLoader;
  private batchWriter: BatchWriter;
  private logger: Logger;

  constructor(transport: Transport, logger: Logger) {
    this.transport = transport;
    this.batchLoader = new BatchLoader();
    this.batchWriter = new BatchWriter();
    this.logger = logger;
  }

  async runFromFile(inputPath: string, options: CliOptions): Promise<void> {
    try {
      this.logger.info(`Loading tasks from ${inputPath}`);
      const batchInput = await this.batchLoader.loadFromFile(inputPath);
      
      this.logger.info(`Found ${batchInput.tasks.length} tasks in ${batchInput.format} format`);
      
      // Apply global options to tasks that don't have them set
      const tasks = batchInput.tasks.map(task => ({
        ...task,
        model: task.model || options.model,
        temperature: task.temperature ?? options.temperature,
        maxTokens: task.maxTokens ?? options.maxTokens,
      }));

      const results = await this.transport.executeBatch(tasks);
      
      this.logger.info(`Completed ${results.length} tasks`);
      this.logger.info(`Success: ${results.filter(r => r.success).length}, Failed: ${results.filter(r => !r.success).length}`);
      
      if (options.output) {
        await this.batchWriter.writeResults(results, options.output);
        this.logger.info(`Results written to ${options.output}`);
      }

      // If dry run, also output the dry run results
      if (options.dryRun && this.transport instanceof DryRunTransport) {
        const dryRunResults = (this.transport as DryRunTransport).getDryRunResults();
        const dryRunOutput = options.output ? 
          options.output.replace(/\.[^.]+$/, '.dry-run$&') : 
          'dry-run-results.jsonl';
        
        await this.batchWriter.writeDryRunResults(dryRunResults, dryRunOutput);
        this.logger.info(`Dry run results written to ${dryRunOutput}`);
      }

      // Exit with appropriate code
      const hasFailures = results.some(r => !r.success);
      if (hasFailures) {
        this.logger.warn('Some tasks failed');
        process.exit(1);
      } else {
        this.logger.info('All tasks completed successfully');
        process.exit(0);
      }
    } catch (error) {
      this.logger.error('Task execution failed', { error: error instanceof Error ? error.message : error });
      process.exit(1);
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
      this.logger.error('Task execution failed', { error: error instanceof Error ? error.message : error });
      process.exit(1);
    }
  }
}
