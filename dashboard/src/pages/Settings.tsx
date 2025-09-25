import React, { useState, useEffect } from 'react';
import { Save, Key, Database, Bell, Shield } from 'lucide-react';

interface Settings {
  openaiApiKey: string;
  openaiBaseUrl: string;
  logLevel: string;
  maxConcurrentTasks: number;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  enableNotifications: boolean;
  dataRetentionDays: number;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    openaiApiKey: '',
    openaiBaseUrl: '',
    logLevel: 'info',
    maxConcurrentTasks: 5,
    defaultModel: 'gpt-3.5-turbo',
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
    enableNotifications: true,
    dataRetentionDays: 30,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('gpt-task-runner-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in a real app, this would be saved to the backend)
      localStorage.setItem(
        'gpt-task-runner-settings',
        JSON.stringify(settings)
      );

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof Settings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your GPT Task Runner service
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* API Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Key className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              API Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) =>
                  handleInputChange('openaiApiKey', e.target.value)
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base URL (optional)
              </label>
              <input
                type="url"
                value={settings.openaiBaseUrl}
                onChange={(e) =>
                  handleInputChange('openaiBaseUrl', e.target.value)
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://api.openai.com/v1"
              />
            </div>
          </div>
        </div>

        {/* Task Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              Task Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Model
              </label>
              <select
                value={settings.defaultModel}
                onChange={(e) =>
                  handleInputChange('defaultModel', e.target.value)
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Concurrent Tasks
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxConcurrentTasks}
                onChange={(e) =>
                  handleInputChange(
                    'maxConcurrentTasks',
                    parseInt(e.target.value)
                  )
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Temperature
              </label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.defaultTemperature}
                onChange={(e) =>
                  handleInputChange(
                    'defaultTemperature',
                    parseFloat(e.target.value)
                  )
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="4000"
                value={settings.defaultMaxTokens}
                onChange={(e) =>
                  handleInputChange(
                    'defaultMaxTokens',
                    parseInt(e.target.value)
                  )
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* System Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              System Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Log Level
              </label>
              <select
                value={settings.logLevel}
                onChange={(e) => handleInputChange('logLevel', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.dataRetentionDays}
                onChange={(e) =>
                  handleInputChange(
                    'dataRetentionDays',
                    parseInt(e.target.value)
                  )
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableNotifications"
                checked={settings.enableNotifications}
                onChange={(e) =>
                  handleInputChange('enableNotifications', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="enableNotifications"
                className="ml-2 block text-sm text-gray-900"
              >
                Enable desktop notifications
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Configure how you want to be notified about task executions and
              service events.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyOnSuccess"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="notifyOnSuccess"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Notify on successful task completion
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyOnFailure"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="notifyOnFailure"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Notify on task failure
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyOnServiceStart"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="notifyOnServiceStart"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Notify on service start/stop
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyOnSchedule"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="notifyOnSchedule"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Notify on scheduled task execution
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
