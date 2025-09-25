import * as fs from 'fs';
import * as path from 'path';
import { TaskResponse } from '../types';

export interface CheckpointData {
  batchId: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastTaskId?: string;
  startTime: string;
  lastUpdateTime: string;
  inputFile: string;
  outputFile?: string;
  failedFile?: string;
  checkpointFile: string;
  status: 'running' | 'completed' | 'failed' | 'interrupted';
  metadata?: Record<string, any>;
}

export interface CheckpointOptions {
  checkpointInterval: number; // Create checkpoint every N tasks
  checkpointDir: string; // Directory to store checkpoint files
  autoSave: boolean; // Automatically save checkpoints
}

export class CheckpointManager {
  private currentCheckpoint: CheckpointData | null = null;
  private options: CheckpointOptions;
  private taskCount = 0;

  constructor(options: Partial<CheckpointOptions> = {}) {
    this.options = {
      checkpointInterval: 10,
      checkpointDir: './checkpoints',
      autoSave: true,
      ...options,
    };

    // Ensure checkpoint directory exists
    this.ensureCheckpointDir();
  }

  /**
   * Initialize a new checkpoint for a batch
   */
  initializeCheckpoint(
    batchId: string,
    totalTasks: number,
    inputFile: string,
    outputFile?: string,
    failedFile?: string
  ): CheckpointData {
    const checkpointFile = path.join(
      this.options.checkpointDir,
      `checkpoint-${batchId}.json`
    );

    this.currentCheckpoint = {
      batchId,
      totalTasks,
      completedTasks: 0,
      failedTasks: 0,
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      inputFile,
      outputFile,
      failedFile,
      checkpointFile,
      status: 'running',
    };

    if (this.options.autoSave) {
      this.saveCheckpoint();
    }

    return this.currentCheckpoint;
  }

  /**
   * Update checkpoint with task completion
   */
  updateTaskCompletion(
    taskId: string,
    success: boolean,
    _result?: TaskResponse
  ): void {
    if (!this.currentCheckpoint) {
      throw new Error('No active checkpoint. Call initializeCheckpoint first.');
    }

    this.taskCount++;

    if (success) {
      this.currentCheckpoint.completedTasks++;
    } else {
      this.currentCheckpoint.failedTasks++;
    }

    this.currentCheckpoint.lastTaskId = taskId;
    this.currentCheckpoint.lastUpdateTime = new Date().toISOString();

    // Auto-save if interval reached
    if (
      this.options.autoSave &&
      this.taskCount % this.options.checkpointInterval === 0
    ) {
      this.saveCheckpoint();
    }
  }

  /**
   * Mark checkpoint as completed
   */
  markCompleted(): void {
    if (!this.currentCheckpoint) {
      throw new Error('No active checkpoint.');
    }

    this.currentCheckpoint.status = 'completed';
    this.currentCheckpoint.lastUpdateTime = new Date().toISOString();
    this.saveCheckpoint();
  }

  /**
   * Mark checkpoint as failed
   */
  markFailed(): void {
    if (!this.currentCheckpoint) {
      throw new Error('No active checkpoint.');
    }

    this.currentCheckpoint.status = 'failed';
    this.currentCheckpoint.lastUpdateTime = new Date().toISOString();
    this.saveCheckpoint();
  }

  /**
   * Mark checkpoint as interrupted (for resume)
   */
  markInterrupted(): void {
    if (!this.currentCheckpoint) {
      throw new Error('No active checkpoint.');
    }

    this.currentCheckpoint.status = 'interrupted';
    this.currentCheckpoint.lastUpdateTime = new Date().toISOString();
    this.saveCheckpoint();
  }

  /**
   * Save checkpoint to file
   */
  saveCheckpoint(): void {
    if (!this.currentCheckpoint) {
      throw new Error('No active checkpoint.');
    }

    try {
      fs.writeFileSync(
        this.currentCheckpoint.checkpointFile,
        JSON.stringify(this.currentCheckpoint, null, 2)
      );
    } catch (error) {
      console.warn('Failed to save checkpoint:', error);
    }
  }

  /**
   * Load checkpoint from file
   */
  loadCheckpoint(checkpointFile: string): CheckpointData | null {
    try {
      if (!fs.existsSync(checkpointFile)) {
        return null;
      }

      const data = fs.readFileSync(checkpointFile, 'utf-8');
      const checkpoint = JSON.parse(data) as CheckpointData;
      
      // Validate checkpoint data
      if (!checkpoint.batchId || !checkpoint.totalTasks) {
        throw new Error('Invalid checkpoint data');
      }

      this.currentCheckpoint = checkpoint;
      return checkpoint;
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
      return null;
    }
  }

  /**
   * Get current checkpoint data
   */
  getCurrentCheckpoint(): CheckpointData | null {
    return this.currentCheckpoint;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (!this.currentCheckpoint) {
      return 0;
    }

    const totalProcessed =
      this.currentCheckpoint.completedTasks + this.currentCheckpoint.failedTasks;
    return (totalProcessed / this.currentCheckpoint.totalTasks) * 100;
  }

  /**
   * Check if checkpoint exists and is resumable
   */
  isResumable(checkpointFile: string): boolean {
    const checkpoint = this.loadCheckpoint(checkpointFile);
    return (
      checkpoint !== null &&
      (checkpoint.status === 'interrupted' || checkpoint.status === 'running')
    );
  }

  /**
   * Get list of available checkpoint files
   */
  listCheckpoints(): string[] {
    try {
      if (!fs.existsSync(this.options.checkpointDir)) {
        return [];
      }

      return fs
        .readdirSync(this.options.checkpointDir)
        .filter((file) => file.startsWith('checkpoint-') && file.endsWith('.json'))
        .map((file) => path.join(this.options.checkpointDir, file));
    } catch (error) {
      console.error('Failed to list checkpoints:', error);
      return [];
    }
  }

  /**
   * Clean up old checkpoint files
   */
  cleanupOldCheckpoints(maxAgeHours: number = 24): void {
    try {
      const checkpoints = this.listCheckpoints();
      const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;

      for (const checkpointFile of checkpoints) {
        const stats = fs.statSync(checkpointFile);
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(checkpointFile);
          console.log(`Cleaned up old checkpoint: ${checkpointFile}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup checkpoints:', error);
    }
  }

  /**
   * Ensure checkpoint directory exists
   */
  private ensureCheckpointDir(): void {
    try {
      if (!fs.existsSync(this.options.checkpointDir)) {
        fs.mkdirSync(this.options.checkpointDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create checkpoint directory:', error);
    }
  }
}

// Default checkpoint manager instance
export const checkpointManager = new CheckpointManager();
