/**
 * Concurrency Controller with Worker Pool
 * Manages task execution with controlled concurrency and queue management
 */

import { EventEmitter } from 'events';
import { MultiModelRateLimiter, RateLimitStatus } from './rate-limiter';

export interface Task<T = any> {
  id: string;
  data: T;
  priority?: number; // Higher number = higher priority
  model?: string;
  estimatedTokens?: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface WorkerConfig {
  /** Maximum number of concurrent workers */
  maxConcurrency: number;
  /** Maximum total tasks (active + queued) before rejecting new tasks */
  maxQueueSize?: number;
  /** Task timeout in milliseconds */
  taskTimeout?: number;
  /** Whether to enable priority queuing */
  enablePriority?: boolean;
}

export interface ConcurrencyMetrics {
  /** Current number of active workers */
  activeWorkers: number;
  /** Current queue length */
  queueLength: number;
  /** Total tasks processed */
  totalProcessed: number;
  /** Total tasks failed */
  totalFailed: number;
  /** Average processing time in milliseconds */
  averageProcessingTime: number;
  /** Current throughput (tasks per second) */
  currentThroughput: number;
  /** Rate limit status for each model */
  rateLimitStatus: Record<string, RateLimitStatus>;
}

export type TaskProcessor<T, R> = (task: Task<T>) => Promise<R>;

export class ConcurrencyController<T = any, R = any> extends EventEmitter {
  private activeWorkers: Map<string, Promise<void>> = new Map();
  private queue: Task<T>[] = [];
  private metrics: ConcurrencyMetrics;
  private rateLimiter: MultiModelRateLimiter;
  private isShuttingDown = false;
  private config: Required<WorkerConfig>;
  private taskProcessor: TaskProcessor<T, R>;
  private processingTimes: number[] = [];
  private completionTimestamps: number[] = [];

  constructor(
    taskProcessor: TaskProcessor<T, R>,
    config: WorkerConfig,
    rateLimiter?: MultiModelRateLimiter
  ) {
    super();
    this.taskProcessor = taskProcessor;
    this.config = {
      maxConcurrency: config.maxConcurrency,
      maxQueueSize: config.maxQueueSize || 1000,
      taskTimeout: config.taskTimeout || 30000,
      enablePriority: config.enablePriority || false,
    };
    this.rateLimiter = rateLimiter || new MultiModelRateLimiter();

    this.metrics = {
      activeWorkers: 0,
      queueLength: 0,
      totalProcessed: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      currentThroughput: 0,
      rateLimitStatus: {},
    };
  }

  /**
   * Add a task to the queue
   */
  async addTask(task: Task<T>): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('ConcurrencyController is shutting down');
    }

    // Check if we can add the task (queue + active workers)
    const totalCapacity = this.config.maxConcurrency + this.config.maxQueueSize;
    if (this.queue.length + this.activeWorkers.size >= totalCapacity) {
      throw new Error(`Queue is full (${totalCapacity} total tasks)`);
    }

    // Add to queue with priority handling
    if (this.config.enablePriority && task.priority !== undefined) {
      this.insertByPriority(task);
    } else {
      this.queue.push(task);
    }

    this.updateMetrics();
    this.emit('taskQueued', task);

    // Process immediately if we have capacity
    if (this.activeWorkers.size < this.config.maxConcurrency) {
      this.processNext();
    }
  }

  /**
   * Add multiple tasks to the queue
   */
  async addTasks(tasks: Task<T>[]): Promise<void> {
    for (const task of tasks) {
      await this.addTask(task);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): ConcurrencyMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { length: number; tasks: Task<T>[] } {
    return {
      length: this.queue.length,
      tasks: [...this.queue],
    };
  }

  /**
   * Shutdown the controller gracefully
   */
  async shutdown(timeoutMs: number = 30000): Promise<void> {
    this.isShuttingDown = true;
    this.emit('shutdownStarted');

    const startTime = Date.now();
    while (this.activeWorkers.size > 0 && Date.now() - startTime < timeoutMs) {
      await Promise.race(Array.from(this.activeWorkers.values()));
    }

    // Force shutdown if timeout reached
    if (this.activeWorkers.size > 0) {
      this.emit('shutdownTimeout');
    }

    this.emit('shutdownComplete');
  }

  /**
   * Process the next task in the queue
   */
  private processNext(): void {
    while (
      this.activeWorkers.size < this.config.maxConcurrency &&
      this.queue.length > 0
    ) {
      const task = this.queue.shift();
      if (!task) break;

      // Create a promise that will be resolved when the task completes
      const workerPromise = this.processTask(task);
      this.activeWorkers.set(task.id, workerPromise);

      // Don't wait for the promise to complete - just add it to active workers
      // The promise will be cleaned up when it completes
      workerPromise.finally(() => {
        this.activeWorkers.delete(task.id);
        this.updateMetrics();
        // Try to process more tasks
        this.processNext();
      });

      this.updateMetrics();
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: Task<T>): Promise<void> {
    const startTime = Date.now();

    try {
      // Check rate limits if model is specified
      if (task.model) {
        const rateLimitStatus = this.rateLimiter.tryConsume(
          task.model,
          task.estimatedTokens || 1
        );

        if (!rateLimitStatus.allowed) {
          // Re-queue the task with a delay
          setTimeout(() => {
            this.queue.unshift(task);
            this.updateMetrics();
            this.processNext();
          }, rateLimitStatus.retryAfter || 1000);
          return;
        }
      }

      this.emit('taskStarted', task);

      // Process the task with timeout
      const result = await Promise.race([
        this.taskProcessor(task),
        this.createTimeoutPromise(task.id),
      ]);

      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);
      this.recordCompletion();

      this.metrics.totalProcessed++;
      this.emit('taskCompleted', { task, result, processingTime });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);
      this.recordCompletion();

      this.metrics.totalFailed++;
      this.emit('taskFailed', { task, error, processingTime });

      // Retry logic
      if (task.retryCount === undefined) task.retryCount = 0;
      if (task.maxRetries === undefined) task.maxRetries = 3;

      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        this.queue.unshift(task); // Re-queue for retry
        this.emit('taskRetry', { task, retryCount: task.retryCount });
        this.updateMetrics();
      }
    }
  }

  /**
   * Create a timeout promise for task processing
   */
  private createTimeoutPromise(taskId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Task ${taskId} timed out after ${this.config.taskTimeout}ms`
          )
        );
      }, this.config.taskTimeout);
    });
  }

  /**
   * Insert task by priority (higher priority first)
   */
  private insertByPriority(task: Task<T>): void {
    const priority = task.priority || 0;
    let insertIndex = this.queue.length;

    for (let i = 0; i < this.queue.length; i++) {
      if ((this.queue[i].priority || 0) < priority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, task);
  }

  /**
   * Record processing time for metrics
   */
  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);

    // Keep only last 100 processing times for average calculation
    if (this.processingTimes.length > 100) {
      this.processingTimes = this.processingTimes.slice(-100);
    }
  }

  private recordCompletion(): void {
    const now = Date.now();
    this.completionTimestamps.push(now);

    const tenSecondsAgo = now - 10000;
    this.completionTimestamps = this.completionTimestamps.filter(
      (timestamp) => timestamp >= tenSecondsAgo
    );

    this.metrics.currentThroughput = this.completionTimestamps.length / 10;
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.activeWorkers = this.activeWorkers.size;
    this.metrics.queueLength = this.queue.length;

    // Calculate average processing time
    if (this.processingTimes.length > 0) {
      this.metrics.averageProcessingTime =
        this.processingTimes.reduce((a, b) => a + b, 0) /
        this.processingTimes.length;
    } else {
      this.metrics.averageProcessingTime = 0;
    }

    // Update rate limit status
    this.metrics.rateLimitStatus = this.rateLimiter.getAllStatuses();
  }
}

/**
 * Factory function to create a concurrency controller with common configurations
 */
export function createConcurrencyController<T, R>(
  taskProcessor: TaskProcessor<T, R>,
  options: {
    maxConcurrency?: number;
    maxQueueSize?: number;
    taskTimeout?: number;
    enablePriority?: boolean;
    rateLimits?: Record<string, any>;
  } = {}
): ConcurrencyController<T, R> {
  const config: WorkerConfig = {
    maxConcurrency: options.maxConcurrency || 5,
    maxQueueSize: options.maxQueueSize || 1000,
    taskTimeout: options.taskTimeout || 30000,
    enablePriority: options.enablePriority || false,
  };

  const rateLimiter = options.rateLimits
    ? new MultiModelRateLimiter(options.rateLimits)
    : undefined;

  return new ConcurrencyController(taskProcessor, config, rateLimiter);
}
