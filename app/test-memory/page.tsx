'use client'

import { useState, useEffect } from 'react'
import { memoryLeakDetector } from '@/lib/memory-leak-detector'
import AudioPlayer from '../components/AudioPlayer'

export default function MemoryTestPage() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [testText, setTestText] = useState('Hello world')
  const [audioUrl, setAudioUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [testHistory, setTestHistory] = useState<any[]>([])

  // Update stats display
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        const currentStats = memoryLeakDetector.getCurrentStats()
        setStats(currentStats)
        if (currentStats) {
          setTestHistory(prev => [...prev.slice(-19), currentStats]) // Keep last 20 data points
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  const startMonitoring = () => {
    memoryLeakDetector.startMonitoring(2000) // Check every 2 seconds
    setIsMonitoring(true)
    setTestHistory([])
  }

  const stopMonitoring = () => {
    memoryLeakDetector.stopMonitoring()
    setIsMonitoring(false)
  }

  const clearStats = () => {
    memoryLeakDetector.clearStats()
    setStats(null)
    setTestHistory([])
  }

  const testAudioGeneration = () => {
    // Simulate rapid audio generation to test for leaks
    const texts = [
      'Hello world',
      'This is a test',
      'Memory leak detection',
      'Audio generation test',
      'Another test phrase'
    ]
    
    let index = 0
    const interval = setInterval(() => {
      if (index < texts.length) {
        setTestText(texts[index])
        index++
      } else {
        clearInterval(interval)
        setTestText('Test completed')
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Memory Leak Test Suite
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive testing tool for detecting memory leaks in the AudioPlayer component
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls & Stats */}
          <div className="space-y-6">
            {/* Test Controls */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-blue-600">Test Controls</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={startMonitoring}
                  disabled={isMonitoring}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    isMonitoring 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
                  }`}
                >
                  {isMonitoring ? 'Monitoring...' : 'Start Monitoring'}
                </button>
                
                <button 
                  onClick={stopMonitoring}
                  disabled={!isMonitoring}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    !isMonitoring 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                  }`}
                >
                  Stop Monitoring
                </button>
                
                <button 
                  onClick={clearStats}
                  className="px-4 py-3 rounded-lg font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                >
                  Clear Stats
                </button>
                
                <button 
                  onClick={testAudioGeneration}
                  className="px-4 py-3 rounded-lg font-medium transition-all bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                >
                  Auto Test
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Text:
                </label>
                <input 
                  type="text" 
                  value={testText} 
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter test text here..."
                />
              </div>
            </div>

            {/* Current Stats */}
            {stats && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Live Memory Stats</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-2xl font-bold text-amber-600">{stats.eventListeners}</div>
                    <div className="text-sm text-gray-600">Event Listeners</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{stats.objectUrls}</div>
                    <div className="text-sm text-gray-600">Object URLs</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{stats.domElements}</div>
                    <div className="text-sm text-gray-600">DOM Elements</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}

            {/* Memory Chart */}
            {testHistory.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-indigo-600">Memory Usage Over Time</h3>
                <div className="space-y-3">
                  {['eventListeners', 'objectUrls', 'domElements'].map((key, index) => {
                    const colors = ['text-amber-600', 'text-red-600', 'text-blue-600']
                    const bgColors = ['bg-amber-500', 'bg-red-500', 'bg-blue-500']
                    const labels = ['Event Listeners', 'Object URLs', 'DOM Elements']
                    const values = testHistory.map(h => h[key])
                    const max = Math.max(...values, 1)
                    
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={`font-medium ${colors[index]}`}>{labels[index]}</span>
                          <span className="text-gray-600 font-semibold">{values[values.length - 1] || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${bgColors[index]}`}
                            style={{ width: `${((values[values.length - 1] || 0) / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Audio Player & Instructions */}
          <div className="space-y-6">
            {/* Audio Player */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">Audio Player Test</h3>
              <AudioPlayer 
                text={testText}
                onAudioGenerated={setAudioUrl}
                onLoadingChange={setIsLoading}
              />
            </div>

            {/* Testing Instructions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-green-600">Testing Instructions</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Quick Start:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-600">
                    <li>Click &quot;Start Monitoring&quot; to begin tracking</li>
                    <li>Use &quot;Auto Test&quot; for rapid audio generation</li>
                    <li>Manually change text and generate audio</li>
                    <li>Watch the live stats and chart</li>
                    <li>Click &quot;Stop Monitoring&quot; for detailed report</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">What to Look For:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600">
                    <li><span className="font-medium text-amber-600">Event Listeners:</span> Should stay under 15</li>
                    <li><span className="font-medium text-red-600">Object URLs:</span> Should return to 0 after generation</li>
                    <li><span className="font-medium text-blue-600">DOM Elements:</span> Should remain stable</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Browser Console Instructions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-indigo-600">Advanced Testing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use the browser console for detailed testing and debugging:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono">
{`// Start monitoring
window.memoryLeakDetector.startMonitoring(1000)

// Check current stats
window.memoryLeakDetector.getCurrentStats()

// Stop and get report
window.memoryLeakDetector.stopMonitoring()

// Clear all stats
window.memoryLeakDetector.clearStats()`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Data Points: {testHistory.length} | 
              Last Update: {stats ? new Date(stats.timestamp).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
