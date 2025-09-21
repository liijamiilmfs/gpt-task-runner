'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
          <Button onClick={fetchTokens} variant="outline">
            Refresh
          </Button>
          <Button onClick={clearTokens} variant="destructive">
            Clear All
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">Recent Tokens ({tokens.length})</TabsTrigger>
          <TabsTrigger value="frequency">Most Frequent (Top 50)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-4">
          {tokens.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No unknown tokens found. Great job! 🎉
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tokens.slice(0, 100).map((token, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-lg">{token.token}</span>
                        <Badge variant={token.variant === 'ancient' ? 'default' : 'secondary'}>
                          {token.variant}
                        </Badge>
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
                  </CardContent>
                </Card>
              ))}
              {tokens.length > 100 && (
                <div className="text-center text-gray-500">
                  Showing first 100 tokens of {tokens.length} total
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="frequency" className="space-y-4">
          {sortedFrequency.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No frequency data available
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedFrequency.map(([tokenVariant, count]) => {
                const [token, variant] = tokenVariant.split(':');
                return (
                  <Card key={tokenVariant}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-lg">{token}</span>
                          <Badge variant={variant === 'ancient' ? 'default' : 'secondary'}>
                            {variant}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-blue-600">{count}</span>
                          <span className="text-sm text-gray-500">occurrences</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
