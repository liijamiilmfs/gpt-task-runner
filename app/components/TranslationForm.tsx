'use client'

import { useState } from 'react'
import { Send, BookOpen, RefreshCw } from 'lucide-react'

// Client-side logging utility
const log = {
  info: (message: string, meta?: any) => console.log(`[TranslationForm] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[TranslationForm] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[TranslationForm] ${message}`, meta),
  debug: (message: string, meta?: any) => console.debug(`[TranslationForm] ${message}`, meta)
}

interface TranslationFormProps {
  onTranslation: (text: string) => void
  onLoadingChange: (loading: boolean) => void
}

export default function TranslationForm({ onTranslation, onLoadingChange }: TranslationFormProps) {
  const [inputText, setInputText] = useState('')
  const [variant, setVariant] = useState<'ancient' | 'modern'>('ancient')
  const [isTranslating, setIsTranslating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) {
      log.warn('Attempted to translate empty text')
      return
    }

    log.info('Starting translation', { textLength: inputText.length, variant })
    setIsTranslating(true)
    onLoadingChange(true)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          variant,
        }),
      })

      if (!response.ok) {
        log.error('Translation request failed', { status: response.status, statusText: response.statusText })
        throw new Error('Translation failed')
      }

      const data = await response.json()
      log.info('Translation completed', { 
        originalLength: inputText.length, 
        translatedLength: data.libran.length,
        confidence: data.confidence,
        wordCount: data.wordCount
      })
      onTranslation(data.libran)
    } catch (error) {
      log.error('Translation error', { error: error instanceof Error ? error.message : 'Unknown error' })
      alert('Translation failed. Please try again.')
    } finally {
      setIsTranslating(false)
      onLoadingChange(false)
    }
  }

  const handleClear = () => {
    setInputText('')
    onTranslation('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Language Variant Selection */}
      <div className="flex space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="variant"
            value="ancient"
            checked={variant === 'ancient'}
            onChange={(e) => setVariant(e.target.value as 'ancient' | 'modern')}
            className="text-libran-gold focus:ring-libran-gold"
          />
          <span className="text-gray-300">Ancient Librán</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="variant"
            value="modern"
            checked={variant === 'modern'}
            onChange={(e) => setVariant(e.target.value as 'ancient' | 'modern')}
            className="text-libran-gold focus:ring-libran-gold"
          />
          <span className="text-gray-300">Modern Librán</span>
        </label>
      </div>

      {/* Text Input */}
      <div>
        <label htmlFor="inputText" className="block text-sm font-medium text-gray-300 mb-2">
          English Text
        </label>
        <textarea
          id="inputText"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your English text here..."
          className="input-field min-h-[120px] resize-y"
          disabled={isTranslating}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={!inputText.trim() || isTranslating}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTranslating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={!inputText.trim() || isTranslating}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BookOpen className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Character Count */}
      <div className="text-right text-sm text-gray-400">
        {inputText.length} characters
      </div>
    </form>
  )
}



