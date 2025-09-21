'use client'

import { useState } from 'react'
import { BookOpen, FileText, Hash, Calendar } from 'lucide-react'
import CopyButton from './CopyButton'
import { generateFilename, formatFileSize } from '@/lib/clipboard-utils'

interface TranslationResultProps {
  libranText: string
  variant: 'ancient' | 'modern'
  originalText?: string
  confidence?: number
  wordCount?: number
  className?: string
}

export default function TranslationResult({
  libranText,
  variant,
  originalText,
  confidence,
  wordCount,
  className = ''
}: TranslationResultProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!libranText.trim()) return null

  const filename = generateFilename(variant, libranText, 'txt')
  const fileSize = new Blob([libranText]).size

  return (
    <div className={`bg-libran-dark border border-libran-gold/20 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-libran-gold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Translation Result
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-libran-gold/70 hover:text-libran-gold text-sm transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Translation Text */}
      <div className="mb-4">
        <div className="bg-libran-darker border border-libran-gold/10 rounded-md p-4 mb-3">
          <div className="text-lg leading-relaxed font-serif text-white whitespace-pre-wrap">
            {libranText}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <CopyButton
            content={libranText}
            filename={filename}
            variant="both"
            size="md"
          />
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="border-t border-libran-gold/10 pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Variant */}
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-libran-gold/70" />
              <span className="text-libran-gold/70">Variant:</span>
              <span className="text-white capitalize">{variant}</span>
            </div>

            {/* Word Count */}
            {wordCount && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-libran-gold/70" />
                <span className="text-libran-gold/70">Words:</span>
                <span className="text-white">{wordCount}</span>
              </div>
            )}

            {/* Confidence */}
            {confidence !== undefined && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 text-libran-gold/70">%</div>
                <span className="text-libran-gold/70">Confidence:</span>
                <span className="text-white">{(confidence * 100).toFixed(1)}%</span>
              </div>
            )}

            {/* File Size */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-libran-gold/70" />
              <span className="text-libran-gold/70">Size:</span>
              <span className="text-white">{formatFileSize(fileSize)}</span>
            </div>
          </div>

          {/* Original Text (if provided) */}
          {originalText && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-libran-gold/70 mb-2">Original Text:</h4>
              <div className="bg-libran-darker border border-libran-gold/10 rounded-md p-3">
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {originalText}
                </div>
              </div>
            </div>
          )}

          {/* Filename Preview */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-libran-gold/70 mb-2">Suggested Filename:</h4>
            <div className="bg-libran-darker border border-libran-gold/10 rounded-md p-3">
              <code className="text-sm text-libran-gold font-mono">
                {filename}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
