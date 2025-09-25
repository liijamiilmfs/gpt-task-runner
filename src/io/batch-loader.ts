import * as fs from 'fs';
import * as path from 'path';
import { TaskRequest } from '../types';
import { TaskValidator, ValidationError } from '../validation/task-validator';

export interface BatchInput {
  tasks: TaskRequest[];
  format: 'jsonl' | 'csv';
}

export class BatchLoader {
  /**
   * Load tasks from a file (JSONL or CSV)
   */
  async loadFromFile(filePath: string): Promise<BatchInput> {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.jsonl':
        return this.loadFromJSONL(filePath);
      case '.csv':
        return this.loadFromCSV(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}. Supported formats: .jsonl, .csv`);
    }
  }

  private async loadFromCSV(filePath: string): Promise<BatchInput> {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }

    return new Promise((resolve, reject) => {
      const tasks: TaskRequest[] = [];
      const validationErrors: ValidationError[] = [];
      let headers: string[] = [];
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
            
            if (lineNumber === 1) {
              // Parse headers
              headers = line.split(',').map(h => h.trim());
              continue;
            }

            if (line.trim()) {
              try {
                const values = this.parseCSVLine(line);
                const task = this.csvRowToTask(values, headers, lineNumber);
                
                // Validate the task
                const validation = TaskValidator.validateTask(task, lineNumber);
                validationErrors.push(...validation.errors);

                tasks.push(task);
              } catch (error) {
                validationErrors.push({
                  field: 'csv',
                  message: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
            if (lineNumber > 1) { // Skip if it's just headers
              try {
                const values = this.parseCSVLine(buffer);
                const task = this.csvRowToTask(values, headers, lineNumber);
                const validation = TaskValidator.validateTask(task, lineNumber);
                validationErrors.push(...validation.errors);
                tasks.push(task);
              } catch (error) {
                validationErrors.push({
                  field: 'csv',
                  message: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  value: buffer,
                });
              }
            }
          }

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

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private csvRowToTask(values: string[], headers: string[], _lineNumber: number): TaskRequest {
    const task: Record<string, unknown> = {};
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = values[i] || '';
      
      // Handle special cases
      if (header === 'metadata' && value) {
        try {
          task.metadata = JSON.parse(value);
        } catch {
          // If JSON parsing fails, store as string
          task.metadata = value;
        }
      } else if (header === 'temperature' || header === 'maxTokens') {
        task[header] = value ? parseFloat(value) : undefined;
      } else {
        task[header] = value || undefined;
      }
    }
    
    return task as TaskRequest;
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