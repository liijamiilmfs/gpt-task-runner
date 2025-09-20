'use client'

import { useState } from 'react'
import { VOICES, DEFAULT_VOICE, VOICE_LABELS } from '@/lib/voices'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [variant, setVariant] = useState<'ancient' | 'modern'>('ancient')
  const [libranText, setLibranText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE)
  const [audioUrl, setAudioUrl] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleTranslate = async () => {
    if (!inputText.trim()) return

    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, variant })
      })

      if (!response.ok) throw new Error('Translation failed')
      
      const data = await response.json()
      setLibranText(data.libran)
    } catch (error) {
      console.error('Translation error:', error)
      alert('Translation failed. Please try again.')
    } finally {
      setIsTranslating(false)
    }
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
    } catch (error) {
      console.error('Speech generation error:', error)
      alert('Speech generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            background: 'linear-gradient(45deg, #e94560, #ffd700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Librán Voice Forge
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#ccc', maxWidth: '600px', margin: '0 auto' }}>
            Transform English text into the ancient language of Librán and bring it to life with AI-powered voice synthesis.
          </p>
        </header>

        {/* Main Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '30px',
          marginBottom: '40px'
        }}>
          {/* Translation Section */}
          <div style={{ 
            background: '#16213e', 
            border: '1px solid #0f3460', 
            borderRadius: '12px', 
            padding: '24px' 
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#e94560' }}>
              English to Librán Translation
            </h2>
            
            {/* Variant Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>Variant:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="variant"
                    value="ancient"
                    checked={variant === 'ancient'}
                    onChange={(e) => setVariant(e.target.value as 'ancient' | 'modern')}
                    style={{ accentColor: '#e94560' }}
                  />
                  <span>Ancient</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="variant"
                    value="modern"
                    checked={variant === 'modern'}
                    onChange={(e) => setVariant(e.target.value as 'ancient' | 'modern')}
                    style={{ accentColor: '#e94560' }}
                  />
                  <span>Modern</span>
                </label>
              </div>
            </div>

            {/* Text Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                English Text:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your English text here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  background: '#1a1a2e',
                  border: '1px solid #0f3460',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              style={{
                width: '100%',
                padding: '12px',
                background: isTranslating ? '#666' : '#e94560',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isTranslating ? 'not-allowed' : 'pointer',
                opacity: isTranslating ? 0.7 : 1
              }}
            >
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>

          {/* Audio Section */}
          <div style={{ 
            background: '#16213e', 
            border: '1px solid #0f3460', 
            borderRadius: '12px', 
            padding: '24px' 
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#e94560' }}>
              Librán Audio Output
            </h2>

            {/* Voice Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                Voice:
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a1a2e',
                  border: '1px solid #0f3460',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px'
                }}
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
              style={{
                width: '100%',
                padding: '12px',
                background: isGenerating ? '#666' : '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.7 : 1,
                marginBottom: '20px'
              }}
            >
              {isGenerating ? 'Generating...' : 'Speak'}
            </button>

            {/* Audio Player */}
            {audioUrl && (
              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                  Generated Audio:
                </label>
                <audio
                  controls
                  src={audioUrl}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Translation Result */}
        {libranText && (
          <div style={{ 
            background: '#16213e', 
            border: '1px solid #0f3460', 
            borderRadius: '12px', 
            padding: '24px',
            marginBottom: '40px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '15px', color: '#e94560' }}>
              Translation Result:
            </h3>
            <div style={{ 
              background: '#1a1a2e', 
              border: '1px solid #0f3460', 
              borderRadius: '8px', 
              padding: '16px',
              fontSize: '18px',
              lineHeight: '1.6',
              fontFamily: 'serif'
            }}>
              {libranText}
            </div>
          </div>
        )}

        {/* Features */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '30px', color: '#e94560' }}>
            Features
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px' 
          }}>
            <div style={{ 
              background: '#16213e', 
              border: '1px solid #0f3460', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '10px', color: '#e94560' }}>
                Deterministic Translation
              </h3>
              <p style={{ color: '#ccc' }}>
                Rule-based English-to-Librán translation using comprehensive dictionaries
              </p>
            </div>
            <div style={{ 
              background: '#16213e', 
              border: '1px solid #0f3460', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '10px', color: '#e94560' }}>
                AI Voice Synthesis
              </h3>
              <p style={{ color: '#ccc' }}>
                OpenAI TTS integration with customizable voice parameters
              </p>
            </div>
            <div style={{ 
              background: '#16213e', 
              border: '1px solid #0f3460', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '10px', color: '#e94560' }}>
                Multiple Formats
              </h3>
              <p style={{ color: '#ccc' }}>
                Support for MP3, WAV, and FLAC audio output formats
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
