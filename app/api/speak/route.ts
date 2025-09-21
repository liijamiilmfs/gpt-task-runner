import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { metrics } from '@/lib/metrics'
import { log } from '@/lib/logger'
import { ttsCache } from '@/lib/tts-cache'
import { withGuardrails } from '@/lib/api-guardrails'
import { ErrorTaxonomy, ErrorCode, createErrorResponse } from '@/lib/error-taxonomy'

async function handleSpeakRequest(request: NextRequest) {
  const startTime = Date.now()
  let success = false
  let characterCount = 0
  let audioDuration = 0
  const requestId = ErrorTaxonomy.generateCorrelationId()

  log.apiRequest('POST', '/api/speak', { requestId })

  try {
    const { 
      libranText, 
      voice = process.env.OPENAI_TTS_VOICE ?? 'alloy', 
      format = process.env.AUDIO_FORMAT ?? 'mp3'
    } = await request.json()

    if (!libranText || typeof libranText !== 'string') {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_MISSING_TEXT, { requestId })
      log.errorTaxonomy(ErrorCode.VALIDATION_MISSING_TEXT, errorResponse.body.error, 'validation', 'low', { requestId })
      metrics.recordError('validation_error', 'libranText is required and must be a string')
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    // Validate voice parameter
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    if (!validVoices.includes(voice)) {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_INVALID_VOICE, { requestId, voice })
      log.errorTaxonomy(ErrorCode.VALIDATION_INVALID_VOICE, errorResponse.body.error, 'validation', 'low', { requestId, voice })
      metrics.recordError('validation_error', 'Invalid voice parameter')
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    // Validate format parameter
    const validFormats = ['mp3', 'wav', 'flac']
    if (!validFormats.includes(format)) {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_INVALID_FORMAT, { requestId, format })
      log.errorTaxonomy(ErrorCode.VALIDATION_INVALID_FORMAT, errorResponse.body.error, 'validation', 'low', { requestId, format })
      metrics.recordError('validation_error', 'Invalid format parameter')
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    characterCount = libranText.length
    log.info('Starting TTS generation', { requestId, textLength: libranText.length, voice, format })

    // Check cache first
    const model = process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts'
    const cacheKey = ttsCache.generateHash(libranText, voice, format, model)
    
    let audioBuffer: Buffer
    let isCacheHit = false
    
    // Try to get from cache
    const cachedAudio = await ttsCache.getCachedAudio(cacheKey)
    if (cachedAudio) {
      audioBuffer = cachedAudio
      isCacheHit = true
      log.info('TTS cache hit', { requestId, cacheKey, bufferSize: audioBuffer.length })
    } else {
      // Generate new audio using OpenAI TTS
      log.info('TTS cache miss, generating new audio', { requestId, cacheKey })
      const client = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY! 
      });
      
      const response = await client.audio.speech.create({
        model: model,
        voice: voice as any,
        input: libranText,
        response_format: format as any,
      });

      audioBuffer = Buffer.from(await response.arrayBuffer())
      
      // Store in cache for future use
      const wordCount = libranText.split(/\s+/).length
      const audioDuration = (wordCount / 150) * 60 // seconds
      
      await ttsCache.storeCachedAudio(
        cacheKey,
        libranText,
        voice,
        format,
        model,
        audioBuffer,
        audioDuration
      )
    }
    
    success = true

    // Estimate audio duration (rough calculation: ~150 words per minute for TTS)
    const wordCount = libranText.split(/\s+/).length
    audioDuration = (wordCount / 150) * 60 // seconds

    // Log TTS generation details
    log.tts(libranText, voice, audioDuration, {
      requestId,
      format,
      wordCount,
      bufferSize: audioBuffer.length,
      cacheHit: isCacheHit,
      cacheKey: isCacheHit ? cacheKey : undefined
    })

    // Record TTS metrics
    metrics.recordTTSGeneration(audioDuration)

    // Set appropriate headers for audio streaming
    const headers = new Headers()
    const contentType = format === 'mp3' ? 'audio/mpeg' : 
                       format === 'wav' ? 'audio/wav' : 
                       'audio/flac'
    headers.set('Content-Type', contentType)
    headers.set('Content-Length', audioBuffer.length.toString())
    // Set cache headers based on whether this was a cache hit
    if (isCacheHit) {
      headers.set('Cache-Control', 'public, max-age=31536000') // 1 year for cached content
      headers.set('X-Cache-Status', 'HIT')
    } else {
      headers.set('Cache-Control', 'public, max-age=3600') // 1 hour for new content
      headers.set('X-Cache-Status', 'MISS')
    }
    headers.set('Content-Disposition', `attachment; filename="libran-audio.${format}"`)

    return new NextResponse(audioBuffer as any, {
      status: 200,
      headers
    })

  } catch (error: any) {
    log.errorWithContext(error, 'TTS API', { requestId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific OpenAI errors
    if (error.status === 429) {
      const errorResponse = createErrorResponse(ErrorCode.OPENAI_QUOTA_EXCEEDED, { requestId })
      log.errorTaxonomy(ErrorCode.OPENAI_QUOTA_EXCEEDED, errorResponse.body.error, 'external_api', 'high', { requestId })
      metrics.recordError('openai_quota_error', 'OpenAI quota exceeded')
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    if (error.type === 'insufficient_quota') {
      const errorResponse = createErrorResponse(ErrorCode.OPENAI_QUOTA_EXCEEDED, { requestId })
      log.errorTaxonomy(ErrorCode.OPENAI_QUOTA_EXCEEDED, errorResponse.body.error, 'external_api', 'high', { requestId })
      metrics.recordError('openai_quota_error', 'OpenAI insufficient quota')
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    // Handle other OpenAI errors
    if (error.name === 'OpenAIError') {
      const errorResponse = createErrorResponse(ErrorCode.OPENAI_API_ERROR, { requestId }, error)
      log.errorTaxonomy(ErrorCode.OPENAI_API_ERROR, errorResponse.body.error, 'external_api', 'high', { requestId })
      metrics.recordError('openai_error', errorMessage)
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }

    // Handle general TTS errors
    const errorResponse = createErrorResponse(ErrorCode.TTS_GENERATION_FAILED, { requestId }, error)
    log.errorTaxonomy(ErrorCode.TTS_GENERATION_FAILED, errorResponse.body.error, 'tts', 'high', { requestId })
    metrics.recordError('tts_error', errorMessage)
    return NextResponse.json(errorResponse.body, { status: errorResponse.status })
  } finally {
    const responseTime = Date.now() - startTime
    log.apiResponse('POST', '/api/speak', success ? 200 : 500, responseTime, { requestId })
    log.performance('tts', responseTime, { requestId, success, audioDuration })
    metrics.recordRequest('tts', success, responseTime, characterCount)
  }
}

// Export the guarded handler
export const POST = withGuardrails(handleSpeakRequest, {
  enableRateLimiting: true,
  enableBudgetGuardrails: true,
  requireUserId: false
})
