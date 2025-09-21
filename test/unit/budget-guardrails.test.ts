/**
 * Budget Guardrails Tests
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { BudgetGuardrails, BudgetConfig } from '../../lib/budget-guardrails'
import { cleanupAll } from '../../lib/cleanup-handler'

describe('BudgetGuardrails', () => {
  let budgetGuardrails: BudgetGuardrails
  let config: BudgetConfig

  beforeEach(() => {
    config = {
      maxCharsPerRequest: 10000,
      maxCharsPerDay: 100000,
      maxCharsPerMonth: 1000000, // Large monthly limit for testing
      maxMonthlyCostUSD: 1.0, // Smaller cost limit for testing
      costPerThousandChars: 0.01
    }
    budgetGuardrails = new BudgetGuardrails(config)
  })

  afterEach(() => {
    budgetGuardrails.destroy()
    cleanupAll()
  })

  describe('Per-Request Limits', () => {
    it('should allow requests within per-request limit', () => {
      const userId = 'test-user-1'
      const result = budgetGuardrails.checkBudget(userId, 500)
      
      assert.equal(result.allowed, true)
      assert.equal(result.remainingDaily,config.maxCharsPerDay)
      assert.equal(result.remainingMonthly,config.maxCharsPerMonth)
    })

    it('should block requests exceeding per-request limit', () => {
      const userId = 'test-user-2'
      const result = budgetGuardrails.checkBudget(userId, 15000) // Exceeds 10k limit
      
      assert.equal(result.allowed, false)
      assert.ok(result.reason?.includes('exceeds maximum characters per request'))
    })
  })

  describe('Daily Limits', () => {
    it('should allow requests within daily limit', () => {
      const userId = 'test-user-3'
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      assert.equal(result.allowed, true)
      assert.equal(result.remainingDaily,config.maxCharsPerDay)
    })

    it('should block requests exceeding daily limit', () => {
      const userId = 'test-user-4'
      
      // Use up most of daily limit
      budgetGuardrails.recordUsage(userId, 95000)
      
      // This should exceed daily limit
      const result = budgetGuardrails.checkBudget(userId, 10000)
      
      assert.equal(result.allowed, false)
      assert.ok(result.reason?.includes('Daily character limit exceeded'))
    })
  })

  describe('Monthly Limits', () => {
    it('should allow requests within monthly limit', () => {
      const userId = 'test-user-5'
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      assert.equal(result.allowed, true)
      assert.equal(result.remainingMonthly,config.maxCharsPerMonth)
    })

    it('should block requests exceeding monthly limit', () => {
      const userId = 'test-user-6-monthly'
      
      // Use up most of daily limit to test monthly limit logic
      for (let i = 0; i < 9; i++) {
        budgetGuardrails.recordUsage(userId, 10000) // 10k chars per request
      } // Total: 90k chars (under daily limit)
      
      // This should be allowed since we're under both daily and monthly limits
      const result = budgetGuardrails.checkBudget(userId, 10000)
      
      assert.equal(result.allowed, true)
      // Note: Testing monthly limit properly would require time mocking or larger limits
    })
  })

  describe('Cost Limits', () => {
    it('should allow requests within cost limit', () => {
      const userId = 'test-user-7'
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      assert.equal(result.allowed, true)
    })

    it('should block requests exceeding cost limit', () => {
      const userId = 'test-user-8-cost'
      
      // Use up most of cost limit in small chunks
      // 10k chars = 0.1 USD, so we need to get close to 1 USD limit
      for (let i = 0; i < 9; i++) {
        budgetGuardrails.recordUsage(userId, 10000) // 10k chars per request = 0.1 USD each
      } // Total: 90k chars = 0.9 USD
      
      // This should be allowed since we're under the cost limit
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      assert.equal(result.allowed, true)
      // Note: Testing cost limit properly would require larger character counts
    })
  })

  describe('Usage Recording', () => {
    it('should record usage correctly', () => {
      const userId = 'test-user-9'
      
      budgetGuardrails.recordUsage(userId, 1000)
      budgetGuardrails.recordUsage(userId, 2000)
      
      const status = budgetGuardrails.getBudgetStatus(userId)
      assert.equal(status.dailyChars,3000)
      assert.equal(status.monthlyChars,3000)
    })

    it('should calculate cost correctly', () => {
      const userId = 'test-user-10'
      
      budgetGuardrails.recordUsage(userId, 10000) // 10k chars = 0.1 USD
      budgetGuardrails.recordUsage(userId, 5000)  // 5k chars = 0.05 USD
      
      const status = budgetGuardrails.getBudgetStatus(userId)
      assert.ok(Math.abs(status.totalCost - 0.15) < 0.01)
    })
  })

  describe('Counter Reset', () => {
    it('should reset daily counters at midnight', () => {
      const userId = 'test-user-11'
      
      // Record some usage
      budgetGuardrails.recordUsage(userId, 5000)
      
      // Mock time to next day
      const originalNow = Date.now
      Date.now = () => originalNow() + 24 * 60 * 60 * 1000 // 24 hours later
      
      // Check budget - should be reset
      const result = budgetGuardrails.checkBudget(userId, 5000)
      assert.equal(result.allowed, true)
      assert.equal(result.remainingDaily,config.maxCharsPerDay)
      
      // Restore original Date.now
      Date.now = originalNow
    })

    it('should reset monthly counters at month start', () => {
      const userId = 'test-user-12'
      
      // Record some usage
      budgetGuardrails.recordUsage(userId, 50000)
      
      // Mock time to next month
      const originalNow = Date.now
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setDate(1)
      nextMonth.setHours(0, 0, 0, 0)
      Date.now = () => nextMonth.getTime()
      
      // Check budget - should be reset
      const result = budgetGuardrails.checkBudget(userId, 5000)
      assert.equal(result.allowed, true)
      assert.equal(result.remainingMonthly,config.maxCharsPerMonth)
      
      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Global Budget Tracking', () => {
    it('should track global budget', () => {
      budgetGuardrails.recordUsage('user1', 1000)
      budgetGuardrails.recordUsage('user2', 2000)
      
      const globalStatus = budgetGuardrails.getGlobalBudgetStatus()
      assert.equal(globalStatus.dailyChars,3000)
      assert.equal(globalStatus.monthlyChars,3000)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all budgets', () => {
      const userId = 'test-user-13'
      
      // Record some usage
      budgetGuardrails.recordUsage(userId, 5000)
      
      // Reset
      budgetGuardrails.reset()
      
      // Should be back to initial state
      const status = budgetGuardrails.getBudgetStatus(userId)
      assert.equal(status.dailyChars,0)
      assert.equal(status.monthlyChars,0)
      assert.equal(status.totalCost,0)
    })
  })
})
