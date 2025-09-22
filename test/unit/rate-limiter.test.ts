/**
 * Rate Limiter Tests
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { RateLimiter, RateLimitConfig } from '../../lib/rate-limiter'
import { cleanupAll } from '../../lib/cleanup-handler'

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
    cleanupAll()
  })

  describe('User Rate Limiting', () => {
    it('should allow requests within burst limit', () => {
      const userId = 'test-user-1'
      
      // Should allow burst allowance requests
      for (let i = 0; i < config.burstAllowance; i++) {
        const result = rateLimiter.checkUserLimit(userId)
        assert.equal(result.allowed, true)
        assert.equal(result.remaining,config.burstAllowance - i - 1)
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
      assert.equal(result.allowed, false)
      assert.ok(result.retryAfter)
    })

    it('should refill tokens over time', async () => {
      const userId = 'test-user-3'
      
      // Exhaust all tokens
      for (let i = 0; i < config.burstAllowance; i++) {
        rateLimiter.checkUserLimit(userId)
      }
      
      // Should be blocked
      let result = rateLimiter.checkUserLimit(userId)
      assert.equal(result.allowed, false)
      
      // Mock time passage (1 minute)
      const originalNow = Date.now
      Date.now = () => originalNow() + 60000
      
      // Should allow one more request
      result = rateLimiter.checkUserLimit(userId)
      assert.equal(result.allowed, true)
      
      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Global Rate Limiting', () => {
    it('should allow requests within global burst limit', () => {
      // Should allow burst allowance requests
      for (let i = 0; i < config.burstAllowance; i++) {
        const result = rateLimiter.checkGlobalLimit()
        assert.equal(result.allowed, true)
        assert.equal(result.remaining,config.burstAllowance - i - 1)
      }
    })

    it('should block requests after global burst limit', () => {
      // Exhaust global burst allowance
      for (let i = 0; i < config.burstAllowance; i++) {
        rateLimiter.checkGlobalLimit()
      }
      
      // Next request should be blocked
      const result = rateLimiter.checkGlobalLimit()
      assert.equal(result.allowed, false)
      assert.ok(result.retryAfter)
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
      assert.equal(result.allowed, false)
    })

    it('should allow request if both limits pass', () => {
      const userId = 'test-user-5'
      
      const result = rateLimiter.checkLimits(userId)
      assert.equal(result.allowed, true)
      assert.equal(result.remaining,config.burstAllowance - 1)
    })
  })

  describe('Status Tracking', () => {
    it('should return current status', () => {
      const userId = 'test-user-6'
      
      // Make a request
      rateLimiter.checkLimits(userId)
      
      const status = rateLimiter.getStatus(userId)
      assert.equal(status.user.tokens,config.burstAllowance - 1)
      assert.equal(status.user.requestCount,1)
      assert.equal(status.global.tokens,config.burstAllowance - 1)
      assert.equal(status.global.requestCount,1)
    })
  })

  describe('Configuration-Based Rate Limiting', () => {
    it('should use configured maxRequestsPerMinute for token refill', () => {
      const userId = 'test-user-config'
      
      // Mock time to control token refill
      const originalNow = Date.now
      let mockTime = Date.now()
      Date.now = () => mockTime
      
      // Exhaust initial burst
      for (let i = 0; i < config.burstAllowance; i++) {
        const result = rateLimiter.checkUserLimit(userId)
        assert.equal(result.allowed, true)
      }
      
      // Should be blocked by burst limit
      let result = rateLimiter.checkUserLimit(userId)
      assert.equal(result.allowed, false)
      
      // Advance time by 1 minute to refill tokens
      mockTime += 60 * 1000 // 1 minute later
      
      // Should allow requests again (tokens refilled based on maxRequestsPerMinute)
      result = rateLimiter.checkUserLimit(userId)
      assert.equal(result.allowed, true)
      
      // Restore original Date.now
      Date.now = originalNow
    })

    it('should track hourly and daily request counts', () => {
      const userId = 'test-user-tracking'
      
      // Make several requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkUserLimit(userId)
      }
      
      // Check status to verify tracking
      const status = rateLimiter.getStatus(userId)
      assert.equal(status.user.hourlyRequests,5)
      assert.equal(status.user.dailyRequests,5)
    })

    it('should reset hourly and daily windows after time passes', () => {
      const userId = 'test-user-window-reset'
      
      // Mock time to control window resets
      const originalNow = Date.now
      let mockTime = Date.now()
      Date.now = () => mockTime
      
      // Make some requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkUserLimit(userId)
      }
      
      // Check initial counts
      let status = rateLimiter.getStatus(userId)
      assert.equal(status.user.hourlyRequests,5)
      assert.equal(status.user.dailyRequests,5)
      
      // Advance time by 1 hour to reset hourly window
      mockTime += 60 * 60 * 1000 // 1 hour later
      
      // Make another request
      rateLimiter.checkUserLimit(userId)
      
      // Check that hourly count reset but daily count continued
      status = rateLimiter.getStatus(userId)
      assert.equal(status.user.hourlyRequests,1) // Reset to 1
      assert.equal(status.user.dailyRequests,6) // Continued from 5
      
      // Restore original Date.now
      Date.now = originalNow
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
      assert.equal(status.user.tokens,config.burstAllowance)
      assert.equal(status.user.requestCount,0)
      assert.equal(status.global.tokens,config.burstAllowance)
      assert.equal(status.global.requestCount,0)
    })
  })
})
