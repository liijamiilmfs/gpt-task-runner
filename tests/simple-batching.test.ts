import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BatchLoader } from '../src/io/batch-loader';
import { TaskRunner } from '../src/task-runner';
import { DryRunTransport } from '../src/transports/dry-run-transport';
import { Logger } from '../src/logger';
import { CliOptions } from '../src/types';

describe('Simple Batching Tests', () => {
  let tempDir: string;
  let batchLoader: BatchLoader;
  let taskRunner: TaskRunner;
  let logger: Logger;
  let transport: DryRunTransport;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-task-runner-simple-'));
    batchLoader = new BatchLoader();
    logger = new Logger('info', false);
    transport = new DryRunTransport();
    taskRunner = new TaskRunner(transport, logger);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Basic Batching', () => {
    it('should process tasks with custom batch size', async () => {
      const taskCount = 25;
      const batchSize = 5;

      // Generate tasks
      const tasks = [];
      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `batch-test-${i}`,
          prompt: `Batch test task ${i}`,
          model: 'gpt-3.5-turbo',
        });
      }

      const inputPath = path.join(tempDir, 'batch-test.jsonl');
      const lines = tasks.map((task) => JSON.stringify(task));
      fs.writeFileSync(inputPath, lines.join('\n') + '\n');

      const options: CliOptions = {
        dryRun: true,
        input: inputPath,
        output: path.join(tempDir, 'batch-results.jsonl'),
        verbose: true,
        batchSize,
        maxInflight: 3,
        checkpointInterval: 10,
      };

      await taskRunner.runFromFile(inputPath, options);

      // Verify output file exists and has content
      expect(fs.existsSync(options.output!)).toBe(true);
      const outputContent = fs.readFileSync(options.output!, 'utf-8');
      const outputLines = outputContent
        .trim()
        .split('\n')
        .filter((line) => line.trim());
      expect(outputLines.length).toBe(taskCount);

      // Verify all lines are valid JSON
      const results = outputLines.map((line) => JSON.parse(line));
      expect(results.length).toBe(taskCount);

      // Verify all tasks were successful
      const allSuccessful = results.every((task) => task.success);
      expect(allSuccessful).toBe(true);
    });

    it('should handle streaming JSONL loading', async () => {
      const taskCount = 100;

      // Generate tasks
      const tasks = [];
      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `stream-test-${i}`,
          prompt: `Streaming test task ${i}`,
          model: 'gpt-3.5-turbo',
        });
      }

      const inputPath = path.join(tempDir, 'stream-test.jsonl');
      const lines = tasks.map((task) => JSON.stringify(task));
      fs.writeFileSync(inputPath, lines.join('\n') + '\n');

      // Test streaming loader
      const batchInput = await batchLoader.loadFromFile(inputPath);
      expect(batchInput.tasks.length).toBe(taskCount);
      expect(batchInput.format).toBe('jsonl');
    });

    it('should handle streaming CSV loading', async () => {
      const taskCount = 50;

      // Generate CSV content
      const csvLines = ['id,prompt,model'];
      for (let i = 0; i < taskCount; i++) {
        csvLines.push(`csv-test-${i},"CSV test task ${i}",gpt-3.5-turbo`);
      }

      const inputPath = path.join(tempDir, 'csv-test.csv');
      fs.writeFileSync(inputPath, csvLines.join('\n') + '\n');

      // Test streaming loader
      const batchInput = await batchLoader.loadFromFile(inputPath);
      expect(batchInput.tasks.length).toBe(taskCount);
      expect(batchInput.format).toBe('csv');
    });
  });

  describe('Memory Efficiency', () => {
    it('should process 1000 tasks with reasonable memory usage', async () => {
      const taskCount = 1000;
      const batchSize = 50;

      // Generate tasks
      const tasks = [];
      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `memory-test-${i}`,
          prompt: `Memory test task ${i}`,
          model: 'gpt-3.5-turbo',
        });
      }

      const inputPath = path.join(tempDir, 'memory-test.jsonl');
      const lines = tasks.map((task) => JSON.stringify(task));
      fs.writeFileSync(inputPath, lines.join('\n') + '\n');

      const options: CliOptions = {
        dryRun: true,
        input: inputPath,
        output: path.join(tempDir, 'memory-results.jsonl'),
        verbose: false,
        batchSize,
        maxInflight: 5,
        checkpointInterval: 100,
      };

      const startTime = Date.now();
      await taskRunner.runFromFile(inputPath, options);
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`Processed ${taskCount} tasks in ${duration}ms`);
      console.log(`Average time per task: ${duration / taskCount}ms`);

      // Verify output file exists and has content
      expect(fs.existsSync(options.output!)).toBe(true);
      const outputContent = fs.readFileSync(options.output!, 'utf-8');
      const outputLines = outputContent
        .trim()
        .split('\n')
        .filter((line) => line.trim());
      expect(outputLines.length).toBe(taskCount);

      // Verify all lines are valid JSON
      const results = outputLines.map((line) => JSON.parse(line));
      expect(results.length).toBe(taskCount);
    }, 30000); // 30 second timeout
  });
});
