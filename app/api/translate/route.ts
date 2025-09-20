import { NextRequest, NextResponse } from 'next/server'
import { translate, Variant } from '@/lib/translator'
import { metrics } from '@/lib/metrics'
import { log } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let success = false
  let characterCount = 0
  let unknownTokens = 0
  let confidence = 0
  const requestId = Math.random().toString(36).substring(7)

  log.apiRequest('POST', '/api/translate', { requestId })

  try {
    const { text, variant = 'ancient' } = await request.json()

    if (!text || typeof text !== 'string') {
      log.warn('Translation validation failed: missing or invalid text', { requestId })
      metrics.recordError('validation_error', 'Text is required and must be a string')
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    if (!['ancient', 'modern'].includes(variant)) {
      log.warn('Translation validation failed: invalid variant', { requestId, variant })
      metrics.recordError('validation_error', 'Variant must be either "ancient" or "modern"')
      return NextResponse.json(
        { error: 'Variant must be either "ancient" or "modern"' },
        { status: 400 }
      )
    }

    characterCount = text.length
    log.info('Starting translation', { requestId, textLength: text.length, variant })

    // Translate the text
    const result = translate(text, variant as Variant)
    success = true
    confidence = result.confidence
    
    // Count unknown tokens (words that weren't translated)
    const words = text.toLowerCase().split(/\s+/)
    const translatedWords = result.libran.toLowerCase().split(/\s+/)
    unknownTokens = words.filter(word => 
      word.length > 0 && 
      !translatedWords.some(tWord => tWord.includes(word) || word.includes(tWord))
    ).length

    // Log translation details
    log.translation(text, variant, result.libran, confidence, {
      requestId,
      wordCount: result.wordCount,
      unknownTokens
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
    log.errorWithContext(error as Error, 'Translation API', { requestId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    metrics.recordError('translation_error', errorMessage)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  } finally {
    const responseTime = Date.now() - startTime
    log.apiResponse('POST', '/api/translate', success ? 200 : 500, responseTime, { requestId })
    log.performance('translation', responseTime, { requestId, success })
    metrics.recordRequest('translation', success, responseTime, characterCount)
  }
}
