'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Phrase, PhraseFilter, PhraseCategory, PhraseDifficulty } from '@/lib/types/phrase'

interface PhrasePickerProps {
  onPhraseSelect: (phrase: Phrase, variant: 'ancient' | 'modern') => void
  onLoadingChange: (loading: boolean) => void
}

export default function PhrasePicker({ onPhraseSelect, onLoadingChange }: PhrasePickerProps) {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [categories, setCategories] = useState<PhraseCategory[]>([])
  const [difficulties] = useState<PhraseDifficulty[]>(['beginner', 'intermediate', 'advanced'])
  const [filter, setFilter] = useState<PhraseFilter>({
    category: undefined,
    difficulty: undefined,
    search: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<'ancient' | 'modern'>('ancient')
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null)

  // Update selected phrase when variant changes
  useEffect(() => {
    if (selectedPhrase) {
      onPhraseSelect(selectedPhrase, selectedVariant)
    }
  }, [selectedVariant, selectedPhrase, onPhraseSelect])

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/phrases?action=categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Failed to load categories', error)
    }
  }, [])

  const loadPhrases = useCallback(async () => {
    setIsLoading(true)
    onLoadingChange(true)
    
    try {
      const params = new URLSearchParams({
        action: 'list',
        ...(filter.category && { category: filter.category }),
        ...(filter.difficulty && { difficulty: filter.difficulty }),
        ...(filter.search && { search: filter.search }),
        limit: '20'
      })

      const response = await fetch(`/api/phrases?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setPhrases(data.data)
      }
    } catch (error) {
      console.error('Failed to load phrases', error)
    } finally {
      setIsLoading(false)
      onLoadingChange(false)
    }
  }, [filter.category, filter.difficulty, filter.search, onLoadingChange])

  useEffect(() => {
    loadCategories()
    loadPhrases()
  }, [loadCategories, loadPhrases])

  const loadRandomPhrase = async () => {
    setIsLoading(true)
    onLoadingChange(true)
    
    try {
      const params = new URLSearchParams({
        action: 'random',
        ...(filter.category && { category: filter.category }),
        ...(filter.difficulty && { difficulty: filter.difficulty })
      })

      const response = await fetch(`/api/phrases?${params}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setSelectedPhrase(data.data)
        onPhraseSelect(data.data, selectedVariant)
      }
    } catch (error) {
      console.error('Failed to load random phrase', error)
    } finally {
      setIsLoading(false)
      onLoadingChange(false)
    }
  }

  const handleFilterChange = (key: keyof PhraseFilter, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }

  const handlePhraseClick = (phrase: Phrase) => {
    setSelectedPhrase(phrase)
    onPhraseSelect(phrase, selectedVariant)
  }

  const getPhraseText = (phrase: Phrase) => {
    return selectedVariant === 'ancient' ? phrase.ancient : phrase.modern
  }

  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      
      {/* Controls */}
      <div className="space-y-3">
        {/* Variant Selection */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Variant:</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedVariant('ancient')}
              className={`px-3 py-1 rounded text-sm ${
                selectedVariant === 'ancient'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Ancient
            </button>
            <button
              onClick={() => setSelectedVariant('modern')}
              className={`px-3 py-1 rounded text-sm ${
                selectedVariant === 'modern'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Modern
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={filter.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {formatCategoryName(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={filter.difficulty || ''}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">All Levels</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search phrases..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={loadPhrases}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Loading...' : 'Filter'}
          </button>
          <button
            onClick={loadRandomPhrase}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Loading...' : 'Random'}
          </button>
        </div>
      </div>

      {/* Selected Phrase Display */}
      {selectedPhrase && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-900">Selected Phrase</h3>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedPhrase.difficulty)}`}>
                {selectedPhrase.difficulty}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {formatCategoryName(selectedPhrase.category)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-700">
              <span className="font-medium">English:</span> {selectedPhrase.english}
            </div>
            <div className="text-blue-800 font-semibold text-lg">
              <span className="font-medium">{selectedVariant === 'ancient' ? 'Ancient' : 'Modern'}:</span> {getPhraseText(selectedPhrase)}
            </div>
            {selectedPhrase.context && (
              <div className="text-sm text-gray-600 italic">
                &ldquo;{selectedPhrase.context}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phrase List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {phrases.map((phrase) => (
          <div
            key={phrase.id}
            onClick={() => handlePhraseClick(phrase)}
            className={`p-2 border rounded-md cursor-pointer transition-colors text-sm ${
              selectedPhrase?.id === phrase.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {phrase.english}
                </div>
                <div className="text-base font-semibold text-blue-600 mt-1">
                  {getPhraseText(phrase)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {phrase.context}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(phrase.difficulty)}`}>
                  {phrase.difficulty}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {formatCategoryName(phrase.category)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {phrases.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          No phrases found. Try adjusting your filters.
        </div>
      )}
    </div>
  )
}
