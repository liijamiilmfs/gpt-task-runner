'use client';

import { useState, useEffect } from 'react';

interface TTSCacheStats {
  totalEntries: number;
  totalSize: number;
  totalAccesses: number;
  hitRate: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

interface TTSCacheEntry {
  hash: string;
  libranText: string;
  voice: string;
  format: string;
  model: string;
  createdAt: string;
  fileSize: number;
  audioDuration: number;
  accessCount: number;
  lastAccessed: string;
}

export default function TTSCachePage() {
  const [stats, setStats] = useState<TTSCacheStats | null>(null);
  const [entries, setEntries] = useState<TTSCacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'entries'>('stats');

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tts-cache?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch cache stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache stats');
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/tts-cache?action=entries');
      const result = await response.json();
      
      if (result.success) {
        setEntries(result.data);
      } else {
        setError(result.error || 'Failed to fetch cache entries');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache entries');
    }
  };

  const clearCache = async () => {
    if (!confirm('Are you sure you want to clear the entire TTS cache? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/tts-cache?action=clear', { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        setError(null);
        await Promise.all([fetchStats(), fetchEntries()]);
      } else {
        setError(result.error || 'Failed to clear cache');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    return `${Math.round(seconds * 10) / 10}s`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([fetchStats(), fetchEntries()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cache data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="text-lg">Loading TTS cache data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">TTS Cache Management</h1>
        <div className="space-x-2">
          <button 
            onClick={() => Promise.all([fetchStats(), fetchEntries()])}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Refresh
          </button>
          <button 
            onClick={clearCache}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="w-full">
        <div className="flex border-b mb-4">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 border-b-2 ${activeTab === 'stats' ? 'border-blue-500' : 'border-transparent'}`}
          >
            Cache Statistics
          </button>
          <button 
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 border-b-2 ${activeTab === 'entries' ? 'border-blue-500' : 'border-transparent'}`}
          >
            Cache Entries ({entries.length})
          </button>
        </div>
        
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Total Entries</h3>
                <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Total Size</h3>
                <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Hit Rate</h3>
                <div className="text-2xl font-bold text-purple-600">{Math.round(stats.hitRate * 10) / 10}%</div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Total Accesses</h3>
                <div className="text-2xl font-bold text-orange-600">{stats.totalAccesses}</div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Oldest Entry</h3>
                <div className="text-sm text-gray-600">
                  {stats.oldestEntry ? new Date(stats.oldestEntry).toLocaleString() : 'N/A'}
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Newest Entry</h3>
                <div className="text-sm text-gray-600">
                  {stats.newestEntry ? new Date(stats.newestEntry).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'entries' && (
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
                No cached entries found. Generate some TTS audio to see entries here!
              </div>
            ) : (
              <>
                {entries.slice(0, 50).map((entry, index) => (
                  <div key={entry.hash} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm text-gray-500">#{index + 1}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          entry.voice === 'alloy' ? 'bg-blue-100 text-blue-800' :
                          entry.voice === 'echo' ? 'bg-green-100 text-green-800' :
                          entry.voice === 'fable' ? 'bg-purple-100 text-purple-800' :
                          entry.voice === 'onyx' ? 'bg-gray-100 text-gray-800' :
                          entry.voice === 'nova' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {entry.voice}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                          {entry.format.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(entry.fileSize)}</span>
                        <span>{formatDuration(entry.audioDuration)}</span>
                        <span>{entry.accessCount} accesses</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Text:</strong> {entry.libranText.length > 100 ? 
                        `${entry.libranText.substring(0, 100)}...` : 
                        entry.libranText
                      }
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <strong>Created:</strong> {new Date(entry.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <strong>Last Accessed:</strong> {new Date(entry.lastAccessed).toLocaleString()}
                      </div>
                      <div className="font-mono text-xs">
                        {entry.hash.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
                {entries.length > 50 && (
                  <div className="text-center text-gray-500">
                    Showing first 50 entries of {entries.length} total
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
