/**
 * API Configuration for GitHub Pages deployment
 * Since GitHub Pages serves static files, we need to handle API calls differently
 */

// Check if we're running in a static export environment
const isStaticExport = process.env.NODE_ENV === 'production' && typeof window !== 'undefined'

// API base URL configuration
export const API_BASE_URL = isStaticExport 
  ? process.env.NEXT_PUBLIC_API_URL || 'https://yourusername.github.io/english-to-libran-text-to-voice/api'
  : '/api'

// OpenAI API configuration for client-side usage
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '',
  ttsVoice: process.env.OPENAI_TTS_VOICE || 'alloy',
  model: 'gpt-4o-mini-tts'
}

// Check if we have the required API key
export const hasOpenAIKey = () => {
  if (typeof window === 'undefined') return false
  return !!OPENAI_CONFIG.apiKey && OPENAI_CONFIG.apiKey !== 'your_openai_api_key_here'
}

// Client-side API calls for static export
export const clientSideAPI = {
  async translate(text: string, variant: 'ancient' | 'modern') {
    if (!isStaticExport) {
      // Use server-side API in development
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, variant })
      })
      return response.json()
    }

    // For static export, we'll need to implement client-side translation
    // This is a placeholder - you might want to use a different approach
    throw new Error('Translation not available in static export mode. Please use the development server.')
  },

  async speak(libranText: string, voice: string) {
    if (!isStaticExport) {
      // Use server-side API in development
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libranText, voice, format: 'mp3' })
      })
      return response.blob()
    }

    // For static export, we'll need to implement client-side TTS
    // This is a placeholder - you might want to use a different approach
    throw new Error('TTS not available in static export mode. Please use the development server.')
  }
}

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isStatic = isStaticExport
