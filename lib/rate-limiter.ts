/**
 * Rate Limiting System for Librán Voice Forge
 * Implements token bucket algorithm for per-user and global rate limiting
 */

import { log } from './logger'
import { trackInterval, clearTrackedInterval } from './cleanup-handler'

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
  hourlyRequests: number
  dailyRequests: number
  hourlyWindowStart: number
  dailyWindowStart: number
}

export class RateLimiter {
  private userLimits: Map<string, UserRateLimit> = new Map()
  private globalLimit: UserRateLimit
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout

  constructor(config: RateLimitConfig) {
    this.config = config
    const now = Date.now()
    this.globalLimit = {
      tokens: config.burstAllowance,
      lastRefill: now,
      requestCount: 0,
      windowStart: now,
      hourlyRequests: 0,
      dailyRequests: 0,
      hourlyWindowStart: now,
      dailyWindowStart: now
    }
    
    // Cleanup old user limits every 5 minutes (or 30 seconds in test environment)
    const cleanupInterval = process.env.NODE_ENV === 'test' ? 30 * 1000 : 5 * 60 * 1000
    this.cleanupInterval = trackInterval(setInterval(() => {
      try {
        this.cleanupOldLimits()
      } catch (error) {
        log.error('Error during cleanup', { error })
      }
    }, cleanupInterval))
  }

  /**
   * Check if a request is allowed for a specific user
   */
  checkUserLimit(userId: string): RateLimitResult {
    const now = Date.now()
    const userLimit = this.getOrCreateUserLimit(userId)
    
    // Reset windows if needed
    this.resetWindowsIfNeeded(userLimit, now)
    
    // Check daily limit first
    if (userLimit.dailyRequests >= this.config.maxRequestsPerDay) {
      const retryAfter = this.getNextDayReset(userLimit.dailyWindowStart) - now
      
      log.warn('Daily rate limit exceeded for user', {
        userId,
        dailyRequests: userLimit.dailyRequests,
        maxDaily: this.config.maxRequestsPerDay,
        retryAfter
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.getNextDayReset(userLimit.dailyWindowStart),
        retryAfter: Math.ceil(retryAfter / 1000)
      }
    }
    
    // Check hourly limit
    if (userLimit.hourlyRequests >= this.config.maxRequestsPerHour) {
      const retryAfter = this.getNextHourReset(userLimit.hourlyWindowStart) - now
      
      log.warn('Hourly rate limit exceeded for user', {
        userId,
        hourlyRequests: userLimit.hourlyRequests,
        maxHourly: this.config.maxRequestsPerHour,
        retryAfter
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.getNextHourReset(userLimit.hourlyWindowStart),
        retryAfter: Math.ceil(retryAfter / 1000)
      }
    }
    
    // Refill tokens based on time passed
    this.refillTokens(userLimit, now)
    
    // Check if request is allowed
    if (userLimit.tokens >= 1) {
      userLimit.tokens -= 1
      userLimit.requestCount++
      userLimit.hourlyRequests++
      userLimit.dailyRequests++
      
      log.debug('Rate limit check passed', {
        userId,
        remainingTokens: userLimit.tokens,
        requestCount: userLimit.requestCount,
        hourlyRequests: userLimit.hourlyRequests,
        dailyRequests: userLimit.dailyRequests
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
    
    // Reset windows if needed
    this.resetWindowsIfNeeded(this.globalLimit, now)
    
    // Check daily limit first
    if (this.globalLimit.dailyRequests >= this.config.maxRequestsPerDay) {
      const retryAfter = this.getNextDayReset(this.globalLimit.dailyWindowStart) - now
      
      log.warn('Global daily rate limit exceeded', {
        dailyRequests: this.globalLimit.dailyRequests,
        maxDaily: this.config.maxRequestsPerDay,
        retryAfter
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.getNextDayReset(this.globalLimit.dailyWindowStart),
        retryAfter: Math.ceil(retryAfter / 1000)
      }
    }
    
    // Check hourly limit
    if (this.globalLimit.hourlyRequests >= this.config.maxRequestsPerHour) {
      const retryAfter = this.getNextHourReset(this.globalLimit.hourlyWindowStart) - now
      
      log.warn('Global hourly rate limit exceeded', {
        hourlyRequests: this.globalLimit.hourlyRequests,
        maxHourly: this.config.maxRequestsPerHour,
        retryAfter
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.getNextHourReset(this.globalLimit.hourlyWindowStart),
        retryAfter: Math.ceil(retryAfter / 1000)
      }
    }
    
    // Refill global tokens
    this.refillTokens(this.globalLimit, now)
    
    // Check if request is allowed
    if (this.globalLimit.tokens >= 1) {
      this.globalLimit.tokens -= 1
      this.globalLimit.requestCount++
      this.globalLimit.hourlyRequests++
      this.globalLimit.dailyRequests++
      
      log.debug('Global rate limit check passed', {
        remainingTokens: this.globalLimit.tokens,
        requestCount: this.globalLimit.requestCount,
        hourlyRequests: this.globalLimit.hourlyRequests,
        dailyRequests: this.globalLimit.dailyRequests
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
      const now = Date.now()
      this.userLimits.set(userId, {
        tokens: this.config.burstAllowance,
        lastRefill: now,
        requestCount: 0,
        windowStart: now,
        hourlyRequests: 0,
        dailyRequests: 0,
        hourlyWindowStart: now,
        dailyWindowStart: now
      })
    }
    return this.userLimits.get(userId)!
  }

  /**
   * Refill tokens based on time passed and configuration
   */
  private refillTokens(limit: UserRateLimit, now: number): void {
    const timePassed = now - limit.lastRefill
    const minutesPassed = timePassed / (60 * 1000)
    
    // Calculate tokens to add based on configured rate per minute
    const tokensToAdd = Math.floor(minutesPassed * this.config.maxRequestsPerMinute)
    
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
   * Reset windows if needed (hourly and daily)
   */
  private resetWindowsIfNeeded(limit: UserRateLimit, now: number): void {
    // Reset hourly window if needed
    if (now - limit.hourlyWindowStart >= 60 * 60 * 1000) { // 1 hour
      limit.hourlyRequests = 0
      limit.hourlyWindowStart = now
    }
    
    // Reset daily window if needed
    if (now - limit.dailyWindowStart >= 24 * 60 * 60 * 1000) { // 24 hours
      limit.dailyRequests = 0
      limit.dailyWindowStart = now
    }
  }

  /**
   * Get next hour reset time
   */
  private getNextHourReset(hourlyWindowStart: number): number {
    return hourlyWindowStart + (60 * 60 * 1000) // Next hour
  }

  /**
   * Get next day reset time
   */
  private getNextDayReset(dailyWindowStart: number): number {
    return dailyWindowStart + (24 * 60 * 60 * 1000) // Next day
  }

  /**
   * Clean up old user limits to prevent memory leaks
   */
  private cleanupOldLimits(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [userId, limit] of Array.from(this.userLimits.entries())) {
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
    const now = Date.now()
    this.globalLimit = {
      tokens: this.config.burstAllowance,
      lastRefill: now,
      requestCount: 0,
      windowStart: now,
      hourlyRequests: 0,
      dailyRequests: 0,
      hourlyWindowStart: now,
      dailyWindowStart: now
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null as any
    }
  }
}

/**
 * Create rate limiter with environment-based configuration
 */
export function createRateLimiter(): RateLimiter {
  // Use more permissive limits in test environment
  const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true'
  
  const config: RateLimitConfig = {
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || (isTest ? '1000' : '10')),
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR || (isTest ? '10000' : '100')),
    maxRequestsPerDay: parseInt(process.env.MAX_REQUESTS_PER_DAY || (isTest ? '100000' : '1000')),
    burstAllowance: parseInt(process.env.RATE_LIMIT_BURST || (isTest ? '1000' : '10'))
  }

  log.info('Rate limiter initialized', { config, isTest })
  return new RateLimiter(config)
}

// Global rate limiter instance
export const rateLimiter = createRateLimiter()
