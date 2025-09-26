'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Clock } from 'lucide-react';
import { ScheduledTask } from '@/types';
import { validateCronExpression } from '@/utils/schedule-validator';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<ScheduledTask, 'id' | 'createdAt'>) => Promise<void>;
  task?: ScheduledTask | null;
  title: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  title,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    schedule: '',
    inputFile: '',
    outputFile: '',
    isDryRun: false,
    isActive: true,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        schedule: task.schedule,
        inputFile: task.inputFile,
        outputFile: task.outputFile || '',
        isDryRun: task.isDryRun || false,
        isActive: task.isActive || true,
        description:
          ((task as unknown as Record<string, unknown>).description as string) || '',
      });
    } else {
      setFormData({
        name: '',
        schedule: '',
        inputFile: '',
        outputFile: '',
        isDryRun: false,
        isActive: true,
        description: '',
      });
    }
    setErrors({});
  }, [task, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required';
    }

    if (!formData.schedule.trim()) {
      newErrors.schedule = 'Schedule is required';
    } else {
      const cronValidation = validateCronExpression(formData.schedule);
      if (!cronValidation.isValid) {
        newErrors.schedule = cronValidation.error || 'Invalid cron expression';
      }
    }

    if (!formData.inputFile.trim()) {
      newErrors.inputFile = 'Input file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter task name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description"
              rows={2}
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule (Cron Expression) *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => handleChange('schedule', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.schedule ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0 9 * * *"
              />
            </div>
            {errors.schedule && (
              <p className="text-red-500 text-sm mt-1">{errors.schedule}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Format: minute hour day month weekday (e.g., 0 9 * * * for daily
              at 9 AM)
            </p>
          </div>

          {/* Input File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input File *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.inputFile}
                onChange={(e) => handleChange('inputFile', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.inputFile ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="path/to/input.csv"
              />
            </div>
            {errors.inputFile && (
              <p className="text-red-500 text-sm mt-1">{errors.inputFile}</p>
            )}
          </div>

          {/* Output File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Output File (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.outputFile}
                onChange={(e) => handleChange('outputFile', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="path/to/output.jsonl"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDryRun"
                checked={formData.isDryRun}
                onChange={(e) => handleChange('isDryRun', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDryRun" className="ml-2 text-sm text-gray-700">
                Dry Run (test mode)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (enabled)
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
