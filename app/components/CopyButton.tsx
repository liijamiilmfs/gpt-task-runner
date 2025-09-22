'use client'

import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { copyToClipboard, downloadFile, sanitizeFilename } from '@/lib/clipboard-utils'

interface CopyButtonProps {
  content: string
  filename?: string
  variant?: 'copy' | 'download' | 'both'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  successMessage?: string
  errorMessage?: string
}

export default function CopyButton({
  content,
  filename,
  variant = 'copy',
  size = 'md',
  className = '',
  successMessage = 'Copied to clipboard!',
  errorMessage = 'Failed to copy'
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
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

  const handleCopy = async () => {
    try {
      const success = await copyToClipboard(content)
      if (success) {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } else {
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Copy failed:', error)
      alert(errorMessage)
    }
  }

  const handleDownload = async () => {
    if (!filename) return
    
    try {
      setIsDownloading(true)
      const sanitizedFilename = sanitizeFilename(filename)
      downloadFile(content, sanitizedFilename, 'text/plain')
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download file')
    } finally {
      setIsDownloading(false)
    }
  }

  const baseClasses = `
    inline-flex items-center gap-2 rounded-md font-medium transition-all duration-200
    bg-libran-gold text-libran-dark hover:bg-libran-gold/90
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-libran-gold focus:ring-offset-2
    ${sizeClasses[size]}
    ${className}
  `.trim()

  if (variant === 'copy') {
    return (
      <button
        onClick={handleCopy}
        disabled={!content.trim()}
        className={baseClasses}
        title={isCopied ? successMessage : 'Copy to clipboard'}
      >
        {isCopied ? (
          <Check className={iconSizes[size]} />
        ) : (
          <Copy className={iconSizes[size]} />
        )}
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
    )
  }

  if (variant === 'download') {
    return (
      <button
        onClick={handleDownload}
        disabled={!content.trim() || !filename || isDownloading}
        className={baseClasses}
        title="Download as text file"
      >
        <Download className={iconSizes[size]} />
        <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
      </button>
    )
  }

  // Both variant
  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        disabled={!content.trim()}
        className={baseClasses}
        title={isCopied ? successMessage : 'Copy to clipboard'}
      >
        {isCopied ? (
          <Check className={iconSizes[size]} />
        ) : (
          <Copy className={iconSizes[size]} />
        )}
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
      
      <button
        onClick={handleDownload}
        disabled={!content.trim() || !filename || isDownloading}
        className={baseClasses}
        title="Download as text file"
      >
        <Download className={iconSizes[size]} />
        <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
      </button>
    </div>
  )
}
