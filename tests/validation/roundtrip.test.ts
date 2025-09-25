import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BatchLoader } from '../../src/io/batch-loader';
import { BatchWriter } from '../../src/io/batch-writer';
import { TaskRequest, TaskResponse } from '../../src/types';

describe('Round-trip Tests', () => {
  let tempDir: string;
  let batchLoader: BatchLoader;
  let batchWriter: BatchWriter;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-task-runner-test-'));
    batchLoader = new BatchLoader();
    batchWriter = new BatchWriter();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('JSONL Round-trip', () => {
    it('should preserve all fields in JSONL round-trip', async () => {
      const originalTasks: TaskRequest[] = [
        {
          id: 'task-1',
          prompt: 'Write a haiku',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 100,
          batch_id: 'batch-001',
          idempotency_key: 'key-123',
          metadata: { category: 'creative', difficulty: 'easy' },
        },
        {
          id: 'task-2',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Write a poem' },
          ],
          model: 'gpt-4',
          temperature: 0.5,
          maxTokens: 200,
          batch_id: 'batch-001',
          idempotency_key: 'key-456',
          metadata: { category: 'educational', difficulty: 'medium' },
        },
      ];

      // Write original tasks to JSONL
      const inputPath = path.join(tempDir, 'input.jsonl');
      const lines = originalTasks.map((task) => JSON.stringify(task));
      fs.writeFileSync(inputPath, lines.join('\n') + '\n');

      // Load tasks from JSONL
      const loaded = await batchLoader.loadFromFile(inputPath);

      // Verify loaded tasks match original
      expect(loaded.tasks).toHaveLength(2);
      expect(loaded.tasks[0]).toEqual(originalTasks[0]);
      expect(loaded.tasks[1]).toEqual(originalTasks[1]);

      // Create mock responses
      const responses: TaskResponse[] = loaded.tasks.map((task, index) => ({
        id: task.id,
        request: task,
        response: `Response ${index + 1}`,
        usage: {
          promptTokens: 10,
          completionTokens: 50,
          totalTokens: 60,
        },
        cost: 0.001,
        timestamp: new Date().toISOString(),
        success: true,
        batch_id: task.batch_id,
        corr_id: task.corr_id,
      }));

      // Write responses to JSONL
      const outputPath = path.join(tempDir, 'output.jsonl');
      await batchWriter.writeResults(responses, outputPath);

      // Verify the output file was created and contains expected content
      expect(fs.existsSync(outputPath)).toBe(true);
      const outputContent = fs.readFileSync(outputPath, 'utf-8');
      const outputLines = outputContent.trim().split('\n');
      expect(outputLines).toHaveLength(2);

      // Parse the first response to verify structure
      const firstResponse = JSON.parse(outputLines[0]);
      expect(firstResponse.id).toBe('task-1');
      expect(firstResponse.request).toEqual(originalTasks[0]);
      expect(firstResponse.response).toBe('Response 1');
    });

    it('should handle empty JSONL file', async () => {
      const inputPath = path.join(tempDir, 'empty.jsonl');
      fs.writeFileSync(inputPath, '');

      const loaded = await batchLoader.loadFromFile(inputPath);

      expect(loaded.tasks).toHaveLength(0);
      expect(loaded.format).toBe('jsonl');
    });

    it('should handle JSONL with empty lines', async () => {
      const tasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'First task' },
        { id: 'task-2', prompt: 'Second task' },
      ];

      const inputPath = path.join(tempDir, 'with-empty-lines.jsonl');
      const content = [
        JSON.stringify(tasks[0]),
        '',
        JSON.stringify(tasks[1]),
        '',
        '',
      ].join('\n');
      fs.writeFileSync(inputPath, content);

      const loaded = await batchLoader.loadFromFile(inputPath);

      expect(loaded.tasks).toHaveLength(2);
      expect(loaded.tasks[0]).toEqual(tasks[0]);
      expect(loaded.tasks[1]).toEqual(tasks[1]);
    });
  });

  describe('CSV Round-trip', () => {
    it('should preserve all fields in CSV round-trip', async () => {
      const originalTasks: TaskRequest[] = [
        {
          id: 'task-1',
          prompt: 'Write a haiku',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 100,
          batch_id: 'batch-001',
          idempotency_key: 'key-123',
          metadata: { category: 'creative' },
        },
        {
          id: 'task-2',
          prompt: 'Write a poem',
          model: 'gpt-4',
          temperature: 0.5,
          maxTokens: 200,
          batch_id: 'batch-001',
          idempotency_key: 'key-456',
          metadata: { category: 'educational' },
        },
      ];

      // Create CSV content
      const csvContent = [
        'id,prompt,model,temperature,maxTokens,batch_id,idempotency_key,metadata',
        'task-1,"Write a haiku",gpt-3.5-turbo,0.7,100,batch-001,key-123,"{""category"":""creative""}"',
        'task-2,"Write a poem",gpt-4,0.5,200,batch-001,key-456,"{""category"":""educational""}"',
      ].join('\n');

      const inputPath = path.join(tempDir, 'input.csv');
      fs.writeFileSync(inputPath, csvContent);

      // Load tasks from CSV
      const loaded = await batchLoader.loadFromFile(inputPath);

      // Verify loaded tasks match original
      expect(loaded.tasks).toHaveLength(2);
      expect(loaded.tasks[0].id).toBe('task-1');
      expect(loaded.tasks[0].prompt).toBe('Write a haiku');
      expect(loaded.tasks[0].model).toBe('gpt-3.5-turbo');
      expect(loaded.tasks[0].temperature).toBe(0.7);
      expect(loaded.tasks[0].maxTokens).toBe(100);
      expect(loaded.tasks[0].batch_id).toBe('batch-001');
      expect(loaded.tasks[0].idempotency_key).toBe('key-123');
      expect(loaded.tasks[0].metadata).toEqual({ category: 'creative' });

      expect(loaded.tasks[1].id).toBe('task-2');
      expect(loaded.tasks[1].prompt).toBe('Write a poem');
      expect(loaded.tasks[1].model).toBe('gpt-4');
      expect(loaded.tasks[1].temperature).toBe(0.5);
      expect(loaded.tasks[1].maxTokens).toBe(200);
      expect(loaded.tasks[1].batch_id).toBe('batch-001');
      expect(loaded.tasks[1].idempotency_key).toBe('key-456');
      expect(loaded.tasks[1].metadata).toEqual({ category: 'educational' });
    });

    it('should handle CSV with minimal required fields', async () => {
      const csvContent = [
        'id,prompt',
        'task-1,"Write a haiku"',
        'task-2,"Write a poem"',
      ].join('\n');

      const inputPath = path.join(tempDir, 'minimal.csv');
      fs.writeFileSync(inputPath, csvContent);

      const loaded = await batchLoader.loadFromFile(inputPath);

      expect(loaded.tasks).toHaveLength(2);
      expect(loaded.tasks[0]).toEqual({
        id: 'task-1',
        prompt: 'Write a haiku',
      });
      expect(loaded.tasks[1]).toEqual({
        id: 'task-2',
        prompt: 'Write a poem',
      });
    });
  });

  describe('Mixed Format Round-trip', () => {
    it('should convert between JSONL and CSV formats', async () => {
      const originalTasks: TaskRequest[] = [
        {
          id: 'task-1',
          prompt: 'Write a haiku',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 100,
        },
        {
          id: 'task-2',
          prompt: 'Write a poem',
          model: 'gpt-4',
          temperature: 0.5,
          maxTokens: 200,
        },
      ];

      // Start with JSONL
      const jsonlPath = path.join(tempDir, 'input.jsonl');
      const lines = originalTasks.map((task) => JSON.stringify(task));
      fs.writeFileSync(jsonlPath, lines.join('\n') + '\n');

      // Load from JSONL
      const loaded = await batchLoader.loadFromFile(jsonlPath);

      // Create mock responses
      const responses: TaskResponse[] = loaded.tasks.map((task, index) => ({
        id: task.id,
        request: task,
        response: `Response ${index + 1}`,
        usage: {
          promptTokens: 10,
          completionTokens: 50,
          totalTokens: 60,
        },
        cost: 0.001,
        timestamp: new Date().toISOString(),
        success: true,
      }));

      // Write to CSV
      const csvPath = path.join(tempDir, 'output.csv');
      await batchWriter.writeResults(responses, csvPath);

      // Verify CSV was created
      expect(fs.existsSync(csvPath)).toBe(true);
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      expect(csvContent).toContain('task-1');
      expect(csvContent).toContain('task-2');
      expect(csvContent).toContain('Response 1');
      expect(csvContent).toContain('Response 2');
    });
  });
});
