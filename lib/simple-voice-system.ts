export type SimpleVoiceId = 'british-male' | 'american-female' | 'alloy-fallback'

export type SimpleVoiceProvider = 'elevenlabs' | 'openai'

export interface SimpleVoiceDefinition {
  id: SimpleVoiceId
  label: string
  description: string
  accent: 'british' | 'american' | 'neutral'
  provider: SimpleVoiceProvider
  elevenLabsVoiceId?: string
  fallbackOpenAIVoice: string
  recommendedText?: string
}

const SIMPLE_VOICE_DEFINITIONS: SimpleVoiceDefinition[] = [
  {
    id: 'british-male',
    label: 'Adam - British English',
    description: 'ElevenLabs male narrator with a natural British accent.',
    accent: 'british',
    provider: 'elevenlabs',
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    fallbackOpenAIVoice: 'alloy',
    recommendedText: 'Welcome to Librán Voice Forge. This is the British accent.'
  },
  {
    id: 'american-female',
    label: 'Bella - American English',
    description: 'ElevenLabs female narrator with a clear American accent.',
    accent: 'american',
    provider: 'elevenlabs',
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
    fallbackOpenAIVoice: 'alloy',
    recommendedText: 'Hello from Librán Voice Forge. This is the American accent.'
  },
  {
    id: 'alloy-fallback',
    label: 'Alloy - OpenAI Fallback',
    description: 'OpenAI alloy voice used when ElevenLabs is unavailable.',
    accent: 'neutral',
    provider: 'openai',
    fallbackOpenAIVoice: 'alloy',
    recommendedText: 'Fallback voice activated. ElevenLabs is unavailable right now.'
  }
]

const SIMPLE_VOICE_MAP: Record<SimpleVoiceId, SimpleVoiceDefinition> = SIMPLE_VOICE_DEFINITIONS
  .reduce((acc, voice) => {
    acc[voice.id] = voice
    return acc
  }, {} as Record<SimpleVoiceId, SimpleVoiceDefinition>)

export const SIMPLE_VOICE_OPTIONS = SIMPLE_VOICE_DEFINITIONS

export function getSimpleVoiceDefinition(voiceId?: string | null): SimpleVoiceDefinition | null {
  if (!voiceId) {
    return null
  }

  const candidate = SIMPLE_VOICE_MAP[voiceId as SimpleVoiceId]
  return candidate ?? null
}

export function isElevenLabsVoice(voiceId: SimpleVoiceId): boolean {
  const definition = SIMPLE_VOICE_MAP[voiceId]
  return definition.provider === 'elevenlabs'
}

export function getDefaultSimpleVoice(): SimpleVoiceId {
  return 'british-male'
}

