'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { downloadAudioFile, generateFilename, sanitizeFilename } from '@/lib/clipboard-utils'

interface AudioDownloadButtonProps {
  audioBlob: Blob | null
  variant: 'ancient' | 'modern'
  content: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function AudioDownloadButton({
  audioBlob,
  variant,
  content,
  size = 'md',
  className = ''
}: AudioDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleDownload = async () => {
    if (!audioBlob) return
    
    try {
      setIsDownloading(true)
      
      // Generate filename based on content and variant
      const filename = await generateFilename(variant, content, 'mp3')
      const sanitizedFilename = sanitizeFilename(filename)
      
      downloadAudioFile(audioBlob, sanitizedFilename)
    } catch (error) {
      console.error('Audio download failed:', error)
      alert('Failed to download audio file')
    } finally {
      setIsDownloading(false)
    }
  }

  const baseClasses = `
    inline-flex items-center gap-2 rounded-md font-medium transition-all duration-200
    bg-libran-blue text-white hover:bg-libran-blue/90
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-libran-blue focus:ring-offset-2
    ${sizeClasses[size]}
    ${className}
  `.trim()

  return (
    <button
      onClick={handleDownload}
      disabled={!audioBlob || isDownloading}
      className={baseClasses}
      title="Download audio file"
    >
      {isDownloading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Download className={iconSizes[size]} />
      )}
      <span>
        {isDownloading ? 'Downloading...' : 'Download Audio'}
      </span>
    </button>
  )
}
