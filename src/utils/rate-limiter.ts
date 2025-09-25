/**
 * Rate Limiter with Token Bucket Algorithm
 * Supports both RPM (Requests Per Minute) and TPM (Tokens Per Minute) limiting
 */

export interface RateLimitConfig {
  /** Requests per minute limit */
  rpm?: number;
  /** Tokens per minute limit */
  tpm?: number;
  /** Burst capacity (max tokens in bucket) */
  burstCapacity?: number;
  /** Model identifier for per-model limits */
  model?: string;
}

export interface RateLimitStatus {
  /** Whether the request can proceed immediately */
  allowed: boolean;
  /** Time to wait before retry (in milliseconds) */
  retryAfter?: number;
  /** Current token count in bucket */
  tokensRemaining: number;
  /** Total capacity of the bucket */
  bucketCapacity: number;
  /** Time until next token refill */
  nextRefillAt?: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly config: Required<RateLimitConfig>;
  private readonly refillRate: number; // tokens per millisecond

  constructor(config: RateLimitConfig) {
    this.config = {
      rpm: config.rpm || 60,
      tpm: config.tpm || 90000, // Default OpenAI TPM
      burstCapacity: config.burstCapacity || Math.max(config.rpm || 60, 10),
      model: config.model || 'default',
    };

    // Use RPM as the primary rate limiting mechanism
    // TPM will be handled separately in the concurrency controller
    this.refillRate = this.config.rpm / 60000; // requests per millisecond

    this.tokens = this.config.burstCapacity;
    this.lastRefill = Date.now();
  }

  /**
   * Check if a request can proceed and consume tokens
   */
  tryConsume(tokensRequested: number = 1): RateLimitStatus {
    this.refillTokens();

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return {
        allowed: true,
        tokensRemaining: this.tokens,
        bucketCapacity: this.config.burstCapacity,
      };
    }

    // Calculate when we'll have enough tokens
    const tokensNeeded = tokensRequested - this.tokens;
    const timeToWait = Math.ceil(tokensNeeded / this.refillRate);
    const nextRefillAt = Date.now() + timeToWait;

    return {
      allowed: false,
      retryAfter: timeToWait,
      tokensRemaining: this.tokens,
      bucketCapacity: this.config.burstCapacity,
      nextRefillAt,
    };
  }

  /**
   * Get current status without consuming tokens
   */
  getStatus(): RateLimitStatus {
    this.refillTokens();
    return {
      allowed: this.tokens > 0,
      tokensRemaining: this.tokens,
      bucketCapacity: this.config.burstCapacity,
    };
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(
      this.config.burstCapacity,
      this.tokens + tokensToAdd
    );
    this.lastRefill = now;
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.tokens = this.config.burstCapacity;
    this.lastRefill = Date.now();
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): Required<RateLimitConfig> {
    return { ...this.config };
  }
}

/**
 * Multi-model rate limiter that manages different limits per model
 */
export class MultiModelRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();
  private defaultConfig: RateLimitConfig;

  constructor(defaultConfig: RateLimitConfig = {}) {
    this.defaultConfig = defaultConfig;
  }

  /**
   * Get or create a rate limiter for a specific model
   */
  getLimiter(model: string, config?: RateLimitConfig): RateLimiter {
    if (!this.limiters.has(model)) {
      const modelConfig = { ...this.defaultConfig, ...config, model };
      this.limiters.set(model, new RateLimiter(modelConfig));
    }
    return this.limiters.get(model)!;
  }

  /**
   * Try to consume tokens for a specific model
   */
  tryConsume(
    model: string,
    tokensRequested: number = 1,
    config?: RateLimitConfig
  ): RateLimitStatus {
    const limiter = this.getLimiter(model, config);
    return limiter.tryConsume(tokensRequested);
  }

  /**
   * Get status for all models
   */
  getAllStatuses(): Record<string, RateLimitStatus> {
    const statuses: Record<string, RateLimitStatus> = {};
    for (const [model, limiter] of this.limiters) {
      statuses[model] = limiter.getStatus();
    }
    return statuses;
  }

  /**
   * Reset all limiters
   */
  resetAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }
}

/**
 * Predefined rate limits for common OpenAI models
 */
export const OPENAI_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'gpt-4': {
    rpm: 500,
    tpm: 10000,
    burstCapacity: 50,
  },
  'gpt-4-turbo': {
    rpm: 500,
    tpm: 30000,
    burstCapacity: 100,
  },
  'gpt-3.5-turbo': {
    rpm: 3500,
    tpm: 90000,
    burstCapacity: 200,
  },
  'gpt-3.5-turbo-16k': {
    rpm: 3500,
    tpm: 180000,
    burstCapacity: 200,
  },
  'text-davinci-003': {
    rpm: 3500,
    tpm: 90000,
    burstCapacity: 200,
  },
  'text-embedding-ada-002': {
    rpm: 3000,
    tpm: 150000,
    burstCapacity: 100,
  },
};
