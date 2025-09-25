'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash2, Play, Pause, Calendar } from 'lucide-react';

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  inputFile: string;
  outputFile?: string;
  isActive: boolean;
  isDryRun: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

const SchedulerPage: React.FC = () => {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchScheduledTasks();
  }, []);

  const fetchScheduledTasks = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/scheduled-tasks');
      // const data = await response.json();

      // Mock data for now
      const mockTasks: ScheduledTask[] = [
        {
          id: '1',
          name: 'Daily Report Generation',
          description: 'Generate daily task execution reports',
          schedule: '0 9 * * *', // Every day at 9 AM
          inputFile: 'daily-tasks.csv',
          outputFile: 'daily-report.jsonl',
          isActive: true,
          isDryRun: false,
          createdAt: '2024-01-15T10:00:00Z',
          lastRun: '2024-01-15T09:00:00Z',
          nextRun: '2024-01-16T09:00:00Z',
        },
        {
          id: '2',
          name: 'Weekly Cleanup',
          description: 'Clean up old task logs and temporary files',
          schedule: '0 2 * * 0', // Every Sunday at 2 AM
          inputFile: 'cleanup-tasks.jsonl',
          isActive: true,
          isDryRun: true,
          createdAt: '2024-01-10T10:00:00Z',
          lastRun: '2024-01-14T02:00:00Z',
          nextRun: '2024-01-21T02:00:00Z',
        },
        {
          id: '3',
          name: 'Monthly Analytics',
          description: 'Generate monthly analytics and insights',
          schedule: '0 0 1 * *', // First day of every month at midnight
          inputFile: 'monthly-tasks.csv',
          outputFile: 'monthly-analytics.jsonl',
          isActive: false,
          isDryRun: false,
          createdAt: '2024-01-01T10:00:00Z',
          lastRun: '2024-01-01T00:00:00Z',
          nextRun: '2024-02-01T00:00:00Z',
        },
      ];

      setScheduledTasks(mockTasks);
    } catch (error) {
      console.error('Failed to fetch scheduled tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSchedule = (schedule: string) => {
    // Simple cron format display - in a real app, you'd want a proper cron parser
    const parts = schedule.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day] = parts;
      return `${hour}:${minute.padStart(2, '0')} ${day === '*' ? 'every day' : `day ${day}`}`;
    }
    return schedule;
  };

  const getNextRunTime = (nextRun?: string) => {
    if (!nextRun) return 'Not scheduled';
    return new Date(nextRun).toLocaleString();
  };

  const getLastRunTime = (lastRun?: string) => {
    if (!lastRun) return 'Never';
    return new Date(lastRun).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
          <p className="text-gray-600">Manage scheduled task executions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Schedule Task</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Scheduled
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledTasks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledTasks.filter((t) => t.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Pause className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paused</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledTasks.filter((t) => !t.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Next Run</p>
              <p className="text-sm font-bold text-gray-900">
                {scheduledTasks.filter((t) => t.isActive && t.nextRun).length >
                0
                  ? 'Scheduled'
                  : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Tasks Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scheduled Tasks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Input: {task.inputFile}{' '}
                        {task.outputFile && `→ ${task.outputFile}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formatSchedule(task.schedule)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.isDryRun
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {task.isDryRun ? 'Dry Run' : 'Live'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getLastRunTime(task.lastRun)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getNextRunTime(task.nextRun)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-900">
                        <Pause className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
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

      {/* Create Scheduled Task Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Schedule New Task
              </h3>
              <p className="text-gray-600">
                Scheduled task creation form will be implemented here.
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerPage;
