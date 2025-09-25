import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ConcurrencyController,
  createConcurrencyController,
  Task,
} from '../src/utils/concurrency-controller';
import { MultiModelRateLimiter } from '../src/utils/rate-limiter';

// Helper for controlled promises (latches)
class Deferred<T = void> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

describe('ConcurrencyController', () => {
  let controller: ConcurrencyController<string, string>;
  let mockProcessor: vi.MockedFunction<(task: Task<string>) => Promise<string>>;

  beforeEach(() => {
    mockProcessor = vi.fn();
    controller = new ConcurrencyController(mockProcessor, {
      maxConcurrency: 2,
      maxQueueSize: 10,
      taskTimeout: 5000,
      enablePriority: true,
    });
  });

  afterEach(async () => {
    await controller.shutdown(1000);
  });

  describe('Basic Task Processing', () => {
    it('should process tasks with limited concurrency', async () => {
      mockProcessor.mockResolvedValue('result');

      const task1: Task<string> = { id: '1', data: 'task1' };
      const task2: Task<string> = { id: '2', data: 'task2' };
      const task3: Task<string> = { id: '3', data: 'task3' };

      await controller.addTasks([task1, task2, task3]);

      // Process all tasks
      await vi.runAllTimersAsync();

      expect(mockProcessor).toHaveBeenCalledTimes(3);
      expect(mockProcessor).toHaveBeenCalledWith(task1);
      expect(mockProcessor).toHaveBeenCalledWith(task2);
      expect(mockProcessor).toHaveBeenCalledWith(task3);
    });

    it('should respect max concurrency limit', async () => {
      // Create a controller with maxConcurrency = 1
      const limitedController = new ConcurrencyController(mockProcessor, {
        maxConcurrency: 1,
      });

      // Create controlled promises (latches)
      const firstDeferred = new Deferred<string>();
      const secondDeferred = new Deferred<string>();
      const thirdDeferred = new Deferred<string>();

      // Reset mock to ensure clean state
      mockProcessor.mockReset();
      mockProcessor
        .mockImplementationOnce(() => firstDeferred.promise)
        .mockImplementationOnce(() => secondDeferred.promise)
        .mockImplementationOnce(() => thirdDeferred.promise);

      const task1: Task<string> = { id: 'task1', data: 'task1' };
      const task2: Task<string> = { id: 'task2', data: 'task2' };
      const task3: Task<string> = { id: 'task3', data: 'task3' };

      // Add first task - it should start processing immediately
      await limitedController.addTask(task1);

      // First task should start processing immediately
      expect(mockProcessor).toHaveBeenCalledTimes(1);

      // Add second task - it should be queued since maxConcurrency is 1
      await limitedController.addTask(task2);

      // Assert mid-flight state: 1 active, 1 queued
      const metrics1 = limitedController.getMetrics();
      expect(metrics1.activeWorkers).toBe(1);
      expect(metrics1.queueLength).toBe(1);
      expect(mockProcessor).toHaveBeenCalledTimes(1);

      // Add third task - it should also be queued
      await limitedController.addTask(task3);

      // Assert mid-flight state: 1 active, 2 queued
      const metrics2 = limitedController.getMetrics();
      expect(metrics2.activeWorkers).toBe(1);
      expect(metrics2.queueLength).toBe(2);
      expect(mockProcessor).toHaveBeenCalledTimes(1);

      // Resolve first task to free up a worker
      firstDeferred.resolve('result1');
      await firstDeferred.promise;

      // Wait a bit for the async processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second task should now start
      expect(mockProcessor).toHaveBeenCalledTimes(2);

      // Resolve second task
      secondDeferred.resolve('result2');
      await secondDeferred.promise;

      // Wait a bit for the async processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Third task should now start
      expect(mockProcessor).toHaveBeenCalledTimes(3);

      // Resolve third task
      thirdDeferred.resolve('result3');
      await thirdDeferred.promise;

      await limitedController.shutdown();
    });

    it('should handle task failures and retries', async () => {
      mockProcessor
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValue('result');

      const task: Task<string> = {
        id: '1',
        data: 'task1',
        maxRetries: 1,
      };

      await controller.addTask(task);
      await vi.runAllTimersAsync();

      // Should be called twice (original + retry)
      expect(mockProcessor).toHaveBeenCalledTimes(2);
    });

    it('should not retry beyond max retries', async () => {
      mockProcessor.mockRejectedValue(new Error('Always fails'));

      const task: Task<string> = {
        id: '1',
        data: 'task1',
        maxRetries: 2,
      };

      await controller.addTask(task);
      await vi.runAllTimersAsync();

      // Should be called 3 times (original + 2 retries)
      expect(mockProcessor).toHaveBeenCalledTimes(3);
    });
  });

  describe('Priority Queue', () => {
    it('should process higher priority tasks first', async () => {
      // Create a controller with priority enabled and maxConcurrency = 1
      const priorityController = new ConcurrencyController(mockProcessor, {
        maxConcurrency: 1,
        enablePriority: true,
      });

      // Create controlled promises (latches)
      const firstDeferred = new Deferred<string>();
      const secondDeferred = new Deferred<string>();
      const thirdDeferred = new Deferred<string>();

      mockProcessor
        .mockImplementationOnce(() => firstDeferred.promise)
        .mockImplementationOnce(() => secondDeferred.promise)
        .mockImplementationOnce(() => thirdDeferred.promise);

      const lowPriority: Task<string> = { id: '1', data: 'low', priority: 1 };
      const highPriority: Task<string> = {
        id: '2',
        data: 'high',
        priority: 10,
      };
      const mediumPriority: Task<string> = {
        id: '3',
        data: 'medium',
        priority: 5,
      };

      // Add first task - it starts immediately (no priority queuing yet)
      await priorityController.addTask(lowPriority);
      expect(mockProcessor).toHaveBeenCalledTimes(1);
      expect(mockProcessor).toHaveBeenNthCalledWith(1, lowPriority);

      // Add remaining tasks - they get queued
      await priorityController.addTask(highPriority);
      await priorityController.addTask(mediumPriority);

      // Assert mid-flight state: 1 active, 2 queued
      const metrics = priorityController.getMetrics();
      expect(metrics.activeWorkers).toBe(1);
      expect(metrics.queueLength).toBe(2);

      // Resolve first task to free up a worker
      firstDeferred.resolve('low-result');
      await firstDeferred.promise;

      // Wait a bit for the async processing to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Next task should be highest priority among queued (high priority)
      expect(mockProcessor).toHaveBeenCalledTimes(2);
      expect(mockProcessor).toHaveBeenNthCalledWith(2, highPriority);

      // Resolve second task
      secondDeferred.resolve('high-result');
      await secondDeferred.promise;

      // Wait a bit for the async processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Next task should be medium priority
      expect(mockProcessor).toHaveBeenCalledTimes(3);
      expect(mockProcessor).toHaveBeenNthCalledWith(3, mediumPriority);

      // Resolve third task
      thirdDeferred.resolve('medium-result');
      await thirdDeferred.promise;

      await priorityController.shutdown();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should respect rate limits when processing tasks', async () => {
      const rateLimiter = new MultiModelRateLimiter();
      rateLimiter.getLimiter('gpt-4', { rpm: 60, burstCapacity: 1 });

      const controllerWithRateLimit = new ConcurrencyController(
        mockProcessor,
        { maxConcurrency: 2 },
        rateLimiter
      );

      mockProcessor.mockResolvedValue('result');

      const task1: Task<string> = { id: '1', data: 'task1', model: 'gpt-4' };
      const task2: Task<string> = { id: '2', data: 'task2', model: 'gpt-4' };

      await controllerWithRateLimit.addTask(task1);
      await controllerWithRateLimit.addTask(task2);

      await vi.runAllTimersAsync();

      // Both tasks should process (rate limiter allows burst of 1, but we're testing with 2)
      // The rate limiter will allow the first request, then reject the second
      expect(mockProcessor).toHaveBeenCalledTimes(2);

      await controllerWithRateLimit.shutdown();
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track processing metrics', async () => {
      // Create a controller with maxConcurrency = 1 to force queueing
      const metricsController = new ConcurrencyController(mockProcessor, {
        maxConcurrency: 1,
      });

      // Create controlled promises (latches)
      const firstDeferred = new Deferred<string>();
      const secondDeferred = new Deferred<string>();

      mockProcessor
        .mockImplementationOnce(() => firstDeferred.promise)
        .mockImplementationOnce(() => secondDeferred.promise);

      const task1: Task<string> = { id: '1', data: 'task1' };
      const task2: Task<string> = { id: '2', data: 'task2' };

      // Add first task - it should start processing immediately
      await metricsController.addTask(task1);

      // Add second task - it should be queued
      await metricsController.addTask(task2);

      // Assert mid-flight gauges: 1 active, 1 queued
      const midFlightMetrics = metricsController.getMetrics();
      expect(midFlightMetrics.activeWorkers).toBe(1); // One task being processed
      expect(midFlightMetrics.queueLength).toBe(1); // One task in queue
      expect(midFlightMetrics.totalProcessed).toBe(0); // Not completed yet

      // Complete the first task
      firstDeferred.resolve('result1');
      await firstDeferred.promise;

      // Wait a bit for the async processing to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert after first completion: 1 active, 0 queued
      const afterFirstMetrics = metricsController.getMetrics();
      expect(afterFirstMetrics.activeWorkers).toBe(1); // Second task now processing
      expect(afterFirstMetrics.queueLength).toBe(0); // Queue should be empty
      expect(afterFirstMetrics.totalProcessed).toBe(1); // First task completed
      // Note: averageProcessingTime is only calculated after tasks complete

      // Complete the second task
      secondDeferred.resolve('result2');
      await secondDeferred.promise;

      // Wait a bit for the async processing to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert final counters
      const finalMetrics = metricsController.getMetrics();
      expect(finalMetrics.totalProcessed).toBe(2); // Both tasks completed
      expect(finalMetrics.activeWorkers).toBe(0); // No active workers
      expect(finalMetrics.queueLength).toBe(0); // No queued tasks
      expect(finalMetrics.averageProcessingTime).toBeGreaterThan(0);

      await metricsController.shutdown();
    });

    it('should track failed tasks', async () => {
      mockProcessor.mockRejectedValue(new Error('Task failed'));

      const task: Task<string> = { id: '1', data: 'task1', maxRetries: 0 };
      await controller.addTask(task);
      await vi.runAllTimersAsync();

      const metrics = controller.getMetrics();
      expect(metrics.totalFailed).toBe(1);
    });

    it('should calculate throughput', async () => {
      mockProcessor.mockResolvedValue('result');

      // Add multiple tasks
      for (let i = 0; i < 5; i++) {
        await controller.addTask({ id: i.toString(), data: `task${i}` });
      }

      await vi.runAllTimersAsync();

      const metrics = controller.getMetrics();
      expect(metrics.currentThroughput).toBeGreaterThan(0);
    });
  });

  describe('Queue Management', () => {
    it('should reject tasks when queue is full', async () => {
      const controller = new ConcurrencyController(mockProcessor, {
        maxConcurrency: 1,
        maxQueueSize: 2,
      });

      // Create controlled promise (latch)
      const taskDeferred = new Deferred<string>();
      mockProcessor.mockImplementation(() => taskDeferred.promise);

      // Add first task - it starts processing immediately
      await controller.addTask({ id: '1', data: 'task1' });

      // Add second task - it gets queued
      await controller.addTask({ id: '2', data: 'task2' });

      // Add third task - it gets queued (queue now has 2 tasks)
      await controller.addTask({ id: '3', data: 'task3' });

      // Assert mid-flight state: 1 active, 2 queued (capacity = 3)
      const metrics = controller.getMetrics();
      expect(metrics.activeWorkers).toBe(1);
      expect(metrics.queueLength).toBe(2);

      // This should be rejected (capacity is now full: 1 active + 2 queued = 3)
      await expect(
        controller.addTask({ id: '4', data: 'task4' })
      ).rejects.toThrow('Queue is full');

      // Clean up
      taskDeferred.resolve('result');
      await controller.shutdown();
    });

    it('should return queue status', async () => {
      // Create a controller with maxConcurrency = 1 to force queueing
      const statusController = new ConcurrencyController(mockProcessor, {
        maxConcurrency: 1,
      });

      // Create controlled promise (latch)
      const taskDeferred = new Deferred<string>();
      mockProcessor.mockImplementation(() => taskDeferred.promise);

      const task1: Task<string> = { id: '1', data: 'task1' };
      const task2: Task<string> = { id: '2', data: 'task2' };

      // Add first task - it starts processing immediately
      await statusController.addTask(task1);

      // Add second task - it gets queued
      await statusController.addTask(task2);

      const status = statusController.getQueueStatus();
      expect(status.length).toBe(1); // One task in queue, one being processed
      expect(status.tasks).toContain(task2); // task2 should be in queue

      // Clean up
      taskDeferred.resolve('result');
      await statusController.shutdown();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });

      mockProcessor.mockImplementation(() => taskPromise);

      await controller.addTask({ id: '1', data: 'task1' });

      // Start shutdown
      const shutdownPromise = controller.shutdown(1000);

      // Resolve the task
      resolveTask!();
      await vi.runAllTimersAsync();

      await shutdownPromise;

      // Should have processed the task
      expect(mockProcessor).toHaveBeenCalledTimes(1);
    });

    it('should reject new tasks during shutdown', async () => {
      await controller.shutdown(1000);

      await expect(
        controller.addTask({ id: '1', data: 'task1' })
      ).rejects.toThrow('ConcurrencyController is shutting down');
    });
  });

  describe('Events', () => {
    it('should emit task events', async () => {
      const events: string[] = [];

      controller.on('taskQueued', () => events.push('queued'));
      controller.on('taskStarted', () => events.push('started'));
      controller.on('taskCompleted', () => events.push('completed'));

      mockProcessor.mockResolvedValue('result');

      await controller.addTask({ id: '1', data: 'task1' });
      await vi.runAllTimersAsync();

      expect(events).toContain('queued');
      expect(events).toContain('started');
      expect(events).toContain('completed');
    });

    it('should emit failure events', async () => {
      const events: string[] = [];

      controller.on('taskFailed', () => events.push('failed'));
      controller.on('taskRetry', () => events.push('retry'));

      mockProcessor.mockRejectedValue(new Error('Task failed'));

      const task: Task<string> = { id: '1', data: 'task1', maxRetries: 1 };
      await controller.addTask(task);
      await vi.runAllTimersAsync();

      expect(events).toContain('failed');
      expect(events).toContain('retry');
    });
  });
});

describe('createConcurrencyController', () => {
  it('should create controller with default options', () => {
    const mockProcessor = vi.fn();
    const controller = createConcurrencyController(mockProcessor);

    expect(controller).toBeInstanceOf(ConcurrencyController);
  });

  it('should create controller with custom options', () => {
    const mockProcessor = vi.fn();
    const controller = createConcurrencyController(mockProcessor, {
      maxConcurrency: 10,
      maxQueueSize: 100,
      enablePriority: true,
    });

    expect(controller).toBeInstanceOf(ConcurrencyController);
  });

  it('should create controller with rate limits', () => {
    const mockProcessor = vi.fn();
    const controller = createConcurrencyController(mockProcessor, {
      rateLimits: {
        'gpt-4': { rpm: 60, burstCapacity: 5 },
        'gpt-3.5-turbo': { rpm: 120, burstCapacity: 10 },
      },
    });

    expect(controller).toBeInstanceOf(ConcurrencyController);
  });
});
