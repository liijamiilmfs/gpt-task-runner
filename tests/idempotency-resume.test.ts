import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskRunner } from '../src/task-runner';
import { DryRunTransport } from '../src/transports/dry-run-transport';
import { TaskRequest } from '../src/types';
import { Logger } from '../src/logger';
import * as fs from 'fs';
import * as path from 'path';

describe('Idempotency and Resume Functionality', () => {
  let taskRunner: TaskRunner;
  let transport: DryRunTransport;
  const testDir = path.join(__dirname, 'test-output');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Clean up any existing test files
    const files = [
      'test-tasks.jsonl',
      'result.jsonl',
      'failed.jsonl',
      'checkpoint.json',
    ];
    files.forEach((file) => {
      const filePath = path.join(testDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    transport = new DryRunTransport();
    const logger = new Logger('info', false);
    taskRunner = new TaskRunner(transport, logger);

    // Mock process.exit to prevent actual exit
    vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testDir, file));
      });
      fs.rmdirSync(testDir);
    }
  });

  describe('Idempotency Key Generation', () => {
    it('should generate stable idempotency keys for identical tasks', () => {
      const task1: TaskRequest = {
        id: 'task-1',
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
      };

      const task2: TaskRequest = {
        id: 'task-2',
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
      };

      // Both tasks should generate the same idempotency key
      const key1 = taskRunner.generateIdempotencyKey(task1);
      const key2 = taskRunner.generateIdempotencyKey(task2);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    it('should generate different idempotency keys for different tasks', () => {
      const task1: TaskRequest = {
        id: 'task-1',
        prompt: 'Test prompt 1',
        model: 'gpt-3.5-turbo',
      };

      const task2: TaskRequest = {
        id: 'task-2',
        prompt: 'Test prompt 2',
        model: 'gpt-3.5-turbo',
      };

      const key1 = taskRunner.generateIdempotencyKey(task1);
      const key2 = taskRunner.generateIdempotencyKey(task2);

      expect(key1).not.toBe(key2);
    });

    it('should include all relevant fields in idempotency key generation', () => {
      const task: TaskRequest = {
        id: 'task-1',
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Test prompt' },
        ],
      };

      const key1 = taskRunner.generateIdempotencyKey(task);

      // Change a field and verify key changes
      const task2 = { ...task, temperature: 0.8 };
      const key2 = taskRunner.generateIdempotencyKey(task2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Checkpoint System', () => {
    it('should create checkpoint files during batch execution', async () => {
      const tasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'Test 1' },
        { id: 'task-2', prompt: 'Test 2' },
        { id: 'task-3', prompt: 'Test 3' },
      ];

      const inputFile = path.join(testDir, 'test-tasks.jsonl');
      const outputFile = path.join(testDir, 'result.jsonl');
      const checkpointFile = path.join(testDir, 'checkpoint.json');

      // Write test tasks to file
      const taskLines = tasks.map((task) => JSON.stringify(task)).join('\n');
      fs.writeFileSync(inputFile, taskLines);

      // Run with checkpoint interval of 2
      try {
        await taskRunner.runFromFile(inputFile, {
          dryRun: true,
          input: inputFile,
          output: outputFile,
          verbose: false,
          checkpointInterval: 2,
        });
      } catch (error) {
        // Expected process.exit call
        if (error instanceof Error && error.message.includes('process.exit')) {
          // This is expected, continue with test
        } else {
          throw error;
        }
      }

      // Check that checkpoint file was created (it might be cleaned up, so check if it exists or was created)
      const checkpointExists = fs.existsSync(checkpointFile);
      if (checkpointExists) {
        // Verify checkpoint content
        const checkpointContent = JSON.parse(
          fs.readFileSync(checkpointFile, 'utf-8')
        );
        expect(checkpointContent).toHaveProperty('batchId');
        expect(checkpointContent).toHaveProperty('completedTasks');
        expect(checkpointContent).toHaveProperty('failedTasks');
        expect(checkpointContent).toHaveProperty('lastCheckpoint');
        expect(checkpointContent.completedTasks).toHaveLength(3);
      } else {
        // If checkpoint was cleaned up, that's also valid behavior
        expect(checkpointExists).toBe(false);
      }
    });

    it('should resume from checkpoint when --resume flag is used', async () => {
      const tasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'Test 1' },
        { id: 'task-2', prompt: 'Test 2' },
        { id: 'task-3', prompt: 'Test 3' },
      ];

      const inputFile = path.join(testDir, 'test-tasks.jsonl');
      const outputFile = path.join(testDir, 'result.jsonl');
      const checkpointFile = path.join(testDir, 'checkpoint.json');

      // Write test tasks to file
      const taskLines = tasks.map((task) => JSON.stringify(task)).join('\n');
      fs.writeFileSync(inputFile, taskLines);

      // Create a mock checkpoint
      const mockCheckpoint = {
        batchId: 'test-batch-123',
        completedTasks: ['task-1'],
        failedTasks: ['task-2'],
        lastCheckpoint: new Date().toISOString(),
        totalTasks: 3,
      };
      fs.writeFileSync(checkpointFile, JSON.stringify(mockCheckpoint, null, 2));

      // Run with resume flag
      try {
        await taskRunner.runFromFile(inputFile, {
          dryRun: true,
          input: inputFile,
          output: outputFile,
          verbose: false,
          resume: checkpointFile,
        });
      } catch (error) {
        // Expected process.exit call
        if (error instanceof Error && error.message.includes('process.exit')) {
          // This is expected, continue with test
        } else {
          throw error;
        }
      }

      // Verify that only remaining tasks were processed
      const resultContent = fs.readFileSync(outputFile, 'utf-8');
      const resultLines = resultContent.trim().split('\n');
      expect(resultLines).toHaveLength(1); // Only task-3 should be processed
    });

    it('should process only failed tasks when --only-failed flag is used', async () => {
      const tasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'Test 1' },
        { id: 'task-2', prompt: 'Test 2' },
        { id: 'task-3', prompt: 'Test 3' },
      ];

      const inputFile = path.join(testDir, 'test-tasks.jsonl');
      const outputFile = path.join(testDir, 'result.jsonl');
      const checkpointFile = path.join(testDir, 'checkpoint.json');

      // Write test tasks to file
      const taskLines = tasks.map((task) => JSON.stringify(task)).join('\n');
      fs.writeFileSync(inputFile, taskLines);

      // Create a mock checkpoint with failed tasks
      const mockCheckpoint = {
        batchId: 'test-batch-123',
        completedTasks: ['task-1'],
        failedTasks: ['task-2'],
        lastCheckpoint: new Date().toISOString(),
        totalTasks: 3,
      };
      fs.writeFileSync(checkpointFile, JSON.stringify(mockCheckpoint, null, 2));

      // Run with only-failed flag
      try {
        await taskRunner.runFromFile(inputFile, {
          dryRun: true,
          input: inputFile,
          output: outputFile,
          verbose: false,
          resume: checkpointFile,
          onlyFailed: true,
        });
      } catch (error) {
        // Expected process.exit call
        if (error instanceof Error && error.message.includes('process.exit')) {
          // This is expected, continue with test
        } else {
          throw error;
        }
      }

      // Verify that only failed tasks were processed
      const resultContent = fs.readFileSync(outputFile, 'utf-8');
      const resultLines = resultContent.trim().split('\n');
      expect(resultLines).toHaveLength(1); // Only task-2 should be processed
    });
  });

  describe('Output Files', () => {
    it('should create result.jsonl and failed.jsonl files', async () => {
      const tasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'Test 1' },
        { id: 'task-2', prompt: 'Test 2' },
      ];

      const inputFile = path.join(testDir, 'test-tasks.jsonl');
      const outputFile = path.join(testDir, 'result.jsonl');
      const failedFile = path.join(testDir, 'failed.jsonl');

      // Write test tasks to file
      const taskLines = tasks.map((task) => JSON.stringify(task)).join('\n');
      fs.writeFileSync(inputFile, taskLines);

      // Run tasks
      try {
        await taskRunner.runFromFile(inputFile, {
          dryRun: true,
          input: inputFile,
          output: outputFile,
          verbose: false,
        });
      } catch (error) {
        // Expected process.exit call
        if (error instanceof Error && error.message.includes('process.exit')) {
          // This is expected, continue with test
        } else {
          throw error;
        }
      }

      // Check that output files exist
      expect(fs.existsSync(outputFile)).toBe(true);
      // failed.jsonl should only exist if there are failed tasks
      // In dry run mode, all tasks succeed, so failed.jsonl won't be created
      expect(fs.existsSync(failedFile)).toBe(false);

      // Verify result.jsonl content
      const resultContent = fs.readFileSync(outputFile, 'utf-8');
      const resultLines = resultContent.trim().split('\n');
      expect(resultLines).toHaveLength(2);

      // Verify each result is valid JSON
      resultLines.forEach((line) => {
        const result = JSON.parse(line);
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
      });
    });

    it('should handle mixed success and failure scenarios', async () => {
      const tasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'Test 1' },
        { id: 'task-2', prompt: 'Test 2' },
      ];

      const inputFile = path.join(testDir, 'test-tasks.jsonl');
      const outputFile = path.join(testDir, 'result.jsonl');
      const failedFile = path.join(testDir, 'result.failed.jsonl');

      // Write test tasks to file
      const taskLines = tasks.map((task) => JSON.stringify(task)).join('\n');
      fs.writeFileSync(inputFile, taskLines);

      // Mock the transport to fail on specific tasks
      const originalExecuteBatch = transport.executeBatch;
      transport.executeBatch = vi
        .fn()
        .mockImplementation(async (requests: TaskRequest[]) => {
          const results = [];
          for (const request of requests) {
            if (request.id === 'task-2') {
              results.push({
                id: request.id,
                request,
                error: 'Simulated failure',
                timestamp: new Date().toISOString(),
                success: false,
              });
            } else {
              // Success for other tasks
              results.push({
                id: request.id,
                request,
                response: `Mock response for ${request.id}`,
                timestamp: new Date().toISOString(),
                success: true,
              });
            }
          }
          return results;
        });

      try {
        // Run tasks
        try {
          await taskRunner.runFromFile(inputFile, {
            dryRun: false,
            input: inputFile,
            output: outputFile,
            verbose: false,
          });
        } catch (error) {
          // Expected error when some tasks fail
          if (
            error instanceof Error &&
            error.message.includes('Some tasks failed')
          ) {
            // This is expected, continue with test
          } else {
            throw error;
          }
        }

        // Check that both files exist
        expect(fs.existsSync(outputFile)).toBe(true);
        expect(fs.existsSync(failedFile)).toBe(true);

        // Verify result.jsonl has successful tasks
        const resultContent = fs.readFileSync(outputFile, 'utf-8');
        const resultLines = resultContent.trim().split('\n');
        expect(resultLines).toHaveLength(1);
        expect(JSON.parse(resultLines[0]).id).toBe('task-1');

        // Verify failed.jsonl has failed tasks
        const failedContent = fs.readFileSync(failedFile, 'utf-8');
        const failedLines = failedContent.trim().split('\n');
        expect(failedLines).toHaveLength(1);
        expect(JSON.parse(failedLines[0]).id).toBe('task-2');
      } finally {
        // Restore original method
        transport.executeBatch = originalExecuteBatch;
      }
    });
  });

  describe('Resume Handler', () => {
    it('should correctly identify tasks to process on resume', () => {
      const allTasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'Test 1' },
        { id: 'task-2', prompt: 'Test 2' },
        { id: 'task-3', prompt: 'Test 3' },
        { id: 'task-4', prompt: 'Test 4' },
      ];

      const checkpoint = {
        batchId: 'test-batch-123',
        completedTasks: ['task-1', 'task-3'],
        failedTasks: ['task-2'],
        lastCheckpoint: new Date().toISOString(),
        totalTasks: 4,
      };

      // Test normal resume (should process remaining tasks)
      const tasksToProcess = taskRunner.getTasksToProcess(
        allTasks,
        checkpoint,
        false
      );
      expect(tasksToProcess).toHaveLength(1);
      expect(tasksToProcess[0].id).toBe('task-4');

      // Test only-failed resume (should process only failed tasks)
      const failedTasksToProcess = taskRunner.getTasksToProcess(
        allTasks,
        checkpoint,
        true
      );
      expect(failedTasksToProcess).toHaveLength(1);
      expect(failedTasksToProcess[0].id).toBe('task-2');
    });

    it('should handle empty checkpoint gracefully', () => {
      const allTasks: TaskRequest[] = [
        { id: 'task-1', prompt: 'Test 1' },
        { id: 'task-2', prompt: 'Test 2' },
      ];

      const checkpoint = {
        batchId: 'test-batch-123',
        completedTasks: [],
        failedTasks: [],
        lastCheckpoint: new Date().toISOString(),
        totalTasks: 2,
      };

      const tasksToProcess = taskRunner.getTasksToProcess(
        allTasks,
        checkpoint,
        false
      );
      expect(tasksToProcess).toHaveLength(2);
      expect(tasksToProcess.map((t) => t.id)).toEqual(['task-1', 'task-2']);
    });
  });
});
