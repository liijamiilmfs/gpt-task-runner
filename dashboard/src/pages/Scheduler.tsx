import React, { useState, useEffect } from 'react';
import { Plus, Clock, Play, Pause, Trash2, Edit } from 'lucide-react';

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  inputFile: string;
  outputFile?: string;
  isDryRun: boolean;
  isActive: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

const Scheduler: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    schedule: '0 0 * * *', // Daily at midnight
    inputFile: '',
    outputFile: '',
    isDryRun: false,
  });

  useEffect(() => {
    fetchScheduledTasks();
  }, []);

  const fetchScheduledTasks = async () => {
    try {
      const response = await fetch('/api/scheduled-tasks');
      const data = await response.json();
      setTasks(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch scheduled tasks:', error);
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/scheduled-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTask({
          name: '',
          schedule: '0 0 * * *',
          inputFile: '',
          outputFile: '',
          isDryRun: false,
        });
        fetchScheduledTasks();
      }
    } catch (error) {
      console.error('Failed to create scheduled task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (
      window.confirm('Are you sure you want to delete this scheduled task?')
    ) {
      try {
        const response = await fetch(`/api/scheduled-tasks/${taskId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchScheduledTasks();
        }
      } catch (error) {
        console.error('Failed to delete scheduled task:', error);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getScheduleDescription = (cronExpression: string) => {
    // Simple cron description - in a real app you'd use a library like cronstrue
    const parts = cronExpression.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      if (
        minute === '0' &&
        hour === '0' &&
        day === '*' &&
        month === '*' &&
        weekday === '*'
      ) {
        return 'Daily at midnight';
      }
      if (
        minute === '0' &&
        hour === '0' &&
        day === '1' &&
        month === '*' &&
        weekday === '*'
      ) {
        return 'Monthly on the 1st at midnight';
      }
    }
    return cronExpression;
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Scheduler</h1>
          <p className="mt-2 text-gray-600">
            Schedule automated task executions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Scheduled Task
        </button>
      </div>

      {/* Scheduled Tasks */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No scheduled tasks
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new scheduled task.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {task.name}
                      </h3>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {task.isDryRun && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Dry Run
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Schedule:</span>{' '}
                        {getScheduleDescription(task.schedule)}
                      </div>
                      <div>
                        <span className="font-medium">Input File:</span>{' '}
                        {task.inputFile}
                      </div>
                      <div>
                        <span className="font-medium">Last Run:</span>{' '}
                        {formatDate(task.lastRun)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create Scheduled Task
              </h3>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Task Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Daily content generation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cron Schedule
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.schedule}
                    onChange={(e) =>
                      setNewTask({ ...newTask, schedule: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0 0 * * * (daily at midnight)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: minute hour day month weekday
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Input File Path
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.inputFile}
                    onChange={(e) =>
                      setNewTask({ ...newTask, inputFile: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/path/to/input.csv"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Output File Path (optional)
                  </label>
                  <input
                    type="text"
                    value={newTask.outputFile}
                    onChange={(e) =>
                      setNewTask({ ...newTask, outputFile: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/path/to/output.csv"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDryRun"
                    checked={newTask.isDryRun}
                    onChange={(e) =>
                      setNewTask({ ...newTask, isDryRun: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isDryRun"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Dry run mode (no external API calls)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;
