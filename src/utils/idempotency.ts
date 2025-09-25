import * as crypto from 'crypto';
import { TaskRequest } from '../types';

export interface IdempotencyRecord {
  keyHash: string;
  taskId: string;
  batchId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

export class IdempotencyManager {
  private records: Map<string, IdempotencyRecord> = new Map();

  /**
   * Generate a stable idempotency key for a task request
   * Uses content hashing to ensure identical tasks get the same key
   */
  generateIdempotencyKey(request: TaskRequest): string {
    // Create a stable string representation of the task
    const content = this.serializeTaskContent(request);
    
    // Generate SHA-256 hash of the content
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Return first 16 characters for readability (still very unique)
    return hash.substring(0, 16);
  }

  /**
   * Check if a task has already been processed
   */
  isTaskProcessed(idempotencyKey: string): boolean {
    const record = this.records.get(idempotencyKey);
    return record?.status === 'completed';
  }

  /**
   * Get the result of a previously processed task
   */
  getTaskResult(idempotencyKey: string): any | null {
    const record = this.records.get(idempotencyKey);
    return record?.status === 'completed' ? record.result : null;
  }

  /**
   * Mark a task as completed with its result
   */
  markTaskCompleted(
    idempotencyKey: string,
    taskId: string,
    batchId: string,
    result: any
  ): void {
    const record: IdempotencyRecord = {
      keyHash: idempotencyKey,
      taskId,
      batchId,
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      result,
    };

    this.records.set(idempotencyKey, record);
  }

  /**
   * Mark a task as failed with error details
   */
  markTaskFailed(
    idempotencyKey: string,
    taskId: string,
    batchId: string,
    error: string
  ): void {
    const record: IdempotencyRecord = {
      keyHash: idempotencyKey,
      taskId,
      batchId,
      status: 'failed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error,
    };

    this.records.set(idempotencyKey, record);
  }

  /**
   * Get all failed tasks for retry
   */
  getFailedTasks(): IdempotencyRecord[] {
    return Array.from(this.records.values()).filter(
      (record) => record.status === 'failed'
    );
  }

  /**
   * Get all completed tasks
   */
  getCompletedTasks(): IdempotencyRecord[] {
    return Array.from(this.records.values()).filter(
      (record) => record.status === 'completed'
    );
  }

  /**
   * Clear all records (useful for testing)
   */
  clear(): void {
    this.records.clear();
  }

  /**
   * Get statistics about processed tasks
   */
  getStats(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  } {
    const records = Array.from(this.records.values());
    return {
      total: records.length,
      completed: records.filter((r) => r.status === 'completed').length,
      failed: records.filter((r) => r.status === 'failed').length,
      pending: records.filter((r) => r.status === 'pending').length,
    };
  }

  /**
   * Serialize task content for consistent hashing
   * Only includes the essential content that should make tasks identical
   */
  private serializeTaskContent(request: TaskRequest): string {
    // Create a normalized object with only the content-determining fields
    const normalized = {
      prompt: request.prompt || '',
      messages: request.messages || [],
      model: request.model || 'gpt-3.5-turbo',
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || 1000,
      // Include metadata that affects the actual request
      metadata: request.metadata || {},
    };

    // Sort arrays and objects for consistent ordering
    if (normalized.messages.length > 0) {
      normalized.messages.sort((a, b) => {
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        return a.content.localeCompare(b.content);
      });
    }

    // Sort metadata keys for consistency
    const sortedMetadata = Object.keys(normalized.metadata)
      .sort()
      .reduce((obj, key) => {
        obj[key] = normalized.metadata[key];
        return obj;
      }, {} as Record<string, any>);

    normalized.metadata = sortedMetadata;

    return JSON.stringify(normalized, null, 0);
  }
}

// Singleton instance for global use
export const idempotencyManager = new IdempotencyManager();
