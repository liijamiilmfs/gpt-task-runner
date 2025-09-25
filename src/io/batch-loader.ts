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
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const tasks: TaskRequest[] = [];
    const validationErrors: ValidationError[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        try {
          const task = JSON.parse(line) as TaskRequest;

          // Validate the task
          const validation = TaskValidator.validateTask(task, i + 1);
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

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map((err) => err.message)
        .join('\n');
      throw new Error(`Validation errors found:\n${errorMessages}`);
    }

    return { tasks, format: 'jsonl' };
  }

  private parseMetadata(row: any): Record<string, any> | undefined {
    const metadata: Record<string, any> = {};
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
