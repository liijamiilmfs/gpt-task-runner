import * as fs from 'fs';
import { TaskRequest, TaskResponse } from '../types';
import { CheckpointData, CheckpointManager } from './checkpoint';
import { IdempotencyManager } from './idempotency';

export interface ResumeOptions {
  checkpointFile: string;
  onlyFailed: boolean;
  skipCompleted: boolean;
}

export interface ResumeResult {
  canResume: boolean;
  checkpoint?: CheckpointData;
  remainingTasks: TaskRequest[];
  completedTasks: TaskResponse[];
  failedTasks: TaskResponse[];
  resumeFromIndex: number;
}

export class ResumeHandler {
  private checkpointManager: CheckpointManager;

  constructor(
    checkpointManager: CheckpointManager,
    _idempotencyManager: IdempotencyManager
  ) {
    this.checkpointManager = checkpointManager;
  }

  /**
   * Analyze checkpoint and determine what can be resumed
   */
  analyzeResume(options: ResumeOptions): ResumeResult {
    const checkpoint = this.checkpointManager.loadCheckpoint(
      options.checkpointFile
    );

    if (!checkpoint) {
      return {
        canResume: false,
        remainingTasks: [],
        completedTasks: [],
        failedTasks: [],
        resumeFromIndex: 0,
      };
    }

    // Load completed and failed tasks from output files
    const completedTasks = this.loadTaskResults(checkpoint.outputFile || '');
    const failedTasks = this.loadTaskResults(checkpoint.failedFile || '');

    // Load original input tasks
    const originalTasks = this.loadOriginalTasks(checkpoint.inputFile);

    if (originalTasks.length === 0) {
      return {
        canResume: false,
        checkpoint,
        remainingTasks: [],
        completedTasks,
        failedTasks,
        resumeFromIndex: 0,
      };
    }

    // Determine which tasks to resume
    let remainingTasks: TaskRequest[] = [];
    let resumeFromIndex = 0;

    if (options.onlyFailed) {
      // Only retry failed tasks
      remainingTasks = this.getFailedTaskRequests(originalTasks, failedTasks);
      resumeFromIndex = 0;
    } else if (options.skipCompleted) {
      // Skip completed tasks, resume from where we left off
      const completedTaskIds = new Set(
        completedTasks.map((task) => task.id)
      );
      remainingTasks = originalTasks.filter(
        (task) => !completedTaskIds.has(task.id)
      );
      resumeFromIndex = this.findResumeIndex(originalTasks, checkpoint.lastTaskId);
    } else {
      // Resume from the last processed task
      resumeFromIndex = this.findResumeIndex(originalTasks, checkpoint.lastTaskId);
      remainingTasks = originalTasks.slice(resumeFromIndex);
    }

    return {
      canResume: true,
      checkpoint,
      remainingTasks,
      completedTasks,
      failedTasks,
      resumeFromIndex,
    };
  }

  /**
   * Resume processing from a checkpoint
   */
  resumeFromCheckpoint(
    options: ResumeOptions,
    _originalTasks: TaskRequest[]
  ): ResumeResult {
    const analysis = this.analyzeResume(options);

    if (!analysis.canResume) {
      throw new Error(
        `Cannot resume from checkpoint: ${options.checkpointFile}`
      );
    }

    // Update checkpoint to reflect resume
    if (analysis.checkpoint) {
      analysis.checkpoint.status = 'running';
      analysis.checkpoint.lastUpdateTime = new Date().toISOString();
      this.checkpointManager.saveCheckpoint();
    }

    return analysis;
  }

  /**
   * Load task results from JSONL file
   */
  private loadTaskResults(filePath: string): TaskResponse[] {
    if (!filePath || !fs.existsSync(filePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.trim());

      return lines.map((line) => {
        try {
          return JSON.parse(line) as TaskResponse;
        } catch (_error) {
          console.warn(`Failed to parse task result: ${line}`);
          return null;
        }
      }).filter((task): task is TaskResponse => task !== null);
    } catch (error) {
      console.error(`Failed to load task results from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Load original tasks from input file
   */
  private loadOriginalTasks(inputFile: string): TaskRequest[] {
    if (!inputFile || !fs.existsSync(inputFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(inputFile, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.trim());

      return lines.map((line) => {
        try {
          return JSON.parse(line) as TaskRequest;
        } catch (_error) {
          console.warn(`Failed to parse task request: ${line}`);
          return null;
        }
      }).filter((task): task is TaskRequest => task !== null);
    } catch (error) {
      console.error(`Failed to load original tasks from ${inputFile}:`, error);
      return [];
    }
  }

  /**
   * Get task requests for failed tasks
   */
  private getFailedTaskRequests(
    originalTasks: TaskRequest[],
    failedTasks: TaskResponse[]
  ): TaskRequest[] {
    const failedTaskIds = new Set(failedTasks.map((task) => task.id));
    return originalTasks.filter((task) => failedTaskIds.has(task.id));
  }

  /**
   * Find the index to resume from based on last task ID
   */
  private findResumeIndex(
    originalTasks: TaskRequest[],
    lastTaskId?: string
  ): number {
    if (!lastTaskId) {
      return 0;
    }

    const lastIndex = originalTasks.findIndex((task) => task.id === lastTaskId);
    return lastIndex >= 0 ? lastIndex + 1 : 0;
  }

  /**
   * Merge resume results with existing results
   */
  mergeResults(
    existingCompleted: TaskResponse[],
    existingFailed: TaskResponse[],
    newCompleted: TaskResponse[],
    newFailed: TaskResponse[]
  ): {
    allCompleted: TaskResponse[];
    allFailed: TaskResponse[];
  } {
    // Create maps for efficient lookup
    const existingCompletedMap = new Map(
      existingCompleted.map((task) => [task.id, task])
    );
    const existingFailedMap = new Map(
      existingFailed.map((task) => [task.id, task])
    );

    // Merge new results, preferring new ones over existing
    const allCompleted = [...existingCompleted];
    const allFailed = [...existingFailed];

    for (const task of newCompleted) {
      if (existingFailedMap.has(task.id)) {
        // Move from failed to completed
        const failedIndex = allFailed.findIndex((t) => t.id === task.id);
        if (failedIndex >= 0) {
          allFailed.splice(failedIndex, 1);
        }
      }
      if (!existingCompletedMap.has(task.id)) {
        allCompleted.push(task);
      }
    }

    for (const task of newFailed) {
      if (existingCompletedMap.has(task.id)) {
        // Move from completed to failed
        const completedIndex = allCompleted.findIndex((t) => t.id === task.id);
        if (completedIndex >= 0) {
          allCompleted.splice(completedIndex, 1);
        }
      }
      if (!existingFailedMap.has(task.id)) {
        allFailed.push(task);
      }
    }

    return { allCompleted, allFailed };
  }

  /**
   * Get resume statistics
   */
  getResumeStats(analysis: ResumeResult): {
    totalOriginal: number;
    alreadyCompleted: number;
    alreadyFailed: number;
    remainingToProcess: number;
    progressPercentage: number;
  } {
    const totalOriginal = analysis.checkpoint?.totalTasks || 0;
    const alreadyCompleted = analysis.completedTasks.length;
    const alreadyFailed = analysis.failedTasks.length;
    const remainingToProcess = analysis.remainingTasks.length;
    const progressPercentage = totalOriginal > 0 
      ? ((alreadyCompleted + alreadyFailed) / totalOriginal) * 100 
      : 0;

    return {
      totalOriginal,
      alreadyCompleted,
      alreadyFailed,
      remainingToProcess,
      progressPercentage,
    };
  }
}

// Default resume handler instance
export const resumeHandler = new ResumeHandler(
  new CheckpointManager(),
  new IdempotencyManager()
);
