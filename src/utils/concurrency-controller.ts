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
  /** Maximum queue size before rejecting new tasks */
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
  private workers: Set<Promise<void>> = new Set();
  private queue: Task<T>[] = [];
  private metrics: ConcurrencyMetrics;
  private rateLimiter: MultiModelRateLimiter;
  private isShuttingDown = false;
  private config: Required<WorkerConfig>;
  private taskProcessor: TaskProcessor<T, R>;
  private processingTimes: number[] = [];
  private lastThroughputUpdate = Date.now();
  private throughputWindow: number[] = [];

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

    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error(`Queue is full (${this.config.maxQueueSize} tasks)`);
    }

    // Add to queue with priority handling
    if (this.config.enablePriority && task.priority !== undefined) {
      this.insertByPriority(task);
    } else {
      this.queue.push(task);
    }

    this.updateMetrics();
    this.emit('taskQueued', task);

    // Start processing if we have available workers
    this.processNext();
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

    // Wait for all workers to complete
    const startTime = Date.now();
    while (this.workers.size > 0 && Date.now() - startTime < timeoutMs) {
      await Promise.race(Array.from(this.workers));
    }

    // Force shutdown if timeout reached
    if (this.workers.size > 0) {
      this.emit('shutdownTimeout');
    }

    this.emit('shutdownComplete');
  }

  /**
   * Process the next task in the queue
   */
  private async processNext(): Promise<void> {
    if (
      this.workers.size >= this.config.maxConcurrency ||
      this.queue.length === 0
    ) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    const workerPromise = this.processTask(task);
    this.workers.add(workerPromise);

    workerPromise.finally(() => {
      this.workers.delete(workerPromise);
      this.updateMetrics();
      // Try to process more tasks
      this.processNext();
    });
  }

  /**
   * Process a single task
   */
  private async processTask(task: Task<T>): Promise<void> {
    const startTime = Date.now();
    this.updateMetrics();

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

      this.metrics.totalProcessed++;
      this.emit('taskCompleted', { task, result, processingTime });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);

      this.metrics.totalFailed++;
      this.emit('taskFailed', { task, error, processingTime });

      // Retry logic
      if (task.retryCount === undefined) task.retryCount = 0;
      if (task.maxRetries === undefined) task.maxRetries = 3;

      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        this.queue.unshift(task); // Re-queue for retry
        this.emit('taskRetry', { task, retryCount: task.retryCount });
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

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.activeWorkers = this.workers.size;
    this.metrics.queueLength = this.queue.length;

    // Calculate average processing time
    if (this.processingTimes.length > 0) {
      this.metrics.averageProcessingTime =
        this.processingTimes.reduce((a, b) => a + b, 0) /
        this.processingTimes.length;
    }

    // Calculate current throughput (tasks per second)
    const now = Date.now();
    this.throughputWindow.push(now);

    // Keep only last 10 seconds of data
    const tenSecondsAgo = now - 10000;
    this.throughputWindow = this.throughputWindow.filter(
      (time) => time > tenSecondsAgo
    );

    if (now - this.lastThroughputUpdate > 1000) {
      // Update every second
      this.metrics.currentThroughput = this.throughputWindow.length / 10;
      this.lastThroughputUpdate = now;
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

  const rateLimiter = new MultiModelRateLimiter();

  // Add rate limits for specific models if provided
  if (options.rateLimits) {
    for (const [model, limits] of Object.entries(options.rateLimits)) {
      rateLimiter.getLimiter(model, limits);
    }
  }

  return new ConcurrencyController(taskProcessor, config, rateLimiter);
}
