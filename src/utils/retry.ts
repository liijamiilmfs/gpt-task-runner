import { ErrorCodes, ErrorInfo, RetryConfig } from '../types';

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly errorInfo: ErrorInfo,
    public readonly attemptCount: number
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly failureCount: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly timeoutMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN. Last failure: ${new Date(
            this.lastFailureTime
          ).toISOString()}`,
          this.failureCount
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): { state: string; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

export class RetryManager {
  private circuitBreaker: CircuitBreaker;

  constructor(
    private readonly config: RetryConfig,
    circuitBreakerThreshold: number = 5
  ) {
    this.circuitBreaker = new CircuitBreaker(
      circuitBreakerThreshold,
      config.timeoutMs
    );
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string = 'unknown'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Use circuit breaker for the operation
        const result = await this.circuitBreaker.execute(operation);
        return result;
      } catch (error) {
        lastError = error as Error;
        const errorInfo = this.classifyError(error as Error);

        // Don't retry if error is not retryable
        if (!errorInfo.isRetryable) {
          throw new RetryError(errorInfo.message, errorInfo, attempt + 1);
        }

        // Don't retry if we've exhausted attempts
        if (attempt === this.config.maxRetries) {
          throw new RetryError(errorInfo.message, errorInfo, attempt + 1);
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);

        console.warn(
          `Attempt ${attempt + 1}/${this.config.maxRetries + 1} failed for ${operationId}: ${errorInfo.message}. Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    // This should never be reached due to the logic above, but just in case
    const errorInfo = this.classifyError(
      lastError || new Error('Unknown error occurred')
    );
    throw new RetryError(
      errorInfo.message,
      errorInfo,
      this.config.maxRetries + 1
    );
  }

  private classifyError(error: Error): ErrorInfo {
    const message = error.message.toLowerCase();

    // Handle circuit breaker errors - these should be retryable
    if (
      error.name === 'CircuitBreakerError' ||
      message.includes('circuit breaker')
    ) {
      return {
        code: ErrorCodes.SERVER_ERROR,
        message: 'Circuit breaker is open',
        isRetryable: true,
        originalError: error,
      };
    }

    // OpenAI API specific error patterns
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        code: ErrorCodes.RATE_LIMIT,
        message: 'Rate limit exceeded',
        isRetryable: true,
        httpStatus: 429,
        originalError: error,
      };
    }

    if (message.includes('timeout') || message.includes('etimedout')) {
      return {
        code: ErrorCodes.TIMEOUT,
        message: 'Request timeout',
        isRetryable: true,
        originalError: error,
      };
    }

    if (
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('api key')
    ) {
      return {
        code: ErrorCodes.AUTH,
        message: 'Authentication failed',
        isRetryable: false,
        httpStatus: 401,
        originalError: error,
      };
    }

    if (
      message.includes('quota') ||
      message.includes('billing') ||
      message.includes('payment')
    ) {
      return {
        code: ErrorCodes.QUOTA,
        message: 'Quota exceeded or billing issue',
        isRetryable: false,
        originalError: error,
      };
    }

    if (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return {
        code: ErrorCodes.SERVER_ERROR,
        message: 'Server error',
        isRetryable: true,
        httpStatus: parseInt(
          message.match(/\b(500|502|503|504)\b/)?.[1] || '500'
        ),
        originalError: error,
      };
    }

    if (
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('enotfound')
    ) {
      return {
        code: ErrorCodes.NETWORK,
        message: 'Network error',
        isRetryable: true,
        originalError: error,
      };
    }

    if (
      message.includes('invalid') ||
      message.includes('bad request') ||
      message.includes('must be provided')
    ) {
      return {
        code: ErrorCodes.INPUT,
        message: 'Invalid input or bad request',
        isRetryable: false,
        httpStatus: 400,
        originalError: error,
      };
    }

    return {
      code: ErrorCodes.UNKNOWN,
      message: 'Unknown error',
      isRetryable: true, // Default to retryable for unknown errors
      originalError: error,
    };
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
    const exponentialDelay =
      this.config.baseDelayMs *
      Math.pow(this.config.backoffMultiplier, attempt);

    // Cap at maxDelayMs
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * this.config.jitterMs;

    return Math.floor(cappedDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset the retry manager state (useful for testing)
   */
  reset() {
    this.circuitBreaker = new CircuitBreaker(
      this.config.maxRetries,
      this.config.timeoutMs
    );
  }
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitterMs: 500, // 0.5 seconds of jitter
  timeoutMs: 60000, // 1 minute timeout
};
