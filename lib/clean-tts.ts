import OpenAI from 'openai'
import { log, LogEvents, generateCorrelationId } from './logger'
import {
  getSimpleVoiceDefinition,
  SimpleVoiceId,
  SimpleVoiceDefinition
} from './simple-voice-system'

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech'       
const DEFAULT_ELEVEN_MODEL = 'eleven_turbo_v2'
const DEFAULT_ELEVEN_OUTPUT_FORMAT = 'mp3_44100_128'
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts'  

interface ElevenLabsResult {
  buffer: Buffer
  voiceUsed: string
}

export interface CleanTTSOptions {
  text: string
  voiceId: SimpleVoiceId
  format?: 'mp3' | 'wav' | 'flac'
  requestId?: string
}

export interface CleanTTSResult {
  audioBuffer: Buffer
  provider: 'elevenlabs' | 'openai'
  usedVoiceId: string
  fallbackUsed: boolean
  failureReason?: string
  estimatedDurationMs: number
}

class ElevenLabsError extends Error {
  statusCode?: number
  details?: string

  constructor(message: string, statusCode?: number, details?: string) {
    super(message)
    this.name = 'ElevenLabsError'
    this.statusCode = statusCode
    this.details = details
  }
}

function assertEnvironmentVariable(name: string, value: string | undefined): asserts value is string {                                                          
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
}

function sanitizeTextForElevenLabs(text: string): string {
  // First, let's log the original text to see what we're dealing with
  console.log('=== SANITIZATION DEBUG ===');
  console.log('Original text length:', text.length);
  console.log('Original text preview:', text.slice(0, 100));

  // Find all non-ASCII characters
  const nonAsciiChars = text.split('').map((c, i) => ({ char: c, code: c.charCodeAt(0), index: i })).filter(c => c.code > 127);                                 
  console.log('Non-ASCII characters found:', nonAsciiChars.slice(0, 10));       

  // Replace problematic Unicode characters that ElevenLabs can't handle        
  let sanitized = text
    .replace(/–/g, '-') // Replace em dash (8211) with regular dash
    .replace(/—/g, '-') // Replace en dash (8212) with regular dash
    .replace(/"/g, '"') // Replace smart quotes with regular quotes
    .replace(/"/g, '"')
    .replace(/'/g, "'") // Replace smart apostrophes with regular apostrophes   
    .replace(/'/g, "'")
    .replace(/…/g, '...') // Replace ellipsis with three dots
    .replace(/[\u2010-\u2015]/g, '-') // Replace various dash characters        
    .replace(/[\u2018-\u2019]/g, "'") // Replace various apostrophe characters  
    .replace(/[\u201C-\u201D]/g, '"') // Replace various quote characters       
    .replace(/[^\x00-\x7F]/g, '?') // Replace any remaining non-ASCII characters with ?                                                                         

  console.log('Sanitized text length:', sanitized.length);
  console.log('Sanitized text preview:', sanitized.slice(0, 100));
  console.log('Was text changed?', sanitized !== text);
  console.log('=== END SANITIZATION DEBUG ===');

  return sanitized;
}

async function callElevenLabs(
  text: string,
  voice: SimpleVoiceDefinition,
  format: CleanTTSOptions['format'],
  requestId: string
): Promise<ElevenLabsResult> {
  assertEnvironmentVariable('ELEVENLABS_API_KEY', process.env.ELEVENLABS_API_KEY)                                                                               

  if (!voice.elevenLabsVoiceId) {
    throw new ElevenLabsError(`Voice ${voice.id} does not have an ElevenLabs voice ID configured`)                                                              
  }

  // Sanitize text for ElevenLabs compatibility
  const sanitizedText = sanitizeTextForElevenLabs(text)

  // Always log the sanitization for debugging
  log.info('Text sanitization for ElevenLabs', {
    event: LogEvents.TTS_START,
    corr_id: requestId,
    ctx: {
      original_length: text.length,
      sanitized_length: sanitizedText.length,
      original_text: text.slice(0, 100),
      sanitized_text: sanitizedText.slice(0, 100),
      was_sanitized: sanitizedText !== text,
      original_chars: text.split('').map((c, i) => ({ char: c, code: c.charCodeAt(0), index: i })).filter(c => c.code > 127).slice(0, 10)                       
    }
  })

  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_ELEVEN_MODEL       
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT ?? DEFAULT_ELEVEN_OUTPUT_FORMAT                                                                     

  const url = `${ELEVENLABS_BASE_URL}/${voice.elevenLabsVoiceId}`

  log.info('Calling ElevenLabs TTS', {
    event: LogEvents.TTS_START,
    corr_id: requestId,
    ctx: {
      provider: 'elevenlabs',
      voice: voice.id,
      voice_label: voice.label,
      model: modelId,
      format: outputFormat,
      text_length: text.length
    }
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      Accept: format === 'wav' ? 'audio/wav' : 'audio/mpeg'
    },
    body: JSON.stringify({
      text: sanitizedText,
      model_id: modelId,
      output_format: outputFormat,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75
      }
    })
  })

  if (!response.ok) {
    const details = await response.text()
    throw new ElevenLabsError(
      `ElevenLabs API request failed with status ${response.status}`,
      response.status,
      details.slice(0, 500)
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuffer),
    voiceUsed: voice.id
  }
}

async function callOpenAITTS(
  text: string,
  voice: SimpleVoiceDefinition,
  format: CleanTTSOptions['format'],
  requestId: string,
  failureReason?: string
): Promise<CleanTTSResult> {
  assertEnvironmentVariable('OPENAI_API_KEY', process.env.OPENAI_API_KEY)       

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await client.audio.speech.create({
    model: DEFAULT_OPENAI_MODEL,
    voice: voice.fallbackOpenAIVoice as any,
    input: text,
    response_format: (format ?? 'mp3') as any
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  const words = text.trim().split(/\s+/).filter(Boolean)
  const estimatedDurationMs = words.length > 0
    ? Math.round((words.length / 150) * 60 * 1000)
    : 2000

  log.tts(text, voice.fallbackOpenAIVoice, estimatedDurationMs, requestId, {    
    provider: 'openai',
    requestedVoice: voice.id,
    failureReason,
    bufferSize: buffer.length
  })

  return {
    audioBuffer: buffer,
    provider: 'openai',
    usedVoiceId: voice.fallbackOpenAIVoice,
    fallbackUsed: voice.provider === 'elevenlabs',
    failureReason,
    estimatedDurationMs
  }
}

export async function synthesizeCleanSpeech(options: CleanTTSOptions): Promise<CleanTTSResult> {                                                                
  const { text, voiceId, format = 'mp3' } = options
  const requestId = options.requestId ?? generateCorrelationId()

  const voiceDefinition = getSimpleVoiceDefinition(voiceId)
  if (!voiceDefinition) {
    throw new Error(`Unknown voice: ${voiceId}`)
  }

  if (voiceDefinition.provider === 'elevenlabs') {
    try {
      const elevenResult = await callElevenLabs(text, voiceDefinition, format, requestId)                                                                       
      const words = text.trim().split(/\s+/).filter(Boolean)
      const estimatedDurationMs = words.length > 0
        ? Math.round((words.length / 150) * 60 * 1000)
        : 2000

      log.tts(text, voiceDefinition.id, estimatedDurationMs, requestId, {       
        provider: 'elevenlabs',
        bufferSize: elevenResult.buffer.length
      })

      return {
        audioBuffer: elevenResult.buffer,
        provider: 'elevenlabs',
        usedVoiceId: elevenResult.voiceUsed,
        fallbackUsed: false,
        estimatedDurationMs
      }
    } catch (error) {
      const err = error as ElevenLabsError | Error
      log.error('ElevenLabs TTS failed', {
        event: LogEvents.TTS_ERROR,
        corr_id: requestId,
        err: {
          type: 'external_api',
          code: 'ELEVENLABS_ERROR',
          msg: err.message,
          status: err instanceof ElevenLabsError ? err.statusCode : undefined   
        },
        ctx: {
          provider: 'elevenlabs',
          voice: voiceDefinition.id,
          details: err instanceof ElevenLabsError ? err.details : undefined     
        }
      })

      return callOpenAITTS(text, voiceDefinition, format, requestId, err.message)                                                                               
    }
  }

  return callOpenAITTS(text, voiceDefinition, format, requestId)
}
