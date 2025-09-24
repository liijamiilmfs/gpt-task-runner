import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { TaskRequest, BatchInput } from '../types';

export class BatchLoader {
  async loadFromFile(filePath: string): Promise<BatchInput> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.csv') {
      return this.loadFromCSV(filePath);
    } else if (ext === '.jsonl') {
      return this.loadFromJSONL(filePath);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Supported formats: .csv, .jsonl`);
    }
  }

  private async loadFromCSV(filePath: string): Promise<BatchInput> {
    return new Promise((resolve, reject) => {
      const tasks: TaskRequest[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Expected CSV columns: id, prompt, model?, temperature?, maxTokens?
          const task: TaskRequest = {
            id: row.id || `task-${tasks.length + 1}`,
            prompt: row.prompt,
            model: row.model || undefined,
            temperature: row.temperature ? parseFloat(row.temperature) : undefined,
            maxTokens: row.maxTokens ? parseInt(row.maxTokens) : undefined,
            metadata: this.parseMetadata(row),
          };
          tasks.push(task);
        })
        .on('end', () => {
          resolve({ tasks, format: 'csv' });
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

    for (const line of lines) {
      if (line.trim()) {
        try {
          const task = JSON.parse(line) as TaskRequest;
          tasks.push(task);
        } catch (error) {
          throw new Error(`Invalid JSONL line: ${line}`);
        }
      }
    }

    return { tasks, format: 'jsonl' };
  }

  private parseMetadata(row: any): Record<string, any> | undefined {
    const metadata: Record<string, any> = {};
    let hasMetadata = false;

    for (const [key, value] of Object.entries(row)) {
      if (!['id', 'prompt', 'model', 'temperature', 'maxTokens'].includes(key)) {
        metadata[key] = value;
        hasMetadata = true;
      }
    }

    return hasMetadata ? metadata : undefined;
  }
}
