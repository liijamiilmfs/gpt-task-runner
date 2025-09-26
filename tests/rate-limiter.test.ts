import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RateLimiter,
  MultiModelRateLimiter,
  OPENAI_RATE_LIMITS,
} from '../src/utils/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 10 });

      const result = rateLimiter.tryConsume(1);
      expect(result.allowed).toBe(true);
      expect(result.tokensRemaining).toBe(9);
    });

    it('should reject requests when rate limit exceeded', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 2 });

      // Consume all tokens
      expect(rateLimiter.tryConsume(2).allowed).toBe(true);

      // Next request should be rejected
      const result = rateLimiter.tryConsume(1);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it('should refill tokens over time', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 2 });

      // Consume all tokens
      rateLimiter.tryConsume(2);

      // Advance time by 1 second (should refill 1 token)
      vi.advanceTimersByTime(1000);

      const result = rateLimiter.tryConsume(1);
      expect(result.allowed).toBe(true);
      expect(result.tokensRemaining).toBe(0);
    });

    it('should handle burst capacity correctly', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 5 });

      // Should be able to consume up to burst capacity
      expect(rateLimiter.tryConsume(5).allowed).toBe(true);
      expect(rateLimiter.tryConsume(1).allowed).toBe(false);
    });
  });

  describe('Token Refill', () => {
    it('should refill tokens at correct rate', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 10 });

      // Consume all tokens
      rateLimiter.tryConsume(10);

      // Advance by 1 second (60 RPM = 1 per second)
      vi.advanceTimersByTime(1000);

      const result = rateLimiter.tryConsume(1);
      expect(result.allowed).toBe(true);
      expect(result.tokensRemaining).toBe(0);
    });

    it('should not exceed burst capacity when refilling', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 5 });

      // Advance by 10 seconds (should refill 10 tokens, but capped at 5)
      vi.advanceTimersByTime(10000);

      const result = rateLimiter.tryConsume(5);
      expect(result.allowed).toBe(true);
      expect(result.tokensRemaining).toBe(0);
    });
  });

  describe('RPM Rate Limiting', () => {
    it('should limit based on RPM configuration', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 1 });

      // Should be limited by burst capacity (1 token)
      expect(rateLimiter.tryConsume(1).allowed).toBe(true);
      expect(rateLimiter.tryConsume(1).allowed).toBe(false);
    });

    it('should handle different RPM limits', () => {
      rateLimiter = new RateLimiter({ rpm: 120, burstCapacity: 2 });

      // Should be limited by burst capacity (2 tokens)
      expect(rateLimiter.tryConsume(1).allowed).toBe(true);
      expect(rateLimiter.tryConsume(1).allowed).toBe(true);
      expect(rateLimiter.tryConsume(1).allowed).toBe(false);
    });
  });

  describe('Status and Configuration', () => {
    it('should return correct status without consuming tokens', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 5 });

      const status = rateLimiter.getStatus();
      expect(status.allowed).toBe(true);
      expect(status.tokensRemaining).toBe(5);
      expect(status.bucketCapacity).toBe(5);
    });

    it('should reset correctly', () => {
      rateLimiter = new RateLimiter({ rpm: 60, burstCapacity: 5 });

      // Consume some tokens
      rateLimiter.tryConsume(3);
      expect(rateLimiter.getStatus().tokensRemaining).toBe(2);

      // Reset
      rateLimiter.reset();
      expect(rateLimiter.getStatus().tokensRemaining).toBe(5);
    });

    it('should return correct configuration', () => {
      const config = { rpm: 100, tpm: 5000, burstCapacity: 10, model: 'test' };
      rateLimiter = new RateLimiter(config);

      const returnedConfig = rateLimiter.getConfig();
      expect(returnedConfig).toEqual(config);
    });
  });
});

describe('MultiModelRateLimiter', () => {
  let multiLimiter: MultiModelRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    multiLimiter = new MultiModelRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create separate limiters for different models', () => {
    const gpt4Limiter = multiLimiter.getLimiter('gpt-4', {
      rpm: 60,
      burstCapacity: 5,
    });
    const gpt35Limiter = multiLimiter.getLimiter('gpt-3.5-turbo', {
      rpm: 120,
      burstCapacity: 10,
    });

    expect(gpt4Limiter).toBeDefined();
    expect(gpt35Limiter).toBeDefined();
    expect(gpt4Limiter).not.toBe(gpt35Limiter);
  });

  it('should reuse existing limiters for the same model', () => {
    const limiter1 = multiLimiter.getLimiter('gpt-4', { rpm: 60 });
    const limiter2 = multiLimiter.getLimiter('gpt-4', { rpm: 60 });

    expect(limiter1).toBe(limiter2);
  });

  it('should try consume for specific models', () => {
    multiLimiter.getLimiter('gpt-4', { rpm: 60, burstCapacity: 2 });

    const result = multiLimiter.tryConsume('gpt-4', 1);
    expect(result.allowed).toBe(true);

    const result2 = multiLimiter.tryConsume('gpt-4', 2);
    expect(result2.allowed).toBe(false);
  });

  it('should return status for all models', () => {
    multiLimiter.getLimiter('gpt-4', { rpm: 60, burstCapacity: 5 });
    multiLimiter.getLimiter('gpt-3.5-turbo', { rpm: 120, burstCapacity: 10 });

    const statuses = multiLimiter.getAllStatuses();
    expect(statuses).toHaveProperty('gpt-4');
    expect(statuses).toHaveProperty('gpt-3.5-turbo');
    expect(statuses['gpt-4'].allowed).toBe(true);
    expect(statuses['gpt-3.5-turbo'].allowed).toBe(true);
  });

  it('should reset all limiters', () => {
    multiLimiter.getLimiter('gpt-4', { rpm: 60, burstCapacity: 2 });
    multiLimiter.tryConsume('gpt-4', 2); // Consume all tokens

    multiLimiter.resetAll();

    const result = multiLimiter.tryConsume('gpt-4', 2);
    expect(result.allowed).toBe(true);
  });
});

describe('OPENAI_RATE_LIMITS', () => {
  it('should have predefined limits for common models', () => {
    expect(OPENAI_RATE_LIMITS).toHaveProperty('gpt-4');
    expect(OPENAI_RATE_LIMITS).toHaveProperty('gpt-3.5-turbo');
    expect(OPENAI_RATE_LIMITS).toHaveProperty('text-davinci-003');
  });

  it('should have reasonable rate limits', () => {
    const gpt4Limits = OPENAI_RATE_LIMITS['gpt-4'];
    expect(gpt4Limits.rpm).toBeGreaterThan(0);
    expect(gpt4Limits.tpm).toBeGreaterThan(0);
    expect(gpt4Limits.burstCapacity).toBeGreaterThan(0);
  });

  it('should work with MultiModelRateLimiter', () => {
    const multiLimiter = new MultiModelRateLimiter();

    // Create limiters using predefined limits
    const gpt4Limiter = multiLimiter.getLimiter(
      'gpt-4',
      OPENAI_RATE_LIMITS['gpt-4']
    );
    const gpt35Limiter = multiLimiter.getLimiter(
      'gpt-3.5-turbo',
      OPENAI_RATE_LIMITS['gpt-3.5-turbo']
    );

    expect(gpt4Limiter).toBeDefined();
    expect(gpt35Limiter).toBeDefined();

    // Test that they have different configurations
    expect(gpt4Limiter.getConfig().rpm).not.toBe(gpt35Limiter.getConfig().rpm);
  });
});
