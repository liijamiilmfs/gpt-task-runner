'use client'

import { VoiceAccent } from '@/lib/voices'

interface AccentSelectorProps {
  selectedAccent: VoiceAccent | null
  onAccentChange: (accent: VoiceAccent | null) => void
  className?: string
}

const ACCENT_OPTIONS = [
  { value: 'libran', label: 'Librán Accent (Recommended)' }
]

export default function AccentSelector({ selectedAccent, onAccentChange, className = '' }: AccentSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">
          Voice Accent:
        </label>
        <button
          onClick={() => onAccentChange(null)}
          className="text-xs text-gray-400 hover:text-white"
        >
          Clear
        </button>
      </div>

      <div className="space-y-3">
        {ACCENT_OPTIONS.map((accent) => (
          <label
            key={accent.value}
            className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              selectedAccent === accent.value
                ? 'bg-libran-gold/20 border-libran-gold text-libran-gold'
                : 'bg-libran-dark border-libran-gold/20 text-gray-300 hover:border-libran-gold/40'
            }`}
          >
            <input
              type="radio"
              name="accent"
              value={accent.value}
              checked={selectedAccent === accent.value}
              onChange={() => onAccentChange(accent.value as VoiceAccent)}
              className="sr-only"
            />
            <div className={`w-3 h-3 rounded-full border-2 ${
              selectedAccent === accent.value
                ? 'bg-libran-gold border-libran-gold'
                : 'border-gray-400'
            }`}>
              {selectedAccent === accent.value && (
                <div className="w-full h-full rounded-full bg-libran-gold scale-50" />
              )}
            </div>
            <span className="text-sm">{accent.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
