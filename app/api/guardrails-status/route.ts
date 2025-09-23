import { NextRequest, NextResponse } from 'next/server'
import { getGuardrailsStatus } from '@/lib/api-guardrails'
import { log, generateCorrelationId, LogEvents } from '@/lib/logger'

// Force dynamic rendering since we use request.headers
export const dynamic = 'force-dynamic'

/**
 * GET /api/guardrails-status
 * Returns current guardrails status for the requesting user
 */
export async function GET(request: NextRequest) {
  const requestId = generateCorrelationId()
  
  try {
    // Extract user ID from request (same logic as in api-guardrails.ts)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userId = ip

    log.apiRequest('GET', '/api/guardrails-status', requestId, { userId })

    const status = getGuardrailsStatus(userId)

    log.apiResponse('GET', '/api/guardrails-status', 200, 0, requestId, { userId })

    return NextResponse.json({
      userId,
      status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log.errorWithContext(error as Error, LogEvents.INTERNAL_ERROR, requestId, { api: 'guardrails-status' })
    return NextResponse.json(
      { error: 'Failed to get guardrails status' },
      { status: 500 }
    )
  }
}