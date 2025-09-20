import { NextRequest, NextResponse } from 'next/server'
import { translate, Variant } from '@/lib/translator'

export async function POST(request: NextRequest) {
  try {
    const { text, variant = 'ancient' } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    if (!['ancient', 'modern'].includes(variant)) {
      return NextResponse.json(
        { error: 'Variant must be either "ancient" or "modern"' },
        { status: 400 }
      )
    }

    // Translate the text
    const result = translate(text, variant as Variant)

    return NextResponse.json({
      libran: result.libran,
      originalText: text,
      variant: variant,
      confidence: result.confidence,
      wordCount: result.wordCount
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
