'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react'

// Client-side logging utility
const log = {
  info: (message: string, meta?: any) => console.log(`[AudioPlayer] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[AudioPlayer] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[AudioPlayer] ${message}`, meta),
  debug: (message: string, meta?: any) => console.debug(`[AudioPlayer] ${message}`, meta)
}

interface AudioPlayerProps {
  text: string
  onAudioGenerated: (url: string) => void
  onLoadingChange: (loading: boolean) => void
}

export default function AudioPlayer({ text, onAudioGenerated, onLoadingChange }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Cleanup audio URLs on component unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const generateAudio = async () => {
    if (!text.trim()) {
      log.warn('Attempted to generate audio with empty text')
      return
    }

    log.info('Starting audio generation', { textLength: text.length })
    setIsGenerating(true)
    onLoadingChange(true)

    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          libranText: text,
          voice: 'alloy',
          format: 'mp3',
        }),
      })

      if (!response.ok) {
        log.error('Audio generation failed', { status: response.status, statusText: response.statusText })
        throw new Error('Audio generation failed')
      }

      const blob = await response.blob()
      log.debug('Audio blob received', { size: blob.size, type: blob.type })

      // Clean up previous audio URL to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        log.debug('Previous audio URL revoked')
      }

      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      onAudioGenerated(url)
      log.info('Audio generated successfully', { url, size: blob.size })

      // Auto-play the generated audio
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
        setIsPlaying(true)
        log.debug('Audio playback started')
      }
    } catch (error) {
      log.error('Audio generation error', { error: error instanceof Error ? error.message : 'Unknown error' })
      alert('Audio generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
      onLoadingChange(false)
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const downloadAudio = () => {
    if (!audioUrl) return

    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `libran-audio-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  // Clear audio when text changes
  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl('')
      setIsPlaying(false)
    }
  }, [text, audioUrl])

  return (
    <div className="space-y-4">
      {/* Audio Controls */}
      <div className="flex items-center space-x-4">
        <button
          onClick={generateAudio}
          disabled={!text.trim() || isGenerating}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Volume2 className="w-4 h-4" />
          <span>{isGenerating ? 'Generating...' : 'Generate Audio'}</span>
        </button>

        {audioUrl && (
          <button
            onClick={togglePlayPause}
            className="btn-secondary flex items-center space-x-2"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
        )}
      </div>

      {/* Volume Controls */}
      {audioUrl && (
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMute}
            className="text-libran-gold hover:text-libran-gold/80 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-libran-accent rounded-lg appearance-none cursor-pointer slider"
          />
          
          <span className="text-sm text-gray-400 w-8">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      )}

      {/* Download Button */}
      {audioUrl && (
        <div className="flex justify-end">
          <button
            onClick={downloadAudio}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      )}

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Status Message */}
      {!text.trim() && (
        <p className="text-gray-400 text-sm text-center">
          Enter text and translate to generate audio
        </p>
      )}

      {text.trim() && !audioUrl && (
        <p className="text-libran-gold text-sm text-center">
          Click &quot;Generate Audio&quot; to create Librán speech
        </p>
      )}

      {/* Librán Accent Note */}
      <div className="bg-libran-dark border border-libran-accent rounded-lg p-4">
        <h4 className="text-sm font-semibold text-libran-gold mb-2">
          Librán Accent Styling
        </h4>
        <p className="text-xs text-gray-400">
          Voice characteristics: Low, hushed, suspenseful tone with elongated vowels and 
          softened consonants. Pacing is slow and deliberate with strategic pauses.
        </p>
      </div>
    </div>
  )
}
