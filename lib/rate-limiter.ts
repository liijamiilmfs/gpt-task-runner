/**
 * Rate Limiting System for Librán Voice Forge
 * Implements token bucket algorithm for per-user and global rate limiting
 */

import { log } from './logger'

export interface RateLimitConfig {
  maxRequestsPerMinute: number
  maxRequestsPerHour: number
  maxRequestsPerDay: number
  burstAllowance: number // How many requests can be made in a burst
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface UserRateLimit {
  tokens: number
  lastRefill: number
  requestCount: number
  windowStart: number
}

export class RateLimiter {
  private userLimits: Map<string, UserRateLimit> = new Map()
  private globalLimit: UserRateLimit
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout

  constructor(config: RateLimitConfig) {
    this.config = config
    this.globalLimit = {
      tokens: config.burstAllowance,
      lastRefill: Date.now(),
      requestCount: 0,
      windowStart: Date.now()
    }
    
    // Cleanup old user limits every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldLimits()
    }, 5 * 60 * 1000)
  }

  /**
   * Check if a request is allowed for a specific user
   */
  checkUserLimit(userId: string): RateLimitResult {
    const now = Date.now()
    const userLimit = this.getOrCreateUserLimit(userId)
    
    // Refill tokens based on time passed
    this.refillTokens(userLimit, now)
    
    // Check if request is allowed
    if (userLimit.tokens >= 1) {
      userLimit.tokens -= 1
      userLimit.requestCount++
      
      log.debug('Rate limit check passed', {
        userId,
        remainingTokens: userLimit.tokens,
        requestCount: userLimit.requestCount
      })
      
      return {
        allowed: true,
        remaining: userLimit.tokens,
        resetTime: this.getNextRefillTime(userLimit.lastRefill)
      }
    } else {
      const retryAfter = this.getNextRefillTime(userLimit.lastRefill) - now
      
      log.warn('Rate limit exceeded for user', {
        userId,
        requestCount: userLimit.requestCount,
        retryAfter
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.getNextRefillTime(userLimit.lastRefill),
        retryAfter: Math.ceil(retryAfter / 1000) // Convert to seconds
      }
    }
  }

  /**
   * Check if a request is allowed globally
   */
  checkGlobalLimit(): RateLimitResult {
    const now = Date.now()
    
    // Refill global tokens
    this.refillTokens(this.globalLimit, now)
    
    // Check if request is allowed
    if (this.globalLimit.tokens >= 1) {
      this.globalLimit.tokens -= 1
      this.globalLimit.requestCount++
      
      log.debug('Global rate limit check passed', {
        remainingTokens: this.globalLimit.tokens,
        requestCount: this.globalLimit.requestCount
      })
      
      return {
        allowed: true,
        remaining: this.globalLimit.tokens,
        resetTime: this.getNextRefillTime(this.globalLimit.lastRefill)
      }
    } else {
      const retryAfter = this.getNextRefillTime(this.globalLimit.lastRefill) - now
      
      log.warn('Global rate limit exceeded', {
        requestCount: this.globalLimit.requestCount,
        retryAfter
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.getNextRefillTime(this.globalLimit.lastRefill),
        retryAfter: Math.ceil(retryAfter / 1000) // Convert to seconds
      }
    }
  }

  /**
   * Check both user and global limits
   */
  checkLimits(userId: string): RateLimitResult {
    // Check global limit first
    const globalResult = this.checkGlobalLimit()
    if (!globalResult.allowed) {
      return globalResult
    }
    
    // Check user limit
    const userResult = this.checkUserLimit(userId)
    if (!userResult.allowed) {
      // Refund the global token since user limit failed
      this.globalLimit.tokens += 1
      return userResult
    }
    
    return userResult
  }

  /**
   * Get or create user rate limit
   */
  private getOrCreateUserLimit(userId: string): UserRateLimit {
    if (!this.userLimits.has(userId)) {
      this.userLimits.set(userId, {
        tokens: this.config.burstAllowance,
        lastRefill: Date.now(),
        requestCount: 0,
        windowStart: Date.now()
      })
    }
    return this.userLimits.get(userId)!
  }

  /**
   * Refill tokens based on time passed
   */
  private refillTokens(limit: UserRateLimit, now: number): void {
    const timePassed = now - limit.lastRefill
    const tokensToAdd = Math.floor(timePassed / (60 * 1000)) // 1 token per minute
    
    if (tokensToAdd > 0) {
      limit.tokens = Math.min(this.config.burstAllowance, limit.tokens + tokensToAdd)
      limit.lastRefill = now
    }
  }

  /**
   * Get next refill time
   */
  private getNextRefillTime(lastRefill: number): number {
    return lastRefill + (60 * 1000) // Next minute
  }

  /**
   * Clean up old user limits to prevent memory leaks
   */
  private cleanupOldLimits(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [userId, limit] of this.userLimits.entries()) {
      if (now - limit.windowStart > maxAge) {
        this.userLimits.delete(userId)
        log.debug('Cleaned up old rate limit for user', { userId })
      }
    }
  }

  /**
   * Get current rate limit status for a user
   */
  getStatus(userId: string): { user: UserRateLimit; global: UserRateLimit } {
    const userLimit = this.getOrCreateUserLimit(userId)
    const now = Date.now()
    this.refillTokens(userLimit, now)
    this.refillTokens(this.globalLimit, now)
    
    return {
      user: { ...userLimit },
      global: { ...this.globalLimit }
    }
  }

  /**
   * Reset rate limits (useful for testing)
   */
  reset(): void {
    this.userLimits.clear()
    this.globalLimit = {
      tokens: this.config.burstAllowance,
      lastRefill: Date.now(),
      requestCount: 0,
      windowStart: Date.now()
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

/**
 * Create rate limiter with environment-based configuration
 */
export function createRateLimiter(): RateLimiter {
  const config: RateLimitConfig = {
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10'),
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR || '100'),
    maxRequestsPerDay: parseInt(process.env.MAX_REQUESTS_PER_DAY || '1000'),
    burstAllowance: parseInt(process.env.RATE_LIMIT_BURST || '10')
  }

  log.info('Rate limiter initialized', { config })
  return new RateLimiter(config)
}

// Global rate limiter instance
export const rateLimiter = createRateLimiter()
