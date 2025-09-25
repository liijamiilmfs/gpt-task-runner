import * as sqlite3 from 'sqlite3';
import * as path from 'path';
// import { TaskRequest, TaskResponse, DryRunResult } from '../types';

export interface TaskExecution {
  id: string;
  request: string; // JSON string of TaskRequest
  response?: string; // JSON string of TaskResponse
  dryRunResult?: string; // JSON string of DryRunResult
  status: 'pending' | 'running' | 'completed' | 'failed' | 'dry-run';
  createdAt: string;
  completedAt?: string;
  error?: string;
  isDryRun: boolean;
}

export interface TaskMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  dryRunTasks: number;
  totalCost: number;
  totalTokens: number;
  averageResponseTime: number;
  lastExecution?: string;
}

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'data', 'gpt-task-runner.db');
    this.db = new sqlite3.Database(dbPath || defaultPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    const createTables = `
      CREATE TABLE IF NOT EXISTS task_executions (
        id TEXT PRIMARY KEY,
        request TEXT NOT NULL,
        response TEXT,
        dryRunResult TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'dry-run')),
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        error TEXT,
        isDryRun INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        inputFile TEXT NOT NULL,
        outputFile TEXT,
        isDryRun INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        lastRun TEXT,
        nextRun TEXT
      );

      CREATE TABLE IF NOT EXISTS service_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_task_executions_status ON task_executions(status);
      CREATE INDEX IF NOT EXISTS idx_task_executions_created ON task_executions(createdAt);
      CREATE INDEX IF NOT EXISTS idx_task_executions_dry_run ON task_executions(isDryRun);
      CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_active ON scheduled_tasks(isActive);
      CREATE INDEX IF NOT EXISTS idx_service_logs_timestamp ON service_logs(timestamp);
    `;

    this.db.exec(createTables);
  }

  async saveTaskExecution(
    execution: Omit<TaskExecution, 'id' | 'createdAt'>
  ): Promise<string> {
    const id = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO task_executions 
        (id, request, response, dryRunResult, status, createdAt, completedAt, error, isDryRun)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        [
          id,
          execution.request,
          execution.response,
          execution.dryRunResult,
          execution.status,
          createdAt,
          execution.completedAt,
          execution.error,
          execution.isDryRun ? 1 : 0,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(id);
          }
        }
      );

      stmt.finalize();
    });
  }

  async updateTaskExecution(
    id: string,
    updates: Partial<TaskExecution>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.response) {
      fields.push('response = ?');
      values.push(updates.response);
    }
    if (updates.dryRunResult) {
      fields.push('dryRunResult = ?');
      values.push(updates.dryRunResult);
    }
    if (updates.completedAt) {
      fields.push('completedAt = ?');
      values.push(updates.completedAt);
    }
    if (updates.error) {
      fields.push('error = ?');
      values.push(updates.error);
    }

    if (fields.length === 0) return;

    values.push(id);

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE task_executions 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(values, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

      stmt.finalize();
    });
  }

  async getTaskExecutions(
    limit: number = 100,
    offset: number = 0
  ): Promise<TaskExecution[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT * FROM task_executions 
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
      `,
        [limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as TaskExecution[]);
          }
        }
      );
    });
  }

  async getTaskMetrics(): Promise<TaskMetrics> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successfulTasks,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedTasks,
          SUM(CASE WHEN isDryRun = 1 THEN 1 ELSE 0 END) as dryRunTasks,
          MAX(createdAt) as lastExecution
        FROM task_executions
      `,
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              totalTasks: row.totalTasks || 0,
              successfulTasks: row.successfulTasks || 0,
              failedTasks: row.failedTasks || 0,
              dryRunTasks: row.dryRunTasks || 0,
              totalCost: 0, // Will be calculated from response data
              totalTokens: 0, // Will be calculated from response data
              averageResponseTime: 0, // Will be calculated from timestamps
              lastExecution: row.lastExecution,
            });
          }
        }
      );
    });
  }

  async saveScheduledTask(
    task: Omit<any, 'id' | 'createdAt'>
  ): Promise<string> {
    const id = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO scheduled_tasks 
        (id, name, schedule, inputFile, outputFile, isDryRun, isActive, createdAt, lastRun, nextRun)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        [
          id,
          (task as any).name,
          (task as any).schedule,
          (task as any).inputFile,
          (task as any).outputFile,
          (task as any).isDryRun ? 1 : 0,
          (task as any).isActive ? 1 : 0,
          createdAt,
          (task as any).lastRun,
          (task as any).nextRun,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(id);
          }
        }
      );

      stmt.finalize();
    });
  }

  async getScheduledTasks(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT * FROM scheduled_tasks 
        WHERE isActive = 1
        ORDER BY createdAt DESC
      `,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async logServiceEvent(
    level: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO service_logs (level, message, metadata, timestamp)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        [
          level,
          message,
          metadata ? JSON.stringify(metadata) : null,
          new Date().toISOString(),
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );

      stmt.finalize();
    });
  }

  async getServiceLogs(limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT * FROM service_logs 
        ORDER BY timestamp DESC 
        LIMIT ?
      `,
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  close(): void {
    this.db.close();
  }
}
