import { NextRequest, NextResponse } from 'next/server'
import { translate, Variant } from '@/lib/translator'
import { metrics } from '@/lib/metrics'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let success = false
  let characterCount = 0
  let unknownTokens = 0
  let confidence = 0

  try {
    const { text, variant = 'ancient' } = await request.json()

    if (!text || typeof text !== 'string') {
      metrics.recordError('validation_error', 'Text is required and must be a string')
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    if (!['ancient', 'modern'].includes(variant)) {
      metrics.recordError('validation_error', 'Variant must be either "ancient" or "modern"')
      return NextResponse.json(
        { error: 'Variant must be either "ancient" or "modern"' },
        { status: 400 }
      )
    }

    characterCount = text.length

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
    console.error('Translation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    metrics.recordError('translation_error', errorMessage)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  } finally {
    const responseTime = Date.now() - startTime
    metrics.recordRequest('translation', success, responseTime, characterCount)
  }
}
