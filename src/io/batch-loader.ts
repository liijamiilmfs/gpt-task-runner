import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { TaskRequest, BatchInput } from '../types';
import { TaskValidator, ValidationError } from '../validation/task-validator';

export class BatchLoader {
  async loadFromFile(filePath: string): Promise<BatchInput> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv') {
      return this.loadFromCSV(filePath);
    } else if (ext === '.jsonl') {
      return this.loadFromJSONL(filePath);
    } else {
      throw new Error(
        `Unsupported file format: ${ext}. Supported formats: .csv, .jsonl`
      );
    }
  }

  private async loadFromCSV(filePath: string): Promise<BatchInput> {
    return new Promise((resolve, reject) => {
      const tasks: TaskRequest[] = [];
      const validationErrors: ValidationError[] = [];
      let rowNumber = 0;

      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        reject(
          new Error(`ENOENT: no such file or directory, open '${filePath}'`)
        );
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;

          // Parse messages if present
          let messages;
          if (row.messages) {
            try {
              messages = JSON.parse(row.messages);
            } catch (error) {
              validationErrors.push({
                field: 'messages',
                message: `Invalid JSON format for messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
                value: row.messages,
              });
            }
          }

          // Parse metadata if present
          let metadata;
          if (row.metadata) {
            try {
              metadata = JSON.parse(row.metadata);
            } catch (error) {
              validationErrors.push({
                field: 'metadata',
                message: `Invalid JSON format for metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
                value: row.metadata,
              });
            }
          }

          const task: TaskRequest = {
            id: row.id || `task-${tasks.length + 1}`,
            ...(row.prompt && { prompt: row.prompt }),
            ...(messages && { messages }),
            ...(row.model && { model: row.model }),
            ...(row.temperature && {
              temperature: parseFloat(row.temperature),
            }),
            ...(row.maxTokens && { maxTokens: parseInt(row.maxTokens) }),
            ...(metadata && { metadata }),
            ...(row.batch_id && { batch_id: row.batch_id }),
            ...(row.corr_id && { corr_id: row.corr_id }),
            ...(row.idempotency_key && {
              idempotency_key: row.idempotency_key,
            }),
            ...(this.parseMetadata(row) && {
              metadata: { ...metadata, ...this.parseMetadata(row) },
            }),
          };

          // Validate the task
          const validation = TaskValidator.validateTask(task, rowNumber);
          validationErrors.push(...validation.errors);

          tasks.push(task);
        })
        .on('end', () => {
          if (validationErrors.length > 0) {
            const errorMessages = validationErrors
              .map((err) => err.message)
              .join('\n');
            reject(new Error(`Validation errors found:\n${errorMessages}`));
          } else {
            resolve({ tasks, format: 'csv' });
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async loadFromJSONL(filePath: string): Promise<BatchInput> {
    return new Promise((resolve, reject) => {
      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        reject(new Error(`ENOENT: no such file or directory, open '${filePath}'`));
        return;
      }

      const tasks: TaskRequest[] = [];
      const validationErrors: ValidationError[] = [];
      let lineNumber = 0;

      const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      let buffer = '';

      stream
        .on('data', (chunk: string | Buffer) => {
          buffer += chunk;
          const lines = buffer.split('\n');

          // Keep the last line in buffer (might be incomplete)
          buffer = lines.pop() || '';

          for (const line of lines) {
            lineNumber++;
            if (line.trim()) {
              try {
                const task = JSON.parse(line) as TaskRequest;

                // Validate the task
                const validation = TaskValidator.validateTask(task, lineNumber);
                validationErrors.push(...validation.errors);

                tasks.push(task);
              } catch (error) {
                validationErrors.push({
                  field: 'json',
                  message: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  value: line,
                });
              }
            }
          }
        })
        .on('end', () => {
          // Process the last line if it exists
          if (buffer.trim()) {
            lineNumber++;
            try {
              const task = JSON.parse(buffer) as TaskRequest;
              const validation = TaskValidator.validateTask(task, lineNumber);
              validationErrors.push(...validation.errors);
              tasks.push(task);
            } catch (error) {
              validationErrors.push({
                field: 'json',
                message: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`,
                value: buffer,
              });
            }
          }

          if (validationErrors.length > 0) {
            const errorMessages = validationErrors
              .map((err) => err.message)
              .join('\n');
            reject(new Error(`Validation errors found:\n${errorMessages}`));
          } else {
            resolve({ tasks, format: 'jsonl' });
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private parseMetadata(row: Record<string, unknown>): Record<string, unknown> | undefined {
    const metadata: Record<string, unknown> = {};
    let hasMetadata = false;

    for (const [key, value] of Object.entries(row)) {
      if (
        ![
          'id',
          'prompt',
          'messages',
          'model',
          'temperature',
          'maxTokens',
          'metadata',
          'batch_id',
          'corr_id',
          'idempotency_key',
        ].includes(key)
      ) {
        metadata[key] = value;
        hasMetadata = true;
      }
    }

    return hasMetadata ? metadata : undefined;
  }
}
