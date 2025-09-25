'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const abortControllerRef = useRef<AbortController | null>(null)

  // Event handler refs to ensure stable references for cleanup
  const handleAudioEndedRef = useRef(() => {
    log.debug('Audio ended')
    setIsPlaying(false)
  })

  const handleAudioPlayRef = useRef(() => {
    log.debug('Audio started playing')
    setIsPlaying(true)
  })

  const handleAudioPauseRef = useRef(() => {
    log.debug('Audio paused')
    setIsPlaying(false)
  })

  // Cleanup function for audio URLs and event listeners
  const cleanupAudio = useCallback(() => {
    // Get the current audioUrl from state at cleanup time to avoid stale closures
    setAudioUrl(currentUrl => {
      if (currentUrl) {
        log.debug('Cleaning up audio URL', { url: currentUrl })
        URL.revokeObjectURL(currentUrl)
      }
      return ''
    })
    
    // Pause the audio but NEVER clear the src attribute
    // This prevents MEDIA_ELEMENT_ERROR while allowing proper Object URL tracking
    if (audioRef.current) {
      audioRef.current.pause()
      // DO NOT clear src - this causes MEDIA_ELEMENT_ERROR
      // The Object URL manager will track the blob URL lifecycle properly
    }
    
    setIsPlaying(false)
  }, []) // Remove audioUrl dependency to avoid stale closures

  // Cleanup on component unmount
  useEffect(() => {
    const audioElement = audioRef.current
    return () => {
      log.debug('AudioPlayer unmounting - cleaning up')
      // Use the captured ref value to avoid stale closure warning
      if (audioElement) {
        audioElement.pause()
        audioElement.src = '' // Only safe to do on component destruction
      }
      cleanupAudio()
      
      // Cancel any ongoing fetch requests
      const abortController = abortControllerRef.current
      if (abortController) {
        abortController.abort()
      }
    }
  }, [cleanupAudio])

  // Cleanup audio when text changes
  useEffect(() => {
    if (audioUrl) {
      log.debug('Text changed - cleaning up previous audio')
      cleanupAudio()
    }
  }, [text, audioUrl, cleanupAudio]) // Include audioUrl dependency

  const generateAudio = async () => {
    if (!text.trim()) {
      log.warn('Attempted to generate audio with empty text')
      return
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    const currentController = new AbortController()
    abortControllerRef.current = currentController

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
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        log.error('Audio generation failed', { status: response.status, statusText: response.statusText })
        throw new Error('Audio generation failed')
      }

      const blob = await response.blob()
      log.debug('Audio blob received', { size: blob.size, type: blob.type })

      // Clean up previous audio URL to prevent memory leaks
      log.debug('Cleaning up previous audio before setting new one')
      cleanupAudio()

      const url = URL.createObjectURL(blob)
      log.debug('Created blob URL', { url, blobSize: blob.size, blobType: blob.type })
      
      setAudioUrl(url)
      onAudioGenerated(url)
      log.info('Audio generated successfully', { 
        url, 
        size: blob.size, 
        type: blob.type,
        blobConstructor: blob.constructor.name 
      })

      // Auto-play the generated audio
      if (audioRef.current) {
        log.debug('Setting audio source and attempting playback', { url, volume, isMuted })
        
        // Blob URLs are created locally and should be accessible
        
        // Set the new source directly (don't clear first as it causes errors)
        log.debug('Setting audio source', { 
          currentSrc: audioRef.current.src,
          newSrc: url,
          volume: isMuted ? 0 : volume
        })
        audioRef.current.src = url
        audioRef.current.volume = isMuted ? 0 : volume
        log.debug('Audio source set', { 
          src: audioRef.current.src,
          volume: audioRef.current.volume
        })
        
        // Load and play the audio
        audioRef.current.load()
        
        log.debug('Audio element state after load', { 
          readyState: audioRef.current.readyState,
          src: audioRef.current.src,
          networkState: audioRef.current.networkState
        })
        
        // Wait a moment for the audio to load, then play
        setTimeout(() => {
          if (audioRef.current) {
            log.debug('Attempting audio playback', { 
              readyState: audioRef.current.readyState,
              networkState: audioRef.current.networkState,
              src: audioRef.current.src,
              volume: audioRef.current.volume,
              muted: audioRef.current.muted
            })
            
            const playPromise = audioRef.current.play()
            if (playPromise !== undefined) {
              playPromise.then(() => {
                log.debug('Audio playback started successfully')
                setIsPlaying(true)
              }).catch(error => {
                if (error.name === 'AbortError') {
                  log.debug('Audio playback cancelled')
                } else {
                  log.warn('Audio playback failed', { error: error.message, errorName: error.name })
                }
              })
            } else {
              log.debug('Audio playback started (no promise returned)')
              setIsPlaying(true)
            }
          }
        }, 100)
      } else {
        log.warn('Audio ref is null, cannot play audio')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        log.debug('Audio generation cancelled')
        return
      }
      log.error('Audio generation error', { error: error instanceof Error ? error.message : 'Unknown error' })
      alert('Audio generation failed. Please try again.')
    } finally {
      if (abortControllerRef.current === currentController) {
        setIsGenerating(false)
        onLoadingChange(false)
        abortControllerRef.current = null
      }
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(error => {
        if (error.name === 'AbortError') {
          log.debug('Audio playback cancelled')
        } else {
          log.warn('Audio playback failed', { error: error.message })
        }
      })
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

  const downloadAudio = useCallback(() => {
    if (!audioUrl) return

    log.debug('Starting audio download', { url: audioUrl })
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `libran-audio-${Date.now()}.mp3`
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    
    // Clean up the DOM element immediately
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
        log.debug('Download link removed from DOM')
      }
    }, 100)
  }, [audioUrl])

  // Set up audio event listeners with proper cleanup
  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    log.debug('Setting up audio event listeners')

    // Capture ref values to avoid stale closure issues
    const handleEnded = handleAudioEndedRef.current
    const handlePlay = handleAudioPlayRef.current
    const handlePause = handleAudioPauseRef.current

    // Add event listeners
    audioElement.addEventListener('ended', handleEnded)
    audioElement.addEventListener('play', handlePlay)
    audioElement.addEventListener('pause', handlePause)

    // Cleanup function
    return () => {
      log.debug('Removing audio event listeners')
      audioElement.removeEventListener('ended', handleEnded)
      audioElement.removeEventListener('play', handlePlay)
      audioElement.removeEventListener('pause', handlePause)
    }
  }, [audioUrl]) // Re-setup when audio URL changes

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
        ref={(ref) => {
          (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current = ref
          if (ref) {
            log.debug('Audio element created', { 
              readyState: ref.readyState,
              networkState: ref.networkState,
              src: ref.src,
              volume: ref.volume,
              muted: ref.muted
            })
          }
        }}
        className="hidden"
        controls={false}
        preload="none"
        onLoadedData={() => log.debug('Audio loaded successfully')}
        onCanPlay={() => log.debug('Audio can play')}
        onPlay={() => log.debug('Audio started playing')}
        onPause={() => log.debug('Audio paused')}
        onError={(e) => {
          const error = e.currentTarget.error
          log.error('Audio error', { 
            error: error,
            errorCode: error?.code,
            errorMessage: error?.message,
            networkState: e.currentTarget.networkState,
            readyState: e.currentTarget.readyState,
            src: e.currentTarget.src
          })
        }}
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
