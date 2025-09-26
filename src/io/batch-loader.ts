import * as fs from 'fs';
import * as path from 'path';
import { TaskRequest, BatchInput } from '../types';
import { TaskValidator, ValidationError } from '../validation/task-validator';

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
        throw new Error(
          `Unsupported file format: ${ext}. Supported formats: .csv, .jsonl`
        );
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
      let inQuotes = false;
      let currentFields: string[] = [];
      let currentField = '';

      stream
        .on('data', (chunk: string | Buffer) => {
          buffer += chunk;
          
          // Process buffer character by character to handle multiline quoted fields
          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (char === '"') {
              // Handle escaped quotes ("")
              if (i + 1 < buffer.length && buffer[i + 1] === '"') {
                currentField += '"';
                i++; // Skip the next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // Field separator found
              currentFields.push(currentField.trim());
              currentField = '';
            } else if (char === '\n' && !inQuotes) {
              // Complete row found
              currentFields.push(currentField.trim());
              
              if (currentFields.some(field => field.length > 0)) {
                lineNumber++;
                
                if (lineNumber === 1) {
                  // Parse headers
                  headers = currentFields;
                } else {
                  // Parse data row
                  try {
                    const task = this.csvRowToTask(currentFields, headers, lineNumber);

                    // Validate the task
                    const validation = TaskValidator.validateTask(
                      task as unknown as Record<string, unknown>,
                      lineNumber
                    );
                    validationErrors.push(...validation.errors);

                    tasks.push(task);
                  } catch (error) {
                    validationErrors.push({
                      field: 'csv',
                      message: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      value: currentFields.join(','),
                    });
                  }
                }
              }
              
              // Reset for next row
              currentFields = [];
              currentField = '';
            } else {
              currentField += char;
            }
          }
          
          // Keep the last incomplete row in buffer
          buffer = currentField;
        })
        .on('end', () => {
          // Process the last row if it exists
          if (currentField.trim() || currentFields.length > 0) {
            currentFields.push(currentField.trim());
            
            if (currentFields.some(field => field.length > 0)) {
              lineNumber++;
              if (lineNumber > 1) {
                // Skip if it's just headers
                try {
                  const task = this.csvRowToTask(currentFields, headers, lineNumber);
                  const validation = TaskValidator.validateTask(
                    task as unknown as Record<string, unknown>,
                    lineNumber
                  );
                  validationErrors.push(...validation.errors);
                  tasks.push(task);
                } catch (error) {
                  validationErrors.push({
                    field: 'csv',
                    message: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    value: currentFields.join(','),
                  });
                }
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
        reject(
          new Error(`ENOENT: no such file or directory, open '${filePath}'`)
        );
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
                const validation = TaskValidator.validateTask(
                  task as unknown as Record<string, unknown>,
                  lineNumber
                );
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
              const validation = TaskValidator.validateTask(
                task as unknown as Record<string, unknown>,
                lineNumber
              );
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
        // Handle escaped quotes ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = !inQuotes;
        }
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

  private csvRowToTask(
    values: string[],
    headers: string[],
    lineNumber: number
  ): TaskRequest {
    const task: Record<string, unknown> = {};
    const metadata: Record<string, unknown> = {};

    // Define which fields should go into metadata
    const metadataFields = ['source', 'priority', 'tags', 'category', 'notes'];

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
      } else if (metadataFields.includes(header)) {
        // Put metadata fields into the metadata object
        if (value) {
          metadata[header] = value;
        }
      } else {
        task[header] = value || undefined;
      }
    }

    // Auto-generate ID if missing
    if (!task.id) {
      task.id = `task-${lineNumber - 1}`; // Subtract 1 because lineNumber includes header row
    }

    // Add metadata object if we have any metadata fields
    if (Object.keys(metadata).length > 0) {
      task.metadata = metadata;
    }

    return task as unknown as TaskRequest;
  }
}
