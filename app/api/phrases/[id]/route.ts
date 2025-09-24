import { NextRequest, NextResponse } from 'next/server'
import { phraseService } from '@/lib/phrase-service'
import { log, generateCorrelationId, LogEvents } from '@/lib/logger'
import { withGuardrails } from '@/lib/api-guardrails'
import { ErrorCode, createErrorResponse } from '@/lib/error-taxonomy'

async function handlePhraseByIdRequest(request: NextRequest) {
  const requestId = generateCorrelationId()
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop() || ''

  log.apiRequest('GET', `/api/phrases/${id}`, requestId)

  try {
    const phrase = await phraseService.getPhraseById(id)
    
    if (!phrase) {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_MISSING_TEXT, { requestId })
      return NextResponse.json(errorResponse.body, { status: 404 })
    }

    log.apiResponse('GET', `/api/phrases/${id}`, 200, 0, requestId, { phraseId: id })

    return NextResponse.json({
      success: true,
      data: phrase,
      requestId
    })

  } catch (error) {
    const errorResponse = createErrorResponse(ErrorCode.TRANSLATION_FAILED, { requestId }, error as Error)
    log.errorWithContext(error instanceof Error ? error : new Error('Unknown error'), LogEvents.TRANSLATE_ERROR, requestId)
    return NextResponse.json(errorResponse.body, { status: errorResponse.status })
  }
}

// Export the guarded handler
export const GET = withGuardrails(handlePhraseByIdRequest, {
  enableRateLimiting: true,
  enableBudgetGuardrails: false,
  requireUserId: false
})
