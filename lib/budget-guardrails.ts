/**
 * Budget Guardrails System for Librán Voice Forge
 * Tracks character usage and enforces daily/monthly budget limits
 */

import { log } from './logger'
import { trackInterval, clearTrackedInterval } from './cleanup-handler'

export interface BudgetConfig {
  maxCharsPerRequest: number
  maxCharsPerDay: number
  maxCharsPerMonth: number
  maxMonthlyCostUSD?: number
  costPerThousandChars?: number
}

export interface BudgetUsage {
  dailyChars: number
  monthlyChars: number
  dailyResetTime: number
  monthlyResetTime: number
  totalCost: number
}

export interface BudgetCheckResult {
  allowed: boolean
  reason?: string
  remainingDaily: number
  remainingMonthly: number
  resetTime: number
}

export interface UserBudget {
  dailyChars: number
  monthlyChars: number
  dailyResetTime: number
  monthlyResetTime: number
  totalCost: number
  lastRequestTime: number
}

export class BudgetGuardrails {
  private userBudgets: Map<string, UserBudget> = new Map()
  private globalBudget: UserBudget
  private config: BudgetConfig
  private cleanupInterval: NodeJS.Timeout

  constructor(config: BudgetConfig) {
    this.config = config
    this.globalBudget = this.createNewBudget()
    
    // Cleanup old user budgets every hour (or 30 seconds in test environment)
    const cleanupInterval = process.env.NODE_ENV === 'test' ? 30 * 1000 : 60 * 60 * 1000
    this.cleanupInterval = trackInterval(setInterval(() => {
      try {
        this.cleanupOldBudgets()
      } catch (error) {
        log.error('Error during budget cleanup', { error })
      }
    }, cleanupInterval))
  }

  /**
   * Check if a request is allowed based on budget constraints
   */
  checkBudget(userId: string, characterCount: number): BudgetCheckResult {
    const now = Date.now()
    
    // Check per-request character limit
    if (characterCount > this.config.maxCharsPerRequest) {
      log.warn('Request exceeds per-request character limit', {
        userId,
        characterCount,
        maxCharsPerRequest: this.config.maxCharsPerRequest
      })
      
      return {
        allowed: false,
        reason: `Request exceeds maximum characters per request (${this.config.maxCharsPerRequest})`,
        remainingDaily: 0,
        remainingMonthly: 0,
        resetTime: 0
      }
    }

    // Get or create user budget
    const userBudget = this.getOrCreateUserBudget(userId)
    
    // Reset daily/monthly counters if needed
    this.resetCountersIfNeeded(userBudget, now)
    this.resetCountersIfNeeded(this.globalBudget, now)

    // Check daily limit
    if (userBudget.dailyChars + characterCount > this.config.maxCharsPerDay) {
      log.warn('Daily character limit exceeded', {
        userId,
        currentDaily: userBudget.dailyChars,
        requestedChars: characterCount,
        maxCharsPerDay: this.config.maxCharsPerDay
      })
      
      return {
        allowed: false,
        reason: 'Daily character limit exceeded, try again tomorrow',
        remainingDaily: this.config.maxCharsPerDay - userBudget.dailyChars,
        remainingMonthly: this.config.maxCharsPerMonth - userBudget.monthlyChars,
        resetTime: userBudget.dailyResetTime
      }
    }

    // Check monthly limit
    if (userBudget.monthlyChars + characterCount > this.config.maxCharsPerMonth) {
      log.warn('Monthly character limit exceeded', {
        userId,
        currentMonthly: userBudget.monthlyChars,
        requestedChars: characterCount,
        maxCharsPerMonth: this.config.maxCharsPerMonth
      })
      
      return {
        allowed: false,
        reason: 'Monthly character limit exceeded, try again next month',
        remainingDaily: this.config.maxCharsPerDay - userBudget.dailyChars,
        remainingMonthly: this.config.maxCharsPerMonth - userBudget.monthlyChars,
        resetTime: userBudget.monthlyResetTime
      }
    }

    // Check cost limit if configured
    if (this.config.maxMonthlyCostUSD && this.config.costPerThousandChars) {
      const additionalCost = (characterCount / 1000) * this.config.costPerThousandChars
      if (userBudget.totalCost + additionalCost > this.config.maxMonthlyCostUSD) {
        log.warn('Monthly cost limit exceeded', {
          userId,
          currentCost: userBudget.totalCost,
          additionalCost,
          maxMonthlyCost: this.config.maxMonthlyCostUSD
        })
        
        return {
          allowed: false,
          reason: 'Monthly cost limit exceeded, try again next month',
          remainingDaily: this.config.maxCharsPerDay - userBudget.dailyChars,
          remainingMonthly: this.config.maxCharsPerMonth - userBudget.monthlyChars,
          resetTime: userBudget.monthlyResetTime
        }
      }
    }

    // All checks passed
    return {
      allowed: true,
      remainingDaily: this.config.maxCharsPerDay - userBudget.dailyChars,
      remainingMonthly: this.config.maxCharsPerMonth - userBudget.monthlyChars,
      resetTime: userBudget.dailyResetTime
    }
  }

  /**
   * Record character usage for a user
   */
  recordUsage(userId: string, characterCount: number): void {
    const now = Date.now()
    const userBudget = this.getOrCreateUserBudget(userId)
    
    // Reset counters if needed
    this.resetCountersIfNeeded(userBudget, now)
    this.resetCountersIfNeeded(this.globalBudget, now)

    // Update user budget
    userBudget.dailyChars += characterCount
    userBudget.monthlyChars += characterCount
    userBudget.lastRequestTime = now

    // Update global budget
    this.globalBudget.dailyChars += characterCount
    this.globalBudget.monthlyChars += characterCount
    this.globalBudget.lastRequestTime = now

    // Calculate and update cost
    if (this.config.costPerThousandChars) {
      const cost = (characterCount / 1000) * this.config.costPerThousandChars
      userBudget.totalCost += cost
      this.globalBudget.totalCost += cost
    }

    log.debug('Character usage recorded', {
      userId,
      characterCount,
      dailyChars: userBudget.dailyChars,
      monthlyChars: userBudget.monthlyChars,
      totalCost: userBudget.totalCost
    })
  }

  /**
   * Get current budget status for a user
   */
  getBudgetStatus(userId: string): BudgetUsage {
    const userBudget = this.getOrCreateUserBudget(userId)
    const now = Date.now()
    
    // Reset counters if needed
    this.resetCountersIfNeeded(userBudget, now)
    
    return {
      dailyChars: userBudget.dailyChars,
      monthlyChars: userBudget.monthlyChars,
      dailyResetTime: userBudget.dailyResetTime,
      monthlyResetTime: userBudget.monthlyResetTime,
      totalCost: userBudget.totalCost
    }
  }

  /**
   * Get global budget status
   */
  getGlobalBudgetStatus(): BudgetUsage {
    const now = Date.now()
    this.resetCountersIfNeeded(this.globalBudget, now)
    
    return {
      dailyChars: this.globalBudget.dailyChars,
      monthlyChars: this.globalBudget.monthlyChars,
      dailyResetTime: this.globalBudget.dailyResetTime,
      monthlyResetTime: this.globalBudget.monthlyResetTime,
      totalCost: this.globalBudget.totalCost
    }
  }

  /**
   * Get or create user budget
   */
  private getOrCreateUserBudget(userId: string): UserBudget {
    if (!this.userBudgets.has(userId)) {
      this.userBudgets.set(userId, this.createNewBudget())
    }
    return this.userBudgets.get(userId)!
  }

  /**
   * Create a new budget object
   */
  private createNewBudget(): UserBudget {
    const now = Date.now()
    return {
      dailyChars: 0,
      monthlyChars: 0,
      dailyResetTime: this.getNextMidnight(now),
      monthlyResetTime: this.getNextMonthStart(now),
      totalCost: 0,
      lastRequestTime: now
    }
  }

  /**
   * Reset counters if needed (daily/monthly)
   */
  private resetCountersIfNeeded(budget: UserBudget, now: number): void {
    // Reset daily counter if past midnight
    if (now >= budget.dailyResetTime) {
      budget.dailyChars = 0
      budget.dailyResetTime = this.getNextMidnight(now)
    }

    // Reset monthly counter if past month start
    if (now >= budget.monthlyResetTime) {
      budget.monthlyChars = 0
      budget.totalCost = 0
      budget.monthlyResetTime = this.getNextMonthStart(now)
    }
  }

  /**
   * Get next midnight timestamp
   */
  private getNextMidnight(now: number): number {
    const date = new Date(now)
    date.setHours(23, 59, 59, 999)
    return date.getTime() + 1
  }

  /**
   * Get next month start timestamp
   */
  private getNextMonthStart(now: number): number {
    const date = new Date(now)
    date.setMonth(date.getMonth() + 1, 1)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }

  /**
   * Clean up old user budgets to prevent memory leaks
   */
  private cleanupOldBudgets(): void {
    const now = Date.now()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
    
    for (const [userId, budget] of Array.from(this.userBudgets.entries())) {
      if (now - budget.lastRequestTime > maxAge) {
        this.userBudgets.delete(userId)
        log.debug('Cleaned up old budget for user', { userId })
      }
    }
  }

  /**
   * Reset all budgets (useful for testing)
   */
  reset(): void {
    this.userBudgets.clear()
    this.globalBudget = this.createNewBudget()
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearTrackedInterval(this.cleanupInterval)
      this.cleanupInterval = null as any
    }
  }
}

/**
 * Create budget guardrails with environment-based configuration
 */
export function createBudgetGuardrails(): BudgetGuardrails {
  // Use more permissive limits in test environment
  const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true'
  
  const config: BudgetConfig = {
    maxCharsPerRequest: parseInt(process.env.MAX_CHARS_PER_REQUEST || (isTest ? '100000' : '10000')),
    maxCharsPerDay: parseInt(process.env.MAX_CHARS_PER_DAY || (isTest ? '10000000' : '100000')),
    maxCharsPerMonth: parseInt(process.env.MAX_CHARS_PER_MONTH || (isTest ? '100000000' : '1000000')),
    maxMonthlyCostUSD: process.env.MAX_MONTHLY_COST_USD ? parseFloat(process.env.MAX_MONTHLY_COST_USD) : undefined,
    costPerThousandChars: process.env.COST_PER_THOUSAND_CHARS ? parseFloat(process.env.COST_PER_THOUSAND_CHARS) : undefined
  }

  log.info('Budget guardrails initialized', { config, isTest })
  return new BudgetGuardrails(config)
}

// Global budget guardrails instance
export const budgetGuardrails = createBudgetGuardrails()
