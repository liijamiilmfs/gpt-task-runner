'use client'

import { useState } from 'react'
import { VOICES, DEFAULT_VOICE, VOICE_LABELS } from '@/lib/voices'
import TranslationForm from './components/TranslationForm'
import TranslationResult from './components/TranslationResult'
import AudioDownloadButton from './components/AudioDownloadButton'
import PhrasePicker from './components/PhrasePicker'
import { generateFilename } from '@/lib/clipboard-utils'
import { Phrase } from '@/lib/phrase-service'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [variant, setVariant] = useState<'ancient' | 'modern'>('ancient')
  const [libranText, setLibranText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE)
  const [audioUrl, setAudioUrl] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [translationData, setTranslationData] = useState<{
    confidence?: number
    wordCount?: number
  }>({})

  const handleTranslation = (translatedText: string, selectedVariant: 'ancient' | 'modern', originalText: string, translationData?: { confidence?: number, wordCount?: number }) => {
    setLibranText(translatedText)
    setVariant(selectedVariant)
    setInputText(originalText)
    if (translationData) {
      setTranslationData(translationData)
    }
  }

  const handleTranslationComplete = async (text: string, variant: 'ancient' | 'modern') => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, variant })
      })

      if (!response.ok) throw new Error('Translation failed')
      
      const data = await response.json()
      setLibranText(data.libran)
      setTranslationData({
        confidence: data.confidence,
        wordCount: data.wordCount
      })
    } catch (error) {
      console.error('Translation error:', error)
      alert('Translation failed. Please try again.')
    }
  }

  const handlePhraseSelect = (phrase: Phrase, selectedVariant: 'ancient' | 'modern') => {
    const phraseText = selectedVariant === 'ancient' ? phrase.ancient : phrase.modern
    setLibranText(phraseText)
    setInputText(phrase.english)
    setVariant(selectedVariant)
    setTranslationData({
      confidence: 1.0, // Phrases are pre-translated, so 100% confidence
      wordCount: phrase.english.split(' ').length
    })
  }

  const handleSpeak = async () => {
    if (!libranText.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          libranText, 
          voice: selectedVoice,
          format: 'mp3'
        })
      })

      if (!response.ok) throw new Error('Speech generation failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setAudioBlob(blob)
    } catch (error) {
      console.error('Speech generation error:', error)
      alert('Speech generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-libran-red to-libran-gold bg-clip-text text-transparent">
            Librán Voice Forge
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Transform English text into the ancient language of Librán and bring it to life with AI-powered voice synthesis.
          </p>
        </header>

        {/* Main Workflow */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Translation Input */}
          <div className="xl:col-span-1">
            <div className="bg-libran-dark border border-libran-gold/20 rounded-xl p-6 h-full">
              <h2 className="text-xl font-semibold mb-4 text-libran-gold">
                English to Librán Translation
              </h2>
              
              <TranslationForm
                onTranslation={handleTranslation}
                onLoadingChange={setIsTranslating}
              />
            </div>
          </div>

          {/* Center Column - Translation Result & Audio */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              {/* Translation Result */}
              <TranslationResult
                libranText={libranText}
                variant={variant}
                originalText={inputText}
                confidence={translationData.confidence}
                wordCount={translationData.wordCount}
              />

              {/* Audio Controls */}
              <div className="bg-libran-dark border border-libran-gold/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-libran-gold">
                  Audio Output
                </h3>

                {/* Voice Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Voice:
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value as any)}
                    className="input-field"
                  >
                    {VOICES.map(voice => (
                      <option key={voice} value={voice}>
                        {VOICE_LABELS[voice]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speak Button */}
                <button
                  onClick={handleSpeak}
                  disabled={!libranText.trim() || isGenerating}
                  className="btn-primary w-full mb-4"
                >
                  {isGenerating ? 'Generating...' : 'Speak'}
                </button>

                {/* Audio Player */}
                {audioUrl && (
                  <div className="space-y-3">
                    <audio
                      controls
                      src={audioUrl}
                      className="w-full"
                    />
                    
                    {/* Audio Download Button */}
                    <AudioDownloadButton
                      audioBlob={audioBlob}
                      variant={variant}
                      content={libranText}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Phrase Picker */}
          <div className="xl:col-span-1">
            <div className="bg-libran-dark border border-libran-gold/20 rounded-xl p-6 h-full">
              <h3 className="text-lg font-semibold mb-4 text-libran-gold">
                Phrase Library
              </h3>
              <PhrasePicker
                onPhraseSelect={handlePhraseSelect}
                onLoadingChange={setIsTranslating}
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6 text-libran-gold">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-libran-dark border border-libran-gold/20 rounded-xl p-4 text-center">
              <h3 className="text-lg font-semibold mb-2 text-libran-gold">
                Deterministic Translation
              </h3>
              <p className="text-gray-300 text-sm">
                Rule-based English-to-Librán translation using comprehensive dictionaries
              </p>
            </div>
            <div className="bg-libran-dark border border-libran-gold/20 rounded-xl p-4 text-center">
              <h3 className="text-lg font-semibold mb-2 text-libran-gold">
                AI Voice Synthesis
              </h3>
              <p className="text-gray-300 text-sm">
                OpenAI TTS integration with customizable voice parameters
              </p>
            </div>
            <div className="bg-libran-dark border border-libran-gold/20 rounded-xl p-4 text-center">
              <h3 className="text-lg font-semibold mb-2 text-libran-gold">
                Phrase Integration
              </h3>
              <p className="text-gray-300 text-sm">
                Browse and use authentic Librán phrases with English translations
              </p>
            </div>
            <div className="bg-libran-dark border border-libran-gold/20 rounded-xl p-4 text-center">
              <h3 className="text-lg font-semibold mb-2 text-libran-gold">
                Copy & Download
              </h3>
              <p className="text-gray-300 text-sm">
                Copy translations to clipboard and download with smart filename templates
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
