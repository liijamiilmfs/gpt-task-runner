'use client'

import { useState } from 'react'
import { Settings, Volume2, Mic } from 'lucide-react'

export default function VoiceSettings() {
  const [voice, setVoice] = useState('alloy')
  const [model, setModel] = useState('gpt-4o-mini-tts')
  const [format, setFormat] = useState('mp3')
  const [speed, setSpeed] = useState(0.7)
  const [pitch, setPitch] = useState(0.8)

  const voiceOptions = [
    { value: 'alloy', label: 'Alloy', description: 'Deep, mysterious, versatile' },
    { value: 'echo', label: 'Echo', description: 'Resonant, ceremonial quality' },
    { value: 'fable', label: 'Fable', description: 'Warm, storytelling tone' },
    { value: 'onyx', label: 'Onyx', description: 'Darker, more dramatic' },
    { value: 'nova', label: 'Nova', description: 'Bright, energetic' },
    { value: 'shimmer', label: 'Shimmer', description: 'Soft, ethereal' },
  ]

  const modelOptions = [
    { value: 'gpt-4o-mini-tts', label: 'GPT-4o Mini TTS', description: 'Fast, efficient' },
    { value: 'tts-1', label: 'TTS-1', description: 'Standard quality' },
    { value: 'tts-1-hd', label: 'TTS-1 HD', description: 'High definition' },
  ]

  const formatOptions = [
    { value: 'mp3', label: 'MP3', description: 'Compressed, widely supported' },
    { value: 'wav', label: 'WAV', description: 'Uncompressed, high quality' },
    { value: 'flac', label: 'FLAC', description: 'Lossless compression' },
  ]

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Voice Style
        </label>
        <div className="grid grid-cols-1 gap-2">
          {voiceOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 p-3 bg-libran-dark border border-libran-accent rounded-lg cursor-pointer hover:bg-libran-accent/20 transition-colors"
            >
              <input
                type="radio"
                name="voice"
                value={option.value}
                checked={voice === option.value}
                onChange={(e) => setVoice(e.target.value)}
                className="text-libran-gold focus:ring-libran-gold"
              />
              <div className="flex-1">
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-gray-400">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          TTS Model
        </label>
        <div className="grid grid-cols-1 gap-2">
          {modelOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 p-3 bg-libran-dark border border-libran-accent rounded-lg cursor-pointer hover:bg-libran-accent/20 transition-colors"
            >
              <input
                type="radio"
                name="model"
                value={option.value}
                checked={model === option.value}
                onChange={(e) => setModel(e.target.value)}
                className="text-libran-gold focus:ring-libran-gold"
              />
              <div className="flex-1">
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-gray-400">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Audio Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {formatOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-2 p-3 bg-libran-dark border border-libran-accent rounded-lg cursor-pointer hover:bg-libran-accent/20 transition-colors"
            >
              <input
                type="radio"
                name="format"
                value={option.value}
                checked={format === option.value}
                onChange={(e) => setFormat(e.target.value)}
                className="text-libran-gold focus:ring-libran-gold"
              />
              <div className="text-center flex-1">
                <div className="font-medium text-white text-sm">{option.label}</div>
                <div className="text-xs text-gray-400">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-libran-gold flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Advanced Settings</span>
        </h4>

        {/* Speed Control */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Speech Speed: {speed}x
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-libran-accent rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Slower (0.5x)</span>
            <span>Faster (1.5x)</span>
          </div>
        </div>

        {/* Pitch Control */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Voice Pitch: {pitch}x
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full h-2 bg-libran-accent rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Lower (0.5x)</span>
            <span>Higher (1.5x)</span>
          </div>
        </div>
      </div>

      {/* Librán Accent Preview */}
      <div className="bg-libran-dark border border-libran-accent rounded-lg p-4">
        <h4 className="text-sm font-semibold text-libran-gold mb-2 flex items-center space-x-2">
          <Mic className="w-4 h-4" />
          <span>Librán Accent Preview</span>
        </h4>
        <p className="text-xs text-gray-400 mb-2">
          Current settings will produce a voice with these characteristics:
        </p>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Tone: {voice === 'alloy' || voice === 'onyx' ? 'Deep and mysterious' : 'Varied based on voice'}</li>
          <li>• Speed: {speed < 0.8 ? 'Slow and deliberate' : speed < 1.2 ? 'Moderate pace' : 'Faster delivery'}</li>
          <li>• Pitch: {pitch < 0.8 ? 'Lower, more solemn' : pitch < 1.2 ? 'Natural range' : 'Higher, more energetic'}</li>
          <li>• Quality: {format === 'wav' ? 'High definition' : format === 'flac' ? 'Lossless' : 'Compressed'}</li>
        </ul>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            // Save settings to localStorage or context
            localStorage.setItem('voiceSettings', JSON.stringify({
              voice, model, format, speed, pitch
            }))
            alert('Settings saved!')
          }}
          className="btn-primary"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}









