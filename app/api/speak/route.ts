import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { metrics } from '@/lib/metrics'
import { log } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let success = false
  let characterCount = 0
  let audioDuration = 0
  const requestId = Math.random().toString(36).substring(7)

  log.apiRequest('POST', '/api/speak', { requestId })

  try {
    const { 
      libranText, 
      voice = process.env.OPENAI_TTS_VOICE ?? 'alloy', 
      format = process.env.AUDIO_FORMAT ?? 'mp3'
    } = await request.json()

    if (!libranText || typeof libranText !== 'string') {
      log.warn('TTS validation failed: missing or invalid libranText', { requestId })
      metrics.recordError('validation_error', 'libranText is required and must be a string')
      return NextResponse.json(
        { error: 'libranText is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate voice parameter
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    if (!validVoices.includes(voice)) {
      log.warn('TTS validation failed: invalid voice parameter', { requestId, voice })
      metrics.recordError('validation_error', 'Invalid voice parameter')
      return NextResponse.json(
        { error: 'Invalid voice parameter' },
        { status: 400 }
      )
    }

    // Validate format parameter
    const validFormats = ['mp3', 'wav', 'flac']
    if (!validFormats.includes(format)) {
      log.warn('TTS validation failed: invalid format parameter', { requestId, format })
      metrics.recordError('validation_error', 'Invalid format parameter')
      return NextResponse.json(
        { error: 'Invalid format parameter' },
        { status: 400 }
      )
    }

    characterCount = libranText.length
    log.info('Starting TTS generation', { requestId, textLength: libranText.length, voice, format })

    // Generate speech using OpenAI TTS
    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY! 
    });
    
    const response = await client.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts',
      voice: voice as any,
      input: libranText,
      response_format: format as any,
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    success = true

    // Estimate audio duration (rough calculation: ~150 words per minute for TTS)
    const wordCount = libranText.split(/\s+/).length
    audioDuration = (wordCount / 150) * 60 // seconds

    // Log TTS generation details
    log.tts(libranText, voice, audioDuration, {
      requestId,
      format,
      wordCount,
      bufferSize: audioBuffer.length
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
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Content-Disposition', `attachment; filename="libran-audio.${format}"`)

    return new NextResponse(audioBuffer, {
      status: 200,
      headers
    })

  } catch (error: any) {
    log.errorWithContext(error, 'TTS API', { requestId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific OpenAI errors
    if (error.status === 429) {
      log.warn('OpenAI quota exceeded', { requestId, errorType: 'quota_exceeded' })
      metrics.recordError('openai_quota_error', 'OpenAI quota exceeded')
      return NextResponse.json(
        {
          error: 'OpenAI quota exceeded. Please check your billing details or try again later.',
          type: 'quota_exceeded',
          details: 'You have exceeded your current OpenAI API quota. Please add credits or upgrade your plan.'
        },
        { status: 429 }
      )
    }

    if (error.type === 'insufficient_quota') {
      log.warn('OpenAI insufficient quota', { requestId, errorType: 'insufficient_quota' })
      metrics.recordError('openai_quota_error', 'OpenAI insufficient quota')
      return NextResponse.json(
        {
          error: 'OpenAI quota exceeded. Please check your billing details.',
          type: 'quota_exceeded',
          details: 'Your OpenAI account has insufficient quota for this request.'
        },
        { status: 429 }
      )
    }

    metrics.recordError('tts_error', errorMessage)
    return NextResponse.json(
      { error: 'Speech generation failed' },
      { status: 500 }
    )
  } finally {
    const responseTime = Date.now() - startTime
    log.apiResponse('POST', '/api/speak', success ? 200 : 500, responseTime, { requestId })
    log.performance('tts', responseTime, { requestId, success, audioDuration })
    metrics.recordRequest('tts', success, responseTime, characterCount)
  }
}
