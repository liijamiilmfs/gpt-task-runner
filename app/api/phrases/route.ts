import { NextRequest, NextResponse } from 'next/server'
import { phraseService, PhraseFilter, PhraseCategory } from '@/lib/phrase-service'
import { log, generateCorrelationId, LogEvents } from '@/lib/logger'
import { withGuardrails } from '@/lib/api-guardrails'
import { ErrorCode, createErrorResponse } from '@/lib/error-taxonomy'

async function handlePhrasesRequest(request: NextRequest) {
  const requestId = generateCorrelationId()
  const { searchParams } = new URL(request.url)

  log.apiRequest('GET', '/api/phrases', requestId)

  try {
    const action = searchParams.get('action') || 'random'
    const category = searchParams.get('category') as PhraseCategory | undefined
    const difficulty = searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' || undefined
    const search = searchParams.get('search') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const filter: PhraseFilter = {
      category,
      difficulty,
      search
    }

    let result: any

    switch (action) {
      case 'random':
        result = await phraseService.getRandomPhrase(filter)
        break
      
      case 'list':
        result = await phraseService.getPhrases(filter, limit)
        break
      
      case 'categories':
        result = await phraseService.getCategories()
        break
      
      case 'stats':
        result = await phraseService.getPhraseStats()
        break
      
      case 'search':
        if (!search) {
          const errorResponse = createErrorResponse(ErrorCode.VALIDATION_MISSING_TEXT, { requestId })
          return NextResponse.json(errorResponse.body, { status: errorResponse.status })
        }
        result = await phraseService.searchPhrases(search)
        break
      
      case 'phrase-of-the-day':
        result = await phraseService.getPhraseOfTheDay()
        break
      
      default:
        const errorResponse = createErrorResponse(ErrorCode.VALIDATION_INVALID_VARIANT, { requestId })
        return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    log.apiResponse('GET', '/api/phrases', 200, 0, requestId, { action, resultCount: Array.isArray(result) ? result.length : 1 })

    return NextResponse.json({
      success: true,
      action,
      data: result,
      requestId
    })

  } catch (error) {
    const errorResponse = createErrorResponse(ErrorCode.TRANSLATION_FAILED, { requestId }, error as Error)
    log.errorWithContext(error instanceof Error ? error : new Error('Unknown error'), LogEvents.TRANSLATE_ERROR, requestId)
    return NextResponse.json(errorResponse.body, { status: errorResponse.status })
  }
}

async function handlePhraseByIdRequest(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateCorrelationId()
  const { id } = params

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

// Export the guarded handlers
export const GET = withGuardrails(handlePhrasesRequest, {
  enableRateLimiting: true,
  enableBudgetGuardrails: false,
  requireUserId: false
})

