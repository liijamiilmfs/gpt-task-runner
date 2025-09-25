import { NextRequest, NextResponse } from 'next/server'
import { withGuardrails } from '@/lib/api-guardrails'
import { log, LogEvents, generateCorrelationId } from '@/lib/logger'
import { metrics } from '@/lib/metrics'
import { ErrorCode, createErrorResponse } from '@/lib/error-taxonomy'
import { synthesizeCleanSpeech } from '@/lib/clean-tts'
import {
  getSimpleVoiceDefinition,
  getDefaultSimpleVoice
} from '@/lib/simple-voice-system'

type CleanTTSFormat = 'mp3' | 'wav' | 'flac'

const SUPPORTED_FORMATS = new Set<CleanTTSFormat>(['mp3', 'wav', 'flac'])       

async function handleSpeakClean(request: NextRequest) {
  const requestId = generateCorrelationId()
  const startTime = Date.now()
  let success = false
  let characterCount = 0
  let providerUsed: string | null = null
  let usedVoice: string | null = null
  let fallbackUsed = false

  log.apiRequest('POST', '/api/speak-clean', requestId)

  try {
    const payload = await request.json()
    const text = typeof payload.libranText === 'string' ? payload.libranText.trim() : ''                                                                        
    const rawVoice = typeof payload.voice === 'string' ? payload.voice : getDefaultSimpleVoice()                                                                
    const requestedFormat = typeof payload.format === 'string' ? payload.format.toLowerCase() : 'mp3'                                                           

    if (!text) {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_MISSING_TEXT, { requestId })                                                               
      metrics.recordError('validation_error', 'libranText is required for TTS generation')                                                                      
      log.validationFail('libranText', 'Missing Librán text for TTS generation', requestId)                                                                     
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })                                                                            
    }

    if (!SUPPORTED_FORMATS.has(requestedFormat as CleanTTSFormat)) {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_INVALID_FORMAT, { requestId, format: requestedFormat })                                    
      metrics.recordError('validation_error', `Unsupported audio format: ${requestedFormat}`)                                                                   
      log.validationFail('format', 'Unsupported audio format requested', requestId, { format: requestedFormat })                                                
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })                                                                            
    }

    const format = requestedFormat as CleanTTSFormat
    const voiceDefinition = getSimpleVoiceDefinition(rawVoice)
    if (!voiceDefinition) {
      const errorResponse = createErrorResponse(ErrorCode.VALIDATION_INVALID_VOICE, { requestId, voice: rawVoice })                                             
      metrics.recordError('validation_error', `Unknown voice requested: ${rawVoice}`)                                                                           
      log.validationFail('voice', 'Unknown voice requested for clean TTS', requestId, { voice: rawVoice })                                                      
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })                                                                            
    }

    characterCount = text.length

    log.info('Clean TTS generation started', {
      event: LogEvents.TTS_START,
      corr_id: requestId,
      ctx: {
        text_length: characterCount,
        voice: voiceDefinition.id,
        provider: voiceDefinition.provider,
        format
      }
    })

    const ttsResult = await synthesizeCleanSpeech({
      text,
      voiceId: voiceDefinition.id,
      format,
      requestId
    })

    providerUsed = ttsResult.provider
    usedVoice = ttsResult.usedVoiceId
    fallbackUsed = ttsResult.fallbackUsed
    success = true

    const headers = new Headers()
    const contentType = format === 'wav' ? 'audio/wav' : format === 'flac' ? 'audio/flac' : 'audio/mpeg'                                                        
    headers.set('Content-Type', contentType)
    headers.set('Content-Length', ttsResult.audioBuffer.length.toString())      
    headers.set('Cache-Control', 'no-store')
    headers.set('X-Voice-Provider', providerUsed)
    headers.set('X-Voice-Requested', voiceDefinition.id)
    headers.set('X-Voice-Label', voiceDefinition.label)
    headers.set('X-Voice-Used', usedVoice)
    headers.set('X-Voice-Fallback', fallbackUsed ? 'true' : 'false')
    if (ttsResult.failureReason) {
      headers.set('X-Voice-Fallback-Reason', ttsResult.failureReason)
    }

    metrics.recordTTSGeneration(ttsResult.estimatedDurationMs / 1000)

    return new NextResponse(ttsResult.audioBuffer as any, {
      status: 200,
      headers
    })
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error'    
    const errorResponse = createErrorResponse(ErrorCode.TTS_GENERATION_FAILED, { requestId }, error)                                                            

    log.error('Clean TTS generation failed', {
      event: LogEvents.TTS_ERROR,
      corr_id: requestId,
      err: {
        type: 'external_api',
        code: 'CLEAN_TTS_ERROR',
        msg: message
      }
    })

    metrics.recordError('tts_error', message)
    return NextResponse.json(errorResponse.body, { status: errorResponse.status })                                                                              
  } finally {
    const durationMs = Date.now() - startTime
    log.apiResponse('POST', '/api/speak-clean', success ? 200 : 500, durationMs, requestId, {                                                                   
      success,
      provider: providerUsed,
      voice: usedVoice ?? undefined,
      fallback: fallbackUsed
    })
    metrics.recordRequest('tts', success, durationMs, characterCount)
  }
}

export const POST = withGuardrails(handleSpeakClean, {
  enableRateLimiting: true,
  enableBudgetGuardrails: true,
  requireUserId: false
})
