import React, { useState, useEffect } from 'react';
import { Play, Download, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TaskExecution {
  id: string;
  request: string;
  response?: string;
  dryRunResult?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'dry-run';
  createdAt: string;
  completedAt?: string;
  error?: string;
  isDryRun: boolean;
}

const Tasks: React.FC = () => {
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<TaskExecution | null>(null);

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/executions?limit=50');
      const data = await response.json();
      setExecutions(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'dry-run':
        return <Eye className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'dry-run':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Task Executions</h1>
        <p className="mt-2 text-gray-600">View and manage your task execution history</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={fetchExecutions}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Play className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {executions.length} executions
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {executions.map((execution) => {
            const request = JSON.parse(execution.request);
            return (
              <li key={execution.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    {getStatusIcon(execution.status)}
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {execution.id}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                          {execution.status}
                        </span>
                        {execution.isDryRun && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Dry Run
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {request.tasks?.length || 1} task(s) • {formatDate(execution.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedExecution(execution)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Details Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Execution Details</h3>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center">
                    {getStatusIcon(selectedExecution.status)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedExecution.status)}`}>
                      {selectedExecution.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedExecution.createdAt)}</p>
                </div>
                
                {selectedExecution.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedExecution.completedAt)}</p>
                  </div>
                )}
                
                {selectedExecution.error && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Error</label>
                    <p className="mt-1 text-sm text-red-600">{selectedExecution.error}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request</label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(JSON.parse(selectedExecution.request), null, 2)}
                  </pre>
                </div>
                
                {selectedExecution.response && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Response</label>
                    <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(JSON.parse(selectedExecution.response), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
