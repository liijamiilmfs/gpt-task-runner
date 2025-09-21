/**
 * Guardrails API Integration Tests
 */

// Set test environment before any imports
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true })

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { createRateLimiter } from '../../lib/rate-limiter'
import { createBudgetGuardrails } from '../../lib/budget-guardrails'
import { withGuardrails, resetGuardrails } from '../../lib/api-guardrails'

describe('Guardrails API Integration', () => {
  before(() => {
    resetGuardrails()
  })

  after(() => {
    resetGuardrails()
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const mockHandler = async (request: NextRequest) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const guardedHandler = withGuardrails(mockHandler, {
        enableRateLimiting: true,
        enableBudgetGuardrails: false,
        requireUserId: false
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' })
      })

      const response = await guardedHandler(request)
      assert.equal(response.status, 200)
    })

    it('should block requests exceeding rate limit', async () => {
      const mockHandler = async (request: NextRequest) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const guardedHandler = withGuardrails(mockHandler, {
        enableRateLimiting: true,
        enableBudgetGuardrails: false,
        requireUserId: false
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' })
      })

      // Make requests up to the burst limit (10 by default)
      for (let i = 0; i < 10; i++) {
        const response = await guardedHandler(request)
        assert.equal(response.status, 200)
      }

      // Next request should be rate limited
      const response = await guardedHandler(request)
      assert.equal(response.status, 429)
      
      const body = await response.json()
      assert.equal(body.error, 'Rate limit exceeded')
      assert.ok(body.retryAfter)
    })
  })

  describe('Budget Guardrails', () => {
    it('should allow requests within budget', async () => {
      const mockHandler = async (request: NextRequest) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const guardedHandler = withGuardrails(mockHandler, {
        enableRateLimiting: false,
        enableBudgetGuardrails: true,
        requireUserId: false
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' })
      })

      const response = await guardedHandler(request)
      assert.equal(response.status, 200)
    })

    it('should block requests exceeding per-request character limit', async () => {
      const mockHandler = async (request: NextRequest) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const guardedHandler = withGuardrails(mockHandler, {
        enableRateLimiting: false,
        enableBudgetGuardrails: true,
        requireUserId: false
      })

      // Create a request with text exceeding the per-request limit (10k chars)
      const largeText = 'a'.repeat(15000)
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: largeText })
      })

      const response = await guardedHandler(request)
      assert.equal(response.status, 429)
      
      const body = await response.json()
      assert.equal(body.error, 'Budget exceeded')
      assert.ok(body.message.includes('exceeds maximum characters per request'))
    })

    it('should block requests exceeding daily character limit', async () => {
      const mockHandler = async (request: NextRequest) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const guardedHandler = withGuardrails(mockHandler, {
        enableRateLimiting: false,
        enableBudgetGuardrails: true,
        requireUserId: false
      })

      // Create requests that will exceed daily limit (100k chars)
      const largeText = 'a'.repeat(50000)
      
      // First request should succeed
      const request1 = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: largeText })
      })

      const response1 = await guardedHandler(request1)
      assert.equal(response1.status, 200)

      // Second request should exceed daily limit
      const request2 = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: largeText })
      })

      const response2 = await guardedHandler(request2)
      assert.equal(response2.status, 429)
      
      const body = await response2.json()
      assert.equal(body.error, 'Budget exceeded')
      assert.ok(body.message.includes('Daily character limit exceeded'))
    })
  })

  describe('Combined Guardrails', () => {
    it('should apply both rate limiting and budget guardrails', async () => {
      const mockHandler = async (request: NextRequest) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const guardedHandler = withGuardrails(mockHandler, {
        enableRateLimiting: true,
        enableBudgetGuardrails: true,
        requireUserId: false
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' })
      })

      // Should work within limits
      const response = await guardedHandler(request)
      assert.equal(response.status, 200)
      
      // Check headers are present
      assert.ok(response.headers.get('X-RateLimit-Limit'))
      assert.ok(response.headers.get('X-Budget-Remaining-Daily'))
    })
  })

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      const mockHandler = async (request: NextRequest) => {
        throw new Error('Handler error')
      }

      const guardedHandler = withGuardrails(mockHandler, {
        enableRateLimiting: false,
        enableBudgetGuardrails: false,
        requireUserId: false
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' })
      })

      const response = await guardedHandler(request)
      assert.equal(response.status, 500)
      
      const body = await response.json()
      assert.equal(body.error, 'Internal server error')
    })
  })
})
