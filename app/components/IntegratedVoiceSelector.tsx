'use client'

import { useState, useEffect, useMemo } from 'react'
import { Play, Save, Trash2, Volume2, Star, Plus, Settings, Wand2 } from 'lucide-react'
import { VoiceProfile, VOICE_PROFILES, VoiceAccent } from '@/lib/voices'
import { 
  VoiceFilter, 
  createVoiceFilter, 
  saveVoiceFilter, 
  getSavedVoiceFilters, 
  deleteVoiceFilter, 
  updateFilterUsage,
  describeVoiceCharacteristics,
  characteristicsToTTSParams
} from '@/lib/dynamic-voice-filter'
import AccentSelector from './AccentSelector'

interface IntegratedVoiceSelectorProps {
  onVoiceSelect: (voice: VoiceProfile | null) => void
  onVoiceFilterSelect: (filter: VoiceFilter | null) => void
  onAccentChange: (accent: VoiceAccent | null) => void
  selectedVoice?: VoiceProfile | null
  selectedVoiceFilter?: VoiceFilter | null
  selectedAccent?: VoiceAccent | null
  className?: string
}

export default function IntegratedVoiceSelector({ 
  onVoiceSelect, 
  onVoiceFilterSelect,
  onAccentChange,
  selectedVoice,
  selectedVoiceFilter,
  selectedAccent,
  className = ''
}: IntegratedVoiceSelectorProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset')
  const [prompt, setPrompt] = useState('')
  const [filterName, setFilterName] = useState('')
  const [savedFilters, setSavedFilters] = useState<VoiceFilter[]>([])
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  // Load saved filters on mount
  useEffect(() => {
    setSavedFilters(getSavedVoiceFilters())
  }, [])

  // Generate characteristics from current prompt
  const currentCharacteristics = useMemo(() => {
    if (!prompt.trim()) return null
    return createVoiceFilter(prompt).characteristics
  }, [prompt])

  const handlePresetVoiceSelect = (voice: VoiceProfile) => {
    onVoiceSelect(voice)
    onVoiceFilterSelect(null) // Clear any selected filter
  }

  const handleCreateFilter = () => {
    if (!prompt.trim()) return

    console.log('=== CREATING VOICE FILTER ===');
    console.log('Prompt:', prompt);
    console.log('Filter name:', filterName);
    
    const filter = createVoiceFilter(prompt, filterName || undefined)
    console.log('Created voice filter:', filter)
    console.log('Characteristics:', filter.characteristics)
    console.log('TTS Params:', characteristicsToTTSParams(filter.characteristics))
    
    saveVoiceFilter(filter)
    setSavedFilters(getSavedVoiceFilters())
    onVoiceFilterSelect(filter)
    onVoiceSelect(null) // Clear any selected preset voice
    setPrompt('')
    setFilterName('')
  }

  const handleSelectFilter = (filter: VoiceFilter) => {
    updateFilterUsage(filter.id)
    onVoiceFilterSelect(filter)
    onVoiceSelect(null) // Clear any selected preset voice
    setSavedFilters(getSavedVoiceFilters())
  }

  const handleDeleteFilter = (filterId: string) => {
    deleteVoiceFilter(filterId)
    setSavedFilters(getSavedVoiceFilters())
    if (selectedVoiceFilter?.id === filterId) {
      onVoiceFilterSelect(null)
    }
  }

  const handlePreview = async () => {
    if (!currentCharacteristics) return

    setIsGeneratingPreview(true)
    try {
      const sampleText = "Salaam dunya, kama ana huna al-yaum"
      const voiceFilterData = createVoiceFilter(prompt, 'Preview Filter')
      
      console.log('Sending voice filter for preview:', voiceFilterData)
      
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libranText: sampleText,
          voice: 'alloy',
          format: 'mp3',
          voiceFilter: {
            characteristics: voiceFilterData.characteristics,
            prompt: voiceFilterData.prompt
          }
        })
      })

      if (!response.ok) throw new Error('Preview failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      audio.onended = () => {
        URL.revokeObjectURL(url)
      }
      
      audio.play()
    } catch (error) {
      console.error('Preview error:', error)
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-libran-dark/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'preset'
              ? 'bg-libran-gold text-libran-dark'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Preset Voices
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'bg-libran-gold text-libran-dark'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Custom Voice
        </button>
      </div>

      {/* Preset Voices Tab */}
      {activeTab === 'preset' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {Object.values(VOICE_PROFILES).map(voice => (
              <button
                key={voice.id}
                onClick={() => handlePresetVoiceSelect(voice)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedVoice?.id === voice.id
                    ? 'border-libran-gold bg-libran-gold/10'
                    : 'border-libran-accent hover:bg-libran-accent/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Volume2 className="w-4 h-4 text-libran-gold" />
                      <span className="font-medium text-white">{voice.name}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-libran-gold fill-current" />
                        <span className="text-xs text-gray-400">{voice.libránSuitability}/10</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{voice.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {voice.characteristics.slice(0, 3).map(char => (
                        <span
                          key={char}
                          className="px-2 py-1 bg-libran-accent/20 text-gray-300 text-xs rounded"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Voice Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          {/* Create New Filter */}
          <div className="bg-libran-dark/50 border border-libran-accent/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-libran-gold mb-3 flex items-center space-x-2">
              <Wand2 className="w-4 h-4" />
              <span>Create Custom Voice</span>
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Describe your voice:
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'deep, mysterious, ancient voice with ceremonial authority'"
                  className="w-full px-3 py-2 bg-libran-dark border border-libran-accent rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-libran-gold focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Name (optional):
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., 'Mystical Ancient Voice'"
                  className="w-full px-3 py-2 bg-libran-dark border border-libran-accent rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-libran-gold focus:border-transparent text-sm"
                />
              </div>

              {/* Generated Characteristics Preview */}
              {currentCharacteristics && (
                <div className="bg-libran-accent/10 border border-libran-accent/30 rounded p-2">
                  <p className="text-xs text-gray-300 mb-2">
                    {describeVoiceCharacteristics(currentCharacteristics)}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                    <div>Pitch: {currentCharacteristics.pitch.toFixed(1)}</div>
                    <div>Speed: {currentCharacteristics.speed.toFixed(1)}</div>
                    <div>Volume: {currentCharacteristics.volume.toFixed(1)}</div>
                    <div>Warmth: {currentCharacteristics.warmth.toFixed(1)}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateFilter}
                  disabled={!prompt.trim()}
                  className="flex items-center space-x-1 px-3 py-2 bg-libran-gold text-libran-dark rounded text-sm hover:bg-libran-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-3 h-3" />
                  <span>Create</span>
                </button>

                {currentCharacteristics && (
                  <button
                    onClick={handlePreview}
                    disabled={isGeneratingPreview}
                    className="flex items-center space-x-1 px-3 py-2 bg-libran-accent/20 border border-libran-accent rounded text-sm text-white hover:bg-libran-accent/40 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPreview ? (
                      <div className="w-3 h-3 border border-libran-gold border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    <span>Preview</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Accent Selector */}
          <div className="bg-libran-dark/50 border border-libran-gold/30 rounded-lg p-4">
            <AccentSelector
              selectedAccent={selectedAccent || null}
              onAccentChange={onAccentChange}
            />
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Saved Voice Filters</h4>
              <div className="space-y-2">
                {savedFilters.map(filter => (
                  <div
                    key={filter.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedVoiceFilter?.id === filter.id
                        ? 'border-libran-gold bg-libran-gold/10'
                        : 'border-libran-accent hover:bg-libran-accent/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white text-sm">{filter.name}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-libran-gold fill-current" />
                            <span className="text-xs text-gray-400">{filter.useCount}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{filter.prompt}</p>
                        <p className="text-xs text-gray-500">
                          {describeVoiceCharacteristics(filter.characteristics)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-3">
                        <button
                          onClick={() => handleSelectFilter(filter)}
                          className="px-2 py-1 bg-libran-gold text-libran-dark rounded text-xs hover:bg-libran-gold/80 transition-colors"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Selection Display */}
      {(selectedVoice || selectedVoiceFilter) && (
        <div className="bg-libran-gold/10 border border-libran-gold/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">
                {selectedVoice ? selectedVoice.name : selectedVoiceFilter?.name}
              </div>
              <div className="text-xs text-gray-300">
                {selectedVoice ? selectedVoice.description : selectedVoiceFilter?.prompt}
              </div>
            </div>
            <button
              onClick={() => {
                onVoiceSelect(null)
                onVoiceFilterSelect(null)
              }}
              className="text-gray-400 hover:text-white text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
