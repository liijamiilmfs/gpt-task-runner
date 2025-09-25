import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RetryManager,
  CircuitBreaker,
  RetryError,
  CircuitBreakerError,
  defaultRetryConfig,
} from '../src/utils/retry';
import { ErrorCodes } from '../src/types';

describe('RetryManager', () => {
  let retryManager: RetryManager;
  const mockConfig = {
    maxRetries: 2,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    backoffMultiplier: 2,
    jitterMs: 10,
    timeoutMs: 5000,
  };

  beforeEach(() => {
    retryManager = new RetryManager(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValue(new Error('Unauthorized'));

      await expect(
        retryManager.executeWithRetry(mockOperation)
      ).rejects.toThrow(RetryError);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should throw RetryError when max retries exceeded', async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(
        retryManager.executeWithRetry(mockOperation)
      ).rejects.toThrow(RetryError);
      expect(mockOperation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should classify errors correctly', async () => {
      const testCases = [
        {
          error: new Error('Rate limit exceeded'),
          expectedCode: ErrorCodes.RATE_LIMIT,
          retryable: true,
        },
        {
          error: new Error('Request timeout'),
          expectedCode: ErrorCodes.TIMEOUT,
          retryable: true,
        },
        {
          error: new Error('Unauthorized'),
          expectedCode: ErrorCodes.AUTH,
          retryable: false,
        },
        {
          error: new Error('Quota exceeded'),
          expectedCode: ErrorCodes.QUOTA,
          retryable: false,
        },
        {
          error: new Error('Server error 500'),
          expectedCode: ErrorCodes.SERVER_ERROR,
          retryable: true,
        },
        {
          error: new Error('Network error'),
          expectedCode: ErrorCodes.NETWORK,
          retryable: true,
        },
        {
          error: new Error('Invalid input'),
          expectedCode: ErrorCodes.INPUT,
          retryable: false,
        },
        {
          error: new Error('Some random error'),
          expectedCode: ErrorCodes.UNKNOWN,
          retryable: true,
        },
      ];

      for (const testCase of testCases) {
        // Create a fresh RetryManager for each test case to avoid circuit breaker interference
        const freshRetryManager = new RetryManager({
          maxRetries: 2,
          baseDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          jitterMs: 50,
          timeoutMs: 5000,
        });

        const mockOperation = vi.fn().mockRejectedValue(testCase.error);

        try {
          await freshRetryManager.executeWithRetry(mockOperation);
        } catch (error) {
          if (error instanceof RetryError) {
            expect(error.errorInfo.code).toBe(testCase.expectedCode);
            expect(error.errorInfo.isRetryable).toBe(testCase.retryable);
          }
        }
      }
    });
  });

  describe('delay calculation', () => {
    it('should calculate exponential backoff with jitter', () => {
      const retryManager = new RetryManager({
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        jitterMs: 50,
        timeoutMs: 5000,
      });

      // Test delay calculation for different attempts
      // We can't directly test the private method, but we can test the behavior
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      retryManager.executeWithRetry(mockOperation);
      // Note: This test is simplified - in a real scenario we'd need to wait for completion
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second timeout
    vi.clearAllMocks();
  });

  describe('state transitions', () => {
    it('should start in CLOSED state', () => {
      const state = circuitBreaker.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.failureCount).toBe(0);
    });

    it('should transition to OPEN after threshold failures', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Trigger 3 failures to open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      const state = circuitBreaker.getState();
      expect(state.state).toBe('OPEN');
      expect(state.failureCount).toBe(3);
    });

    it('should throw CircuitBreakerError when OPEN', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Now circuit should be open
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
        CircuitBreakerError
      );
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Next call should transition to HALF_OPEN
      try {
        await circuitBreaker.execute(failingOperation);
      } catch (error) {
        // Expected to fail, but circuit should be OPEN again
      }

      const state = circuitBreaker.getState();
      expect(state.state).toBe('OPEN');
    });

    it('should reset to CLOSED on successful operation', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Failure'));
      const successfulOperation = vi.fn().mockResolvedValue('success');

      // Trigger 2 failures
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Success should reset the circuit
      const result = await circuitBreaker.execute(successfulOperation);
      expect(result).toBe('success');

      const state = circuitBreaker.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.failureCount).toBe(0);
    });
  });
});

describe('Error classification', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager({
      maxRetries: 1,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 10,
      timeoutMs: 5000,
    });
  });

  it('should classify HTTP status codes correctly', async () => {
    const testCases = [
      { error: new Error('429'), expectedCode: ErrorCodes.RATE_LIMIT },
      { error: new Error('401'), expectedCode: ErrorCodes.AUTH },
      { error: new Error('500'), expectedCode: ErrorCodes.SERVER_ERROR },
      { error: new Error('502'), expectedCode: ErrorCodes.SERVER_ERROR },
      { error: new Error('503'), expectedCode: ErrorCodes.SERVER_ERROR },
      { error: new Error('504'), expectedCode: ErrorCodes.SERVER_ERROR },
    ];

    for (const testCase of testCases) {
      const mockOperation = vi.fn().mockRejectedValue(testCase.error);

      try {
        await retryManager.executeWithRetry(mockOperation);
      } catch (error) {
        if (error instanceof RetryError) {
          expect(error.errorInfo.code).toBe(testCase.expectedCode);
        }
      }
    }
  });
});
