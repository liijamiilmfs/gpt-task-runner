'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Download, Upload, Edit3, Trash2, Plus, BarChart3, BookOpen, Languages, TrendingUp, X } from 'lucide-react'
import DictionaryAnalytics from '@/app/components/DictionaryAnalytics'
import BulkEditModal from '@/app/components/BulkEditModal'
import EtymologyTree from '@/app/components/EtymologyTree'

interface DictionaryEntry {
  english: string
  ancient: string
  modern: string
  notes?: string
  section?: string
  category?: string
  usage_count?: number
  last_used?: string
  etymology?: string[]
  tags?: string[]
}

interface DictionaryMetadata {
  version: string
  total_entries: number
  last_updated: string
  sections: Record<string, number>
}

export default function DictionaryDashboard() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([])
  const [metadata, setMetadata] = useState<DictionaryMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'english' | 'ancient' | 'modern' | 'usage'>('english')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null)
  const [showEtymology, setShowEtymology] = useState(false)

  // Load dictionary data
  useEffect(() => {
    loadDictionaryData()
  }, [])

  const loadDictionaryData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dictionary')
      const data = await response.json()
      
      if (data.success) {
        setEntries(data.entries)
        setMetadata(data.metadata)
      }
    } catch (error) {
      console.error('Failed to load dictionary data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = entries

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.english.toLowerCase().includes(term) ||
        entry.ancient.toLowerCase().includes(term) ||
        entry.modern.toLowerCase().includes(term) ||
        entry.notes?.toLowerCase().includes(term)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.section === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'english':
          aValue = a.english
          bValue = b.english
          break
        case 'ancient':
          aValue = a.ancient
          bValue = b.ancient
          break
        case 'modern':
          aValue = a.modern
          bValue = b.modern
          break
        case 'usage':
          aValue = a.usage_count || 0
          bValue = b.usage_count || 0
          break
        default:
          aValue = a.english
          bValue = b.english
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [entries, searchTerm, selectedCategory, sortBy, sortOrder])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    entries.forEach(entry => {
      if (entry.section) cats.add(entry.section)
    })
    return Array.from(cats).sort()
  }, [entries])

  // Analytics data
  const analytics = useMemo(() => {
    const totalEntries = entries.length
    const withNotes = entries.filter(e => e.notes).length
    const withEtymology = entries.filter(e => e.etymology?.length).length
    const mostUsed = entries
      .filter(e => e.usage_count)
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 10)

    const categoryStats = categories.map(cat => ({
      category: cat,
      count: entries.filter(e => e.section === cat).length
    }))

    return {
      totalEntries,
      withNotes,
      withEtymology,
      mostUsed,
      categoryStats
    }
  }, [entries, categories])

  const handleSelectEntry = (english: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(english)) {
      newSelected.delete(english)
    } else {
      newSelected.add(english)
    }
    setSelectedEntries(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(filteredEntries.map(e => e.english)))
    }
  }

  const handleBulkEdit = async (operation: string, data: any) => {
    if (selectedEntries.size === 0) return

    try {
      const response = await fetch('/api/admin/dictionary/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          entries: Array.from(selectedEntries),
          data
        })
      })

      if (response.ok) {
        await loadDictionaryData()
        setSelectedEntries(new Set())
        setShowBulkEdit(false)
      }
    } catch (error) {
      console.error('Bulk operation failed:', error)
    }
  }

  const handleViewEtymology = (entry: DictionaryEntry) => {
    setSelectedEntry(entry)
    setShowEtymology(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dictionary data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dictionary Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage {metadata?.total_entries || 0} dictionary entries across {categories.length} categories
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Panel */}
        {showAnalytics && <DictionaryAnalytics />}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="english">English</option>
                  <option value="ancient">Ancient</option>
                  <option value="modern">Modern</option>
                  <option value="usage">Usage</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {filteredEntries.length} of {entries.length} entries
              </span>
              {selectedEntries.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {selectedEntries.size} selected
                  </span>
                  <button
                    onClick={() => setShowBulkEdit(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Bulk Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={showBulkEdit}
          onClose={() => setShowBulkEdit(false)}
          selectedCount={selectedEntries.size}
          onSave={handleBulkEdit}
        />

        {/* Entries Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      English
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ancient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modern
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.english} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.english)}
                          onChange={() => handleSelectEntry(entry.english)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.english}</div>
                        {entry.notes && (
                          <div className="text-sm text-gray-500">{entry.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.ancient}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.modern}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.section && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {entry.section}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.usage_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewEtymology(entry)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Etymology"
                          >
                            <Languages className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900" title="Edit Entry">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900" title="Delete Entry">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Etymology Modal */}
        {showEtymology && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Etymology for &quot;{selectedEntry.english}&quot;
                </h2>
                <button
                  onClick={() => setShowEtymology(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <EtymologyTree entry={selectedEntry} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
