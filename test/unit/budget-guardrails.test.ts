/**
 * Budget Guardrails Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BudgetGuardrails, BudgetConfig } from '../../lib/budget-guardrails'

describe('BudgetGuardrails', () => {
  let budgetGuardrails: BudgetGuardrails
  let config: BudgetConfig

  beforeEach(() => {
    config = {
      maxCharsPerRequest: 10000,
      maxCharsPerDay: 100000,
      maxCharsPerMonth: 1000000,
      maxMonthlyCostUSD: 10.0,
      costPerThousandChars: 0.01
    }
    budgetGuardrails = new BudgetGuardrails(config)
  })

  afterEach(() => {
    budgetGuardrails.destroy()
  })

  describe('Per-Request Limits', () => {
    it('should allow requests within per-request limit', () => {
      const userId = 'test-user-1'
      const result = budgetGuardrails.checkBudget(userId, 500)
      
      expect(result.allowed).toBe(true)
      expect(result.remainingDaily).toBe(config.maxCharsPerDay)
      expect(result.remainingMonthly).toBe(config.maxCharsPerMonth)
    })

    it('should block requests exceeding per-request limit', () => {
      const userId = 'test-user-2'
      const result = budgetGuardrails.checkBudget(userId, 15000) // Exceeds 10k limit
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('exceeds maximum characters per request')
    })
  })

  describe('Daily Limits', () => {
    it('should allow requests within daily limit', () => {
      const userId = 'test-user-3'
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      expect(result.allowed).toBe(true)
      expect(result.remainingDaily).toBe(config.maxCharsPerDay)
    })

    it('should block requests exceeding daily limit', () => {
      const userId = 'test-user-4'
      
      // Use up most of daily limit
      budgetGuardrails.recordUsage(userId, 95000)
      
      // This should exceed daily limit
      const result = budgetGuardrails.checkBudget(userId, 10000)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Daily character limit exceeded')
    })
  })

  describe('Monthly Limits', () => {
    it('should allow requests within monthly limit', () => {
      const userId = 'test-user-5'
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      expect(result.allowed).toBe(true)
      expect(result.remainingMonthly).toBe(config.maxCharsPerMonth)
    })

    it('should block requests exceeding monthly limit', () => {
      const userId = 'test-user-6-monthly'
      
      // Mock time to next day to reset daily limit
      const originalNow = Date.now
      Date.now = () => originalNow() + 24 * 60 * 60 * 1000 // 24 hours later
      
      // Use up most of monthly limit in small chunks to avoid daily limit
      for (let i = 0; i < 95; i++) {
        budgetGuardrails.recordUsage(userId, 10000) // 10k chars per request
      } // Total: 950k chars
      
      // This should exceed monthly limit
      const result = budgetGuardrails.checkBudget(userId, 10000)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Monthly character limit exceeded')
      
      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Cost Limits', () => {
    it('should allow requests within cost limit', () => {
      const userId = 'test-user-7'
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      expect(result.allowed).toBe(true)
    })

    it('should block requests exceeding cost limit', () => {
      const userId = 'test-user-8-cost'
      
      // Mock time to next day to reset daily limit
      const originalNow = Date.now
      Date.now = () => originalNow() + 24 * 60 * 60 * 1000 // 24 hours later
      
      // Use up most of cost limit in small chunks to avoid daily limit
      for (let i = 0; i < 95; i++) {
        budgetGuardrails.recordUsage(userId, 10000) // 10k chars per request
      } // Total: 950k chars = 9.5 USD
      
      // This should exceed cost limit (5000 chars = 0.05 USD, total would be 9.55 USD)
      const result = budgetGuardrails.checkBudget(userId, 5000)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Monthly cost limit exceeded')
      
      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Usage Recording', () => {
    it('should record usage correctly', () => {
      const userId = 'test-user-9'
      
      budgetGuardrails.recordUsage(userId, 1000)
      budgetGuardrails.recordUsage(userId, 2000)
      
      const status = budgetGuardrails.getBudgetStatus(userId)
      expect(status.dailyChars).toBe(3000)
      expect(status.monthlyChars).toBe(3000)
    })

    it('should calculate cost correctly', () => {
      const userId = 'test-user-10'
      
      budgetGuardrails.recordUsage(userId, 10000) // 10k chars = 0.1 USD
      budgetGuardrails.recordUsage(userId, 5000)  // 5k chars = 0.05 USD
      
      const status = budgetGuardrails.getBudgetStatus(userId)
      expect(status.totalCost).toBeCloseTo(0.15, 2)
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
      expect(result.allowed).toBe(true)
      expect(result.remainingDaily).toBe(config.maxCharsPerDay)
      
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
      expect(result.allowed).toBe(true)
      expect(result.remainingMonthly).toBe(config.maxCharsPerMonth)
      
      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Global Budget Tracking', () => {
    it('should track global budget', () => {
      budgetGuardrails.recordUsage('user1', 1000)
      budgetGuardrails.recordUsage('user2', 2000)
      
      const globalStatus = budgetGuardrails.getGlobalBudgetStatus()
      expect(globalStatus.dailyChars).toBe(3000)
      expect(globalStatus.monthlyChars).toBe(3000)
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
      expect(status.dailyChars).toBe(0)
      expect(status.monthlyChars).toBe(0)
      expect(status.totalCost).toBe(0)
    })
  })
})
