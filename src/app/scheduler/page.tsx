'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash2, Play, Pause, Calendar } from 'lucide-react';
import TaskForm from './components/TaskForm';

import { ScheduledTask as ScheduledTaskType } from '@/types';

interface ScheduledTask extends ScheduledTaskType {
  description?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const SchedulerPage: React.FC = () => {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchScheduledTasks();
  }, []);

  const addNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const fetchScheduledTasks = async () => {
    try {
      const response = await fetch('/api/scheduled-tasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setScheduledTasks(data);
    } catch (error) {
      console.error('Failed to fetch scheduled tasks:', error);
      // Fallback to empty array on error
      setScheduledTasks([]);
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

  const handleEnableTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/scheduled-tasks/${taskId}/enable`, {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchScheduledTasks(); // Refresh the list
        addNotification('success', 'Task enabled successfully');
      } else {
        const errorData = await response.json();
        addNotification('error', errorData.error || 'Failed to enable task');
      }
    } catch (error) {
      console.error('Error enabling task:', error);
      addNotification('error', 'Failed to enable task');
    }
  };

  const handleDisableTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/scheduled-tasks/${taskId}/disable`, {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchScheduledTasks(); // Refresh the list
        addNotification('success', 'Task disabled successfully');
      } else {
        const errorData = await response.json();
        addNotification('error', errorData.error || 'Failed to disable task');
      }
    } catch (error) {
      console.error('Error disabling task:', error);
      addNotification('error', 'Failed to disable task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduled-tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchScheduledTasks(); // Refresh the list
        addNotification('success', 'Task deleted successfully');
      } else {
        const errorData = await response.json();
        addNotification('error', errorData.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      addNotification('error', 'Failed to delete task');
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = scheduledTasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setShowEditModal(true);
    }
  };

  const handleCreateTask = async (
    taskData: Omit<ScheduledTask, 'id' | 'createdAt'>
  ) => {
    try {
      const response = await fetch('/api/scheduled-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        await fetchScheduledTasks(); // Refresh the list
        addNotification('success', 'Task created successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      addNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to create task'
      );
      throw error;
    }
  };

  const handleUpdateTask = async (
    taskData: Omit<ScheduledTask, 'id' | 'createdAt'>
  ) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`/api/scheduled-tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...taskData, id: editingTask.id }),
      });

      if (response.ok) {
        await fetchScheduledTasks(); // Refresh the list
        addNotification('success', 'Task updated successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      addNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to update task'
      );
      throw error;
    }
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
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-md shadow-lg max-w-sm ${
                notification.type === 'success'
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : notification.type === 'error'
                    ? 'bg-red-100 border border-red-400 text-red-700'
                    : 'bg-blue-100 border border-blue-400 text-blue-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">{notification.message}</p>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
                      <button
                        onClick={() => task.id && handleEditTask(task.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit task"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {task.isActive ? (
                        <button
                          onClick={() => task.id && handleDisableTask(task.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Disable task"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => task.id && handleEnableTask(task.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Enable task"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => task.id && handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete task"
                      >
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

      {/* Create Task Modal */}
      <TaskForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        title="Schedule New Task"
      />

      {/* Edit Task Modal */}
      <TaskForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleUpdateTask}
        task={editingTask}
        title="Edit Scheduled Task"
      />
    </div>
  );
};

export default SchedulerPage;
