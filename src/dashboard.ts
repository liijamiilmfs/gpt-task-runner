import express from 'express';
import { Server } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import rateLimit from 'express-rate-limit';
import { WebSocketServer, WebSocket } from 'ws';
import { Database } from './database/database';
import { Logger } from './logger';
import { GPTTaskService } from './service';

class DashboardServer {
  private app: express.Application;
  private server: Server | null = null;
  private wss!: WebSocketServer;
  private database: Database;
  private logger: Logger;
  private gptService: GPTTaskService;
  private strictLimiter!: ReturnType<typeof rateLimit>;

  constructor() {
    this.app = express();
    this.database = new Database();
    this.logger = new Logger('info');
    this.gptService = new GPTTaskService();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());

    // Global rate limiter for all requests
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // max 1000 requests per windowMs
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: 'Too many requests from this IP, please try again later.',
    });

    // Strict rate limiter for API endpoints
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // max 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many API requests from this IP, please try again later.',
    });

    // Very strict rate limiter for sensitive operations
    this.strictLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // max 20 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message:
        'Too many sensitive operations from this IP, please try again later.',
    });

    this.app.use(globalLimiter);
    this.app.use('/api', apiLimiter);
    this.app.use(express.static(path.join(__dirname, '../dashboard/dist')));
  }

  private setupRoutes(): void {
    // API Routes
    this.app.get('/api/health', (_req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Service status
    this.app.get('/api/status', async (_req, res) => {
      try {
        const status = await this.gptService.getServiceStatus();
        res.json(status);
      } catch (error) {
        console.error('Failed to get service status:', error);
        res.status(500).json({ error: 'Failed to get service status' });
      }
    });

    // Task executions
    this.app.get('/api/executions', async (_req, res) => {
      try {
        const limit =
          parseInt((_req.query as Record<string, unknown>).limit as string) ||
          100;
        const offset =
          parseInt((_req.query as Record<string, unknown>).offset as string) ||
          0;
        const executions = await this.database.getTaskExecutions(limit, offset);
        res.json(executions);
      } catch (error) {
        console.error('Failed to get task executions:', error);
        res.status(500).json({ error: 'Failed to get task executions' });
      }
    });

    // Task metrics
    this.app.get('/api/metrics', async (_req, res) => {
      try {
        const metrics = await this.database.getTaskMetrics();
        res.json(metrics);
      } catch (error) {
        console.error('Failed to get metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // Scheduled tasks
    this.app.get('/api/scheduled-tasks', async (_req, res) => {
      try {
        const tasks = await this.database.getScheduledTasks();
        res.json(tasks);
      } catch (error) {
        console.error('Failed to get scheduled tasks:', error);
        res.status(500).json({ error: 'Failed to get scheduled tasks' });
      }
    });

    this.app.post(
      '/api/scheduled-tasks',
      this.strictLimiter,
      async (req, res) => {
        try {
          const taskId = await this.gptService.addScheduledTask(req.body);
          res.json({
            id: taskId,
            message: 'Scheduled task created successfully',
          });
        } catch (error) {
          console.error('Failed to create scheduled task:', error);
          res.status(500).json({ error: 'Failed to create scheduled task' });
        }
      }
    );

    this.app.delete(
      '/api/scheduled-tasks/:id',
      this.strictLimiter,
      async (req, res) => {
        try {
          await this.gptService.removeScheduledTask(req.params.id);
          res.json({ message: 'Scheduled task removed successfully' });
        } catch (error) {
          console.error('Failed to remove scheduled task:', error);
          res.status(500).json({ error: 'Failed to remove scheduled task' });
        }
      }
    );

    // Service logs
    this.app.get('/api/logs', async (_req, res) => {
      try {
        const limit =
          parseInt((_req.query as Record<string, unknown>).limit as string) ||
          100;
        const logs = await this.database.getServiceLogs(limit);
        res.json(logs);
      } catch (error) {
        console.error('Failed to get service logs:', error);
        res.status(500).json({ error: 'Failed to get service logs' });
      }
    });

    // Manual task execution - very sensitive operation
    this.app.post('/api/execute', this.strictLimiter, async (req, res) => {
      try {
        const { inputFile, outputFile, isDryRun } = req.body as Record<
          string,
          unknown
        >;
        console.log('Manual execution request:', {
          inputFile,
          outputFile,
          isDryRun,
        });

        // This would trigger a manual execution
        // Implementation depends on your task execution logic
        res.json({
          message: 'Task execution started',
          executionId: 'manual-exec-' + Date.now(),
        });
      } catch (error) {
        console.error('Failed to execute task:', error);
        res.status(500).json({ error: 'Failed to execute task' });
      }
    });

    // Serve React app for all other routes - use global limiter
    this.app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../dashboard/dist/index.html'));
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ port: 8081 });

    this.wss.on('connection', (ws: WebSocket) => {
      this.logger.info('Dashboard client connected');

      // Send initial data
      this.sendInitialData(ws);

      ws.on('close', () => {
        this.logger.info('Dashboard client disconnected');
      });
    });
  }

  private async sendInitialData(ws: WebSocket): Promise<void> {
    try {
      const status = await this.gptService.getServiceStatus();
      const metrics = await this.database.getTaskMetrics();
      const executions = await this.database.getTaskExecutions(10);

      ws.send(
        JSON.stringify({
          type: 'initial_data',
          data: { status, metrics, executions },
        })
      );
    } catch (error) {
      this.logger.error('Failed to send initial data', { error });
    }
  }

  public broadcastUpdate(type: string, data: unknown): void {
    const message = JSON.stringify({ type, data });

    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }

  public start(port: number = 3000): void {
    this.server = this.app.listen(port, () => {
      this.logger.info(`Dashboard server running on port ${port}`);
      this.logger.info(`WebSocket server running on port 8081`);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server?.close();
    }
    if (this.wss) {
      this.wss.close();
    }
    this.database.close();
  }
}

// If this file is run directly, start the dashboard
if (require.main === module) {
  const dashboard = new DashboardServer();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down dashboard...');
    dashboard.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down dashboard...');
    dashboard.stop();
    process.exit(0);
  });

  dashboard.start();
}

export { DashboardServer };
