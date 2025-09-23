import { NextRequest, NextResponse } from 'next/server'
import { translate, Variant } from '@/lib/translator'
import { metrics } from '@/lib/metrics'
import { log, generateCorrelationId, LogEvents } from '@/lib/logger'
import { withGuardrails } from '@/lib/api-guardrails'
import { ErrorCode, createErrorResponse } from '@/lib/error-taxonomy'

async function handleTranslateRequest(request: NextRequest) {
  const startTime = Date.now()
  let success = false
  let characterCount = 0
  let unknownTokens = 0
  let confidence = 0
  const requestId = generateCorrelationId()

  log.apiRequest('POST', '/api/translate', requestId)

  try {
    const { text, variant = 'ancient' } = await request.json()

    if (!text || typeof text !== 'string') {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_MISSING_TEXT, { requestId })
      log.validationFail('text', 'Text is required and must be a string', requestId)
      metrics.recordError('validation_error', 'Text is required and must be a string')
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    if (!['ancient', 'modern'].includes(variant)) {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_INVALID_VARIANT, { requestId, variant })
      log.validationFail('variant', 'Variant must be either "ancient" or "modern"', requestId, { variant })
      metrics.recordError('validation_error', 'Variant must be either "ancient" or "modern"')
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    characterCount = text.length
    log.info('Starting translation', {
      event: LogEvents.TRANSLATE_START,
      corr_id: requestId,
      ctx: { text_length: text.length, variant }
    })

    // Translate the text
    const result = await translate(text, variant as Variant)
    success = true
    confidence = result.confidence
    
    // Count unknown tokens (words that weren't translated)
    const words = text.toLowerCase().split(/\s+/)
    const translatedWords = result.libran.toLowerCase().split(/\s+/)
    unknownTokens = words.filter(word => 
      word.length > 0 && 
      !translatedWords.some(tWord => tWord.includes(word) || word.includes(tWord))
    ).length

    // Log unknown tokens individually
    if (unknownTokens > 0) {
      const unknownWords = words.filter(word => 
        word.length > 0 && 
        !translatedWords.some(tWord => tWord.includes(word) || word.includes(tWord))
      )
      unknownWords.forEach(word => {
        log.unknownToken(word, variant, requestId)
      })
    }

    // Log translation completion
    log.translation(text, variant, result.libran, confidence, requestId, {
      unknownWords: unknownTokens,
      wordCount: result.wordCount
    })

    // Record translation metrics
    metrics.recordTranslation(variant as 'ancient' | 'modern', confidence, unknownTokens)

    return NextResponse.json({
      libran: result.libran,
      originalText: text,
      variant: variant,
      confidence: result.confidence,
      wordCount: result.wordCount
    })

  } catch (error) {
    const errorResponse = createErrorResponse(ErrorCode.TRANSLATION_FAILED, { requestId }, error as Error)
    log.errorWithContext(error instanceof Error ? error : new Error('Unknown error'), LogEvents.TRANSLATE_ERROR, requestId)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    metrics.recordError('translation_error', errorMessage)
    return NextResponse.json(errorResponse.body, { status: errorResponse.status })
  } finally {
    const responseTime = Date.now() - startTime
    log.apiResponse('POST', '/api/translate', success ? 200 : 500, responseTime, requestId, {
      success,
      characterCount,
      unknownTokens,
      confidence
    })
    log.performance('translation', responseTime, requestId, { success })
    metrics.recordRequest('translation', success, responseTime, characterCount)
  }
}

// Export the guarded handler
export const POST = withGuardrails(handleTranslateRequest, {
  enableRateLimiting: true,
  enableBudgetGuardrails: true,
  requireUserId: false
})