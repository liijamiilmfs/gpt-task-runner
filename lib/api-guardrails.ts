/**
 * API Guardrails Middleware
 * Combines rate limiting and budget guardrails for API protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RateLimitResult } from './rate-limiter'
import { budgetGuardrails, BudgetCheckResult } from './budget-guardrails'
import { log } from './logger'

type RequestBody = Record<string, unknown> | null

export interface GuardrailResult {
  allowed: boolean
  statusCode: number
  error?: string
  retryAfter?: number
  resetTime?: number
  remainingDaily?: number
  remainingMonthly?: number
}

export interface GuardrailConfig {
  enableRateLimiting: boolean
  enableBudgetGuardrails: boolean
  requireUserId: boolean
}

/**
 * Extract user ID from request (can be customized based on auth system)
 */
function extractUserId(request: NextRequest): string {
  // For now, use IP address as user identifier
  // In a real app, you might extract from JWT token, session, etc.
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown'
  return ip
}

/**
 * Check rate limits for a request
 */
function checkRateLimits(userId: string): RateLimitResult {
  return rateLimiter.checkLimits(userId)
}

/**
 * Check budget guardrails for a request
 */
function checkBudgetGuardrails(userId: string, characterCount: number): BudgetCheckResult {
  return budgetGuardrails.checkBudget(userId, characterCount)
}

/**
 * Record usage for budget tracking
 */
function recordUsage(userId: string, characterCount: number): void {
  budgetGuardrails.recordUsage(userId, characterCount)
}

function extractCharacterCount(body: RequestBody): number {
  if (!body) {
    return 0
  }

  const textValue = typeof body['text'] === 'string' ? body['text'] as string :
    typeof body['libranText'] === 'string' ? body['libranText'] as string :
    null

  return textValue ? textValue.length : 0
}

/**
 * Create error response for rate limit exceeded
 */
function createRateLimitResponse(rateLimitResult: RateLimitResult): NextResponse {
  const headers = new Headers()
  headers.set('Retry-After', rateLimitResult.retryAfter?.toString() || '60')
  headers.set('X-RateLimit-Limit', '10') // Per minute limit
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: rateLimitResult.retryAfter,
      resetTime: new Date(rateLimitResult.resetTime).toISOString()
    },
    { status: 429 }
  )
  
  // Set headers
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Create error response for budget exceeded
 */
function createBudgetExceededResponse(budgetResult: BudgetCheckResult): NextResponse {
  const headers = new Headers()
  headers.set('X-Budget-Remaining-Daily', budgetResult.remainingDaily.toString())
  headers.set('X-Budget-Remaining-Monthly', budgetResult.remainingMonthly.toString())
  headers.set('X-Budget-Reset-Time', new Date(budgetResult.resetTime).toISOString())

  const response = NextResponse.json(
    {
      error: 'Budget exceeded',
      message: budgetResult.reason || 'Character limit exceeded',
      remainingDaily: budgetResult.remainingDaily,
      remainingMonthly: budgetResult.remainingMonthly,
      resetTime: new Date(budgetResult.resetTime).toISOString()
    },
    { status: 429 }
  )
  
  // Set headers
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Main guardrails middleware function
 */
export function withGuardrails(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: GuardrailConfig = {
    enableRateLimiting: true,
    enableBudgetGuardrails: true,
    requireUserId: false
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const userId = extractUserId(request)
    const requestId = Math.random().toString(36).substring(7)

    log.debug('Guardrails check started', { requestId, userId, config })

    let parsedRequestBody: unknown
    let hasAttemptedBodyParse = false

    const parseRequestBody = async () => {
      if (!hasAttemptedBodyParse) {
        hasAttemptedBodyParse = true
        try {
          const clonedRequest = request.clone()
          const bodyText = await clonedRequest.text()
          if (bodyText) {
            parsedRequestBody = JSON.parse(bodyText)
          } else {
            parsedRequestBody = undefined
          }
        } catch (error) {
          log.debug('Could not parse request body for character count', { requestId, error })
          parsedRequestBody = undefined
        }
      }
      return parsedRequestBody
    }

    const getCharacterCount = (body: unknown): number => {
      if (!body || typeof body !== 'object') {
        return 0
      }

      const payload = body as Record<string, unknown>
      if (typeof payload.text === 'string') {
        return payload.text.length
      }

      if (typeof payload.libranText === 'string') {
        return payload.libranText.length
      }

      return 0
    }

    try {
      // Check rate limits if enabled
      if (config.enableRateLimiting) {
        const rateLimitResult = checkRateLimits(userId)
        if (!rateLimitResult.allowed) {
          log.warn('Request blocked by rate limiting', { requestId, userId, rateLimitResult })
          return createRateLimitResponse(rateLimitResult)
        }
      }

      let cachedRequestBody: RequestBody = null
      let cachedCharacterCount = 0

      // Check budget guardrails if enabled
      if (config.enableBudgetGuardrails) {
        try {
          const clonedRequest = request.clone()
          const bodyText = await clonedRequest.text()
          if (bodyText) {
            cachedRequestBody = JSON.parse(bodyText) as RequestBody
            cachedCharacterCount = extractCharacterCount(cachedRequestBody)
          }
        } catch (error) {
          log.debug('Could not parse request body for character count', { requestId, error })
        }

        if (cachedCharacterCount > 0) {
          const budgetResult = checkBudgetGuardrails(userId, cachedCharacterCount)
          if (!budgetResult.allowed) {
            log.warn('Request blocked by budget guardrails', { requestId, userId, characterCount: cachedCharacterCount, budgetResult })
            return createBudgetExceededResponse(budgetResult)
          }
        }
      }

      // Execute the original handler
      const response = await handler(request)

      // Record usage for budget tracking if enabled and request was successful
      if (config.enableBudgetGuardrails && response.status < 400) {
        if (cachedCharacterCount > 0) {
          recordUsage(userId, cachedCharacterCount)
        } else if (!cachedRequestBody) {
          log.debug('Could not record usage after request: request body unavailable', { requestId })
        }
      }

      // Add rate limit headers to successful responses
      if (config.enableRateLimiting) {
        const rateLimitStatus = rateLimiter.getStatus(userId)
        response.headers.set('X-RateLimit-Limit', '10')
        response.headers.set('X-RateLimit-Remaining', rateLimitStatus.user.tokens.toString())
        response.headers.set('X-RateLimit-Reset', new Date(rateLimitStatus.user.lastRefill + 60000).toISOString())
      }

      // Add budget headers to successful responses
      if (config.enableBudgetGuardrails) {
        const budgetStatus = budgetGuardrails.getBudgetStatus(userId)
        response.headers.set('X-Budget-Remaining-Daily', (budgetStatus.dailyResetTime - Date.now() > 0 ? 
          Math.max(0, parseInt(process.env.MAX_CHARS_PER_DAY || '100000') - budgetStatus.dailyChars) : 
          parseInt(process.env.MAX_CHARS_PER_DAY || '100000')).toString())
        response.headers.set('X-Budget-Remaining-Monthly', (budgetStatus.monthlyResetTime - Date.now() > 0 ? 
          Math.max(0, parseInt(process.env.MAX_CHARS_PER_MONTH || '1000000') - budgetStatus.monthlyChars) : 
          parseInt(process.env.MAX_CHARS_PER_MONTH || '1000000')).toString())
      }

      log.debug('Guardrails check passed', { requestId, userId })
      return response

    } catch (error) {
      log.errorWithContext(error as Error, 'GUARDRAILS_MIDDLEWARE_ERROR', requestId, { userId })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Get current guardrails status for a user
 */
export function getGuardrailsStatus(userId: string) {
  const rateLimitStatus = rateLimiter.getStatus(userId)
  const budgetStatus = budgetGuardrails.getBudgetStatus(userId)
  
  return {
    rateLimiting: {
      user: {
        tokens: rateLimitStatus.user.tokens,
        requestCount: rateLimitStatus.user.requestCount
      },
      global: {
        tokens: rateLimitStatus.global.tokens,
        requestCount: rateLimitStatus.global.requestCount
      }
    },
    budget: {
      dailyChars: budgetStatus.dailyChars,
      monthlyChars: budgetStatus.monthlyChars,
      totalCost: budgetStatus.totalCost,
      dailyResetTime: new Date(budgetStatus.dailyResetTime).toISOString(),
      monthlyResetTime: new Date(budgetStatus.monthlyResetTime).toISOString()
    }
  }
}

/**
 * Reset guardrails (useful for testing)
 */
export function resetGuardrails(): void {
  rateLimiter.reset()
  budgetGuardrails.reset()
}
