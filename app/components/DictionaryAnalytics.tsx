'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  BookOpen,
  Languages,
  Activity,
  Star,
  Clock
} from 'lucide-react'

interface AnalyticsData {
  totalEntries: number
  totalTranslations: number
  uniqueUsers: number
  mostTranslatedWords: Array<{ word: string; count: number; trend: 'up' | 'down' | 'stable' }>
  categoryStats: Array<{ category: string; count: number; percentage: number }>
  dailyUsage: Array<{ date: string; translations: number; users: number }>
  trendingWords: Array<{ word: string; change: number; period: string }>
  userActivity: Array<{ hour: number; activity: number }>
  languageDistribution: Array<{ language: string; percentage: number }>
}

interface DictionaryAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y'
}

export default function DictionaryAnalytics({ timeRange = '30d' }: DictionaryAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      // Mock analytics data - in real implementation, this would come from an API
      const mockAnalytics: AnalyticsData = {
        totalEntries: 2109,
        totalTranslations: 15647,
        uniqueUsers: 234,
        mostTranslatedWords: [
          { word: 'hello', count: 1247, trend: 'up' },
          { word: 'world', count: 892, trend: 'stable' },
          { word: 'peace', count: 756, trend: 'up' },
          { word: 'love', count: 634, trend: 'down' },
          { word: 'wisdom', count: 523, trend: 'up' },
          { word: 'courage', count: 445, trend: 'stable' },
          { word: 'justice', count: 398, trend: 'up' },
          { word: 'freedom', count: 367, trend: 'down' },
          { word: 'honor', count: 334, trend: 'stable' },
          { word: 'truth', count: 298, trend: 'up' }
        ],
        categoryStats: [
          { category: 'Concepts', count: 456, percentage: 21.6 },
          { category: 'Core', count: 389, percentage: 18.4 },
          { category: 'Culture', count: 334, percentage: 15.8 },
          { category: 'Living', count: 298, percentage: 14.1 },
          { category: 'Society', count: 267, percentage: 12.7 },
          { category: 'Craft', count: 234, percentage: 11.1 },
          { category: 'Other', count: 131, percentage: 6.2 }
        ],
        dailyUsage: generateMockDailyUsage(),
        trendingWords: [
          { word: 'resilience', change: 45.2, period: '7d' },
          { word: 'harmony', change: 38.7, period: '7d' },
          { word: 'transcendence', change: 32.1, period: '7d' },
          { word: 'empathy', change: 28.9, period: '7d' },
          { word: 'serenity', change: 25.4, period: '7d' }
        ],
        userActivity: generateMockUserActivity(),
        languageDistribution: [
          { language: 'Ancient Librán', percentage: 45.2 },
          { language: 'Modern Librán', percentage: 54.8 }
        ]
      }

      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const generateMockDailyUsage = () => {
    const days = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        translations: Math.floor(Math.random() * 200) + 50,
        users: Math.floor(Math.random() * 50) + 10
      })
    }
    return days
  }

  const generateMockUserActivity = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      activity: Math.floor(Math.random() * 100)
    }))
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable':
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dictionary Analytics</h2>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalEntries)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Languages className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Translations</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalTranslations)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.uniqueUsers)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg. Daily Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(Math.round(analytics.dailyUsage.reduce((sum, day) => sum + day.translations, 0) / analytics.dailyUsage.length))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Translated Words */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Most Translated Words</h3>
          <div className="space-y-3">
            {analytics.mostTranslatedWords.slice(0, 8).map((word, index) => (
              <div key={word.word} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="font-medium text-gray-900">{word.word}</span>
                  {getTrendIcon(word.trend)}
                </div>
                <span className="text-sm font-medium text-gray-900">{formatNumber(word.count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Words */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Trending Words</h3>
          <div className="space-y-3">
            {analytics.trendingWords.map((word, index) => (
              <div key={word.word} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-gray-900">{word.word}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-green-600">+{formatPercentage(word.change)}</span>
                  <span className="text-xs text-gray-500 block">{word.period}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {analytics.categoryStats.map(category => (
              <div key={category.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  <span className="text-sm text-gray-500">{category.count} ({formatPercentage(category.percentage)})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Language Distribution</h3>
          <div className="space-y-3">
            {analytics.languageDistribution.map(language => (
              <div key={language.language}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{language.language}</span>
                  <span className="text-sm text-gray-500">{formatPercentage(language.percentage)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${language.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Usage Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Usage Trends</h3>
        <div className="h-64 flex items-end space-x-1">
          {analytics.dailyUsage.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-600 rounded-t"
                style={{ 
                  height: `${(day.translations / Math.max(...analytics.dailyUsage.map(d => d.translations))) * 200}px` 
                }}
                title={`${day.date}: ${day.translations} translations`}
              ></div>
              {index % 5 === 0 && (
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
