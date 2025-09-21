/**
 * Rate Limiter Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RateLimiter, RateLimitConfig } from '../../lib/rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  let config: RateLimitConfig

  beforeEach(() => {
    config = {
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100,
      maxRequestsPerDay: 1000,
      burstAllowance: 5
    }
    rateLimiter = new RateLimiter(config)
  })

  afterEach(() => {
    rateLimiter.destroy()
  })

  describe('User Rate Limiting', () => {
    it('should allow requests within burst limit', () => {
      const userId = 'test-user-1'
      
      // Should allow burst allowance requests
      for (let i = 0; i < config.burstAllowance; i++) {
        const result = rateLimiter.checkUserLimit(userId)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(config.burstAllowance - i - 1)
      }
    })

    it('should block requests after burst limit', () => {
      const userId = 'test-user-2'
      
      // Exhaust burst allowance
      for (let i = 0; i < config.burstAllowance; i++) {
        rateLimiter.checkUserLimit(userId)
      }
      
      // Next request should be blocked
      const result = rateLimiter.checkUserLimit(userId)
      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeDefined()
    })

    it('should refill tokens over time', async () => {
      const userId = 'test-user-3'
      
      // Exhaust all tokens
      for (let i = 0; i < config.burstAllowance; i++) {
        rateLimiter.checkUserLimit(userId)
      }
      
      // Should be blocked
      let result = rateLimiter.checkUserLimit(userId)
      expect(result.allowed).toBe(false)
      
      // Mock time passage (1 minute)
      const originalNow = Date.now
      Date.now = () => originalNow() + 60000
      
      // Should allow one more request
      result = rateLimiter.checkUserLimit(userId)
      expect(result.allowed).toBe(true)
      
      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Global Rate Limiting', () => {
    it('should allow requests within global burst limit', () => {
      // Should allow burst allowance requests
      for (let i = 0; i < config.burstAllowance; i++) {
        const result = rateLimiter.checkGlobalLimit()
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(config.burstAllowance - i - 1)
      }
    })

    it('should block requests after global burst limit', () => {
      // Exhaust global burst allowance
      for (let i = 0; i < config.burstAllowance; i++) {
        rateLimiter.checkGlobalLimit()
      }
      
      // Next request should be blocked
      const result = rateLimiter.checkGlobalLimit()
      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeDefined()
    })
  })

  describe('Combined Limits', () => {
    it('should check both user and global limits', () => {
      const userId = 'test-user-4'
      
      // Exhaust global limit
      for (let i = 0; i < config.burstAllowance; i++) {
        rateLimiter.checkGlobalLimit()
      }
      
      // User limit should also be blocked due to global limit
      const result = rateLimiter.checkLimits(userId)
      expect(result.allowed).toBe(false)
    })

    it('should allow request if both limits pass', () => {
      const userId = 'test-user-5'
      
      const result = rateLimiter.checkLimits(userId)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(config.burstAllowance - 1)
    })
  })

  describe('Status Tracking', () => {
    it('should return current status', () => {
      const userId = 'test-user-6'
      
      // Make a request
      rateLimiter.checkLimits(userId)
      
      const status = rateLimiter.getStatus(userId)
      expect(status.user.tokens).toBe(config.burstAllowance - 1)
      expect(status.user.requestCount).toBe(1)
      expect(status.global.tokens).toBe(config.burstAllowance - 1)
      expect(status.global.requestCount).toBe(1)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all limits', () => {
      const userId = 'test-user-7'
      
      // Make some requests
      rateLimiter.checkLimits(userId)
      rateLimiter.checkLimits(userId)
      
      // Reset
      rateLimiter.reset()
      
      // Should be back to initial state
      const status = rateLimiter.getStatus(userId)
      expect(status.user.tokens).toBe(config.burstAllowance)
      expect(status.user.requestCount).toBe(0)
      expect(status.global.tokens).toBe(config.burstAllowance)
      expect(status.global.requestCount).toBe(0)
    })
  })
})
