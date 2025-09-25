import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, Download } from 'lucide-react';

interface LogEntry {
  id: number;
  level: string;
  message: string;
  metadata?: string;
  timestamp: string;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs?limit=100');
      const data = await response.json();
      setLogs(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'debug':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter(
    (log) =>
      filter === 'all' || log.level.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service Logs</h1>
        <p className="mt-2 text-gray-600">
          Monitor service activity and debug issues
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      {/* Logs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                    {log.metadata && (
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
