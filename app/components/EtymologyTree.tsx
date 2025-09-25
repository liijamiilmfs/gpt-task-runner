'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, Link, BookOpen, Globe } from 'lucide-react'

interface EtymologyNode {
  id: string
  word: string
  language: string
  meaning: string
  period?: string
  children?: EtymologyNode[]
  connections?: string[]
}

interface EtymologyTreeProps {
  entry: {
    english: string
    ancient: string
    modern: string
    etymology?: string[]
  }
}

export default function EtymologyTree({ entry }: EtymologyTreeProps) {
  const [etymology, setEtymology] = useState<EtymologyNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const generateMockEtymology = useCallback(() => {
    // Mock etymology tree for demonstration
    const mockEtymology: EtymologyNode = {
      id: 'root',
      word: entry.english,
      language: 'English',
      meaning: `Modern English word "${entry.english}"`,
      period: 'Present',
      children: [
        {
          id: 'middle-english',
          word: entry.english.toLowerCase(),
          language: 'Middle English',
          meaning: `Middle English form`,
          period: '1100-1500 CE',
          children: [
            {
              id: 'old-english',
              word: entry.english.toLowerCase().replace(/[aeiou]/g, ''),
              language: 'Old English',
              meaning: `Old English root`,
              period: '450-1100 CE',
              children: [
                {
                  id: 'proto-germanic',
                  word: entry.english.toLowerCase().replace(/[aeiou]/g, ''),
                  language: 'Proto-Germanic',
                  meaning: `Proto-Germanic root`,
                  period: '500 BCE - 500 CE',
                  children: [
                    {
                      id: 'proto-indo-european',
                      word: entry.english.toLowerCase().replace(/[aeiou]/g, ''),
                      language: 'Proto-Indo-European',
                      meaning: `PIE root *${entry.english.toLowerCase().replace(/[aeiou]/g, '')}`,
                      period: '4500-2500 BCE'
                    }
                  ]
                }
              ]
            },
            {
              id: 'latin-influence',
              word: entry.ancient,
              language: 'Latin',
              meaning: `Latin influence: ${entry.ancient}`,
              period: 'Classical Latin',
              connections: ['old-english']
            }
          ]
        },
        {
          id: 'librán-ancient',
          word: entry.ancient,
          language: 'Ancient Librán',
          meaning: `Ancient Librán: ${entry.ancient}`,
          period: 'Ancient Period',
          children: [
            {
              id: 'librán-proto',
              word: entry.ancient.toLowerCase(),
              language: 'Proto-Librán',
              meaning: `Proto-Librán form`,
              period: 'Pre-Ancient'
            }
          ]
        },
        {
          id: 'librán-modern',
          word: entry.modern,
          language: 'Modern Librán',
          meaning: `Modern Librán: ${entry.modern}`,
          period: 'Modern Period',
          connections: ['librán-ancient']
        }
      ]
    }

    setEtymology(mockEtymology)
  }, [entry.english, entry.ancient, entry.modern])

  const loadEtymology = useCallback(async (etymologyData: string[]) => {
    setLoading(true)
    try {
      // TODO: Implement actual etymology loading from database or API
      // For now, use mock data
      generateMockEtymology()
    } catch (error) {
      console.error('Failed to load etymology:', error)
    } finally {
      setLoading(false)
    }
  }, [generateMockEtymology])

  useEffect(() => {
    if (entry.etymology && entry.etymology.length > 0) {
      loadEtymology(entry.etymology)
    } else {
      // Generate mock etymology for demonstration
      generateMockEtymology()
    }
  }, [entry, loadEtymology, generateMockEtymology])

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: EtymologyNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id} className="etymology-node">
        <div
          className="flex items-center py-2 hover:bg-gray-50 cursor-pointer"
          style={{ paddingLeft: `${depth * 20}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            <div className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
          ) : (
            <div className="mr-2 w-4" />
          )}

          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900">{node.word}</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {node.language}
              </span>
              {node.period && (
                <span className="text-xs text-gray-500">{node.period}</span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">{node.meaning}</div>
            
            {node.connections && node.connections.length > 0 && (
              <div className="flex items-center mt-1 space-x-2">
                <Link className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Connected to: {node.connections.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="etymology-children">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'english':
      case 'middle english':
      case 'old english':
        return <Globe className="h-4 w-4 text-blue-600" />
      case 'latin':
        return <BookOpen className="h-4 w-4 text-red-600" />
      case 'ancient librán':
      case 'modern librán':
      case 'proto-librán':
        return <BookOpen className="h-4 w-4 text-purple-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!etymology) {
    return (
      <div className="p-4 text-center text-gray-500">
        <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No etymology data available for this entry.</p>
      </div>
    )
  }

  return (
    <div className="etymology-tree">
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Etymology Tree</h3>
          <p className="text-sm text-gray-500">
            Word origin and historical development for &quot;{entry.english}&quot;
          </p>
        </div>
        
        <div className="p-4">
          <div className="etymology-container">
            {renderNode(etymology)}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Globe className="h-3 w-3" />
                <span>Germanic</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>Latin</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>Librán</span>
              </div>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700">
              Edit Etymology
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
