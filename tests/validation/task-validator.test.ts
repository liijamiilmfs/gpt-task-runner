import { describe, it, expect } from 'vitest';
import { TaskValidator } from '../../src/validation/task-validator';
import { TaskRequest } from '../../src/types';

describe('TaskValidator', () => {
  describe('validateTask', () => {
    it('should validate a valid task with prompt', () => {
      const task: TaskRequest = {
        id: 'task-1',
        prompt: 'Write a haiku',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
        batch_id: 'batch-001',
        idempotency_key: 'key-123',
        metadata: { category: 'creative' },
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid task with messages', () => {
      const task: TaskRequest = {
        id: 'task-2',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Write a poem' },
        ],
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 200,
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject task without id', () => {
      const task = {
        prompt: 'Write a haiku',
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].message).toContain('Required field');
    });

    it('should reject task without content', () => {
      const task: TaskRequest = {
        id: 'task-1',
        model: 'gpt-3.5-turbo',
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('content');
      expect(result.errors[0].message).toContain('Either "prompt" or "messages"');
    });

    it('should reject invalid temperature', () => {
      const task: TaskRequest = {
        id: 'task-1',
        prompt: 'Write a haiku',
        temperature: 3.0,
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('temperature');
      expect(result.errors[0].message).toContain('between 0 and 2');
    });

    it('should reject invalid maxTokens', () => {
      const task: TaskRequest = {
        id: 'task-1',
        prompt: 'Write a haiku',
        maxTokens: 5000,
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('maxTokens');
      expect(result.errors[0].message).toContain('between 1 and 4096');
    });

    it('should reject invalid messages format', () => {
      const task = {
        id: 'task-1',
        messages: [
          { role: 'invalid', content: 'Hello' },
        ],
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('messages[0].role');
      expect(result.errors[0].message).toContain('"system", "user", or "assistant"');
    });

    it('should warn about unknown model', () => {
      const task: TaskRequest = {
        id: 'task-1',
        prompt: 'Write a haiku',
        model: 'unknown-model',
      };

      const result = TaskValidator.validateTask(task);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('model');
      expect(result.warnings[0].message).toContain('Unknown model');
    });

    it('should include row number in error messages', () => {
      const task = {
        prompt: 'Write a haiku',
      };

      const result = TaskValidator.validateTask(task, 5);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Row 5:');
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple tasks', () => {
      const tasks = [
        { id: 'task-1', prompt: 'Write a haiku' },
        { id: 'task-2', prompt: 'Write a poem' },
      ];

      const result = TaskValidator.validateBatch(tasks);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors from multiple tasks', () => {
      const tasks = [
        { prompt: 'Write a haiku' }, // Missing id
        { id: 'task-2' }, // Missing content
      ];

      const result = TaskValidator.validateBatch(tasks);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toContain('Row 1:');
      expect(result.errors[1].message).toContain('Row 2:');
    });
  });

  describe('getRequiredCsvHeaders', () => {
    it('should return required headers', () => {
      const headers = TaskValidator.getRequiredCsvHeaders();

      expect(headers).toEqual(['id', 'prompt']);
    });
  });

  describe('getOptionalCsvHeaders', () => {
    it('should return optional headers', () => {
      const headers = TaskValidator.getOptionalCsvHeaders();

      expect(headers).toContain('messages');
      expect(headers).toContain('model');
      expect(headers).toContain('temperature');
      expect(headers).toContain('maxTokens');
      expect(headers).toContain('metadata');
      expect(headers).toContain('batch_id');
      expect(headers).toContain('corr_id');
      expect(headers).toContain('idempotency_key');
    });
  });
});
