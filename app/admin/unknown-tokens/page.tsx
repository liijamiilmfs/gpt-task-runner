'use client';

import { useState, useEffect } from 'react';

interface UnknownTokenEntry {
  timestamp: string;
  token: string;
  variant: 'ancient' | 'modern';
  context?: string;
  userAgent?: string;
  sessionId?: string;
}

interface TokenFrequency {
  [key: string]: number;
}

export default function UnknownTokensPage() {
  const [tokens, setTokens] = useState<UnknownTokenEntry[]>([]);
  const [frequency, setFrequency] = useState<TokenFrequency>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'frequency'>('recent');

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unknown-tokens?action=list');
      const data = await response.json();
      
      if (data.success) {
        setTokens(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const fetchFrequency = async () => {
    try {
      const response = await fetch('/api/unknown-tokens?action=frequency');
      const data = await response.json();
      
      if (data.success) {
        setFrequency(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch frequency data');
    }
  };

  const clearTokens = async () => {
    try {
      const response = await fetch('/api/unknown-tokens?action=clear', {
        method: 'GET'
      });
      const data = await response.json();
      
      if (data.success) {
        setTokens([]);
        setFrequency({});
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to clear tokens');
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchFrequency();
  }, []);

  const sortedFrequency = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading unknown tokens...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Unknown Tokens</h1>
        <div className="space-x-2">
          <button 
            onClick={fetchTokens} 
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Refresh
          </button>
          <button 
            onClick={clearTokens} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All
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
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 border-b-2 ${activeTab === 'recent' ? 'border-blue-500' : 'border-transparent'}`}
          >
            Recent Tokens ({tokens.length})
          </button>
          <button 
            onClick={() => setActiveTab('frequency')}
            className={`px-4 py-2 border-b-2 ${activeTab === 'frequency' ? 'border-blue-500' : 'border-transparent'}`}
          >
            Most Frequent (Top 50)
          </button>
        </div>
        
        {activeTab === 'recent' && (
          <div className="space-y-4">
            {tokens.length === 0 ? (
              <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
                No unknown tokens found. Great job! 🎉
              </div>
            ) : (
              <>
                {tokens.slice(0, 100).map((token, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-lg">{token.token}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          token.variant === 'ancient' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {token.variant}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(token.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {token.context && (
                      <div className="text-sm text-gray-600 mt-2">
                        <strong>Context:</strong> {token.context}
                      </div>
                    )}
                  </div>
                ))}
                {tokens.length > 100 && (
                  <div className="text-center text-gray-500">
                    Showing first 100 tokens of {tokens.length} total
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'frequency' && (
          <div className="space-y-4">
            {sortedFrequency.length === 0 ? (
              <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
                No frequency data available
              </div>
            ) : (
              <div className="space-y-2">
                {sortedFrequency.map(([tokenVariant, count]) => {
                  const [token, variant] = tokenVariant.split(':');
                  return (
                    <div key={tokenVariant} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-lg">{token}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            variant === 'ancient' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {variant}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-blue-600">{count}</span>
                          <span className="text-sm text-gray-500">occurrences</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
