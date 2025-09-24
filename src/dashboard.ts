import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import { WebSocketServer } from 'ws';
import { Database } from './database/database';
import { Logger } from './logger';
import { GPTTaskService } from './service';

class DashboardServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private database: Database;
  private logger: Logger;
  private gptService: GPTTaskService;

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
    this.app.use(express.static(path.join(__dirname, '../dashboard/dist')));
  }

  private setupRoutes(): void {
    // API Routes
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Service status
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.gptService.getServiceStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get service status' });
      }
    });

    // Task executions
    this.app.get('/api/executions', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        const executions = await this.database.getTaskExecutions(limit, offset);
        res.json(executions);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get task executions' });
      }
    });

    // Task metrics
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const metrics = await this.database.getTaskMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // Scheduled tasks
    this.app.get('/api/scheduled-tasks', async (req, res) => {
      try {
        const tasks = await this.database.getScheduledTasks();
        res.json(tasks);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get scheduled tasks' });
      }
    });

    this.app.post('/api/scheduled-tasks', async (req, res) => {
      try {
        const taskId = await this.gptService.addScheduledTask(req.body);
        res.json({ id: taskId, message: 'Scheduled task created successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create scheduled task' });
      }
    });

    this.app.delete('/api/scheduled-tasks/:id', async (req, res) => {
      try {
        await this.gptService.removeScheduledTask(req.params.id);
        res.json({ message: 'Scheduled task removed successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to remove scheduled task' });
      }
    });

    // Service logs
    this.app.get('/api/logs', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 100;
        const logs = await this.database.getServiceLogs(limit);
        res.json(logs);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get service logs' });
      }
    });

    // Manual task execution
    this.app.post('/api/execute', async (req, res) => {
      try {
        const { inputFile, outputFile, isDryRun } = req.body;
        
        // This would trigger a manual execution
        // Implementation depends on your task execution logic
        res.json({ message: 'Task execution started', executionId: 'manual-exec-' + Date.now() });
      } catch (error) {
        res.status(500).json({ error: 'Failed to execute task' });
      }
    });

    // Serve React app for all other routes
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dashboard/dist/index.html'));
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ port: 8081 });
    
    this.wss.on('connection', (ws) => {
      this.logger.info('Dashboard client connected');
      
      // Send initial data
      this.sendInitialData(ws);
      
      ws.on('close', () => {
        this.logger.info('Dashboard client disconnected');
      });
    });
  }

  private async sendInitialData(ws: any): Promise<void> {
    try {
      const status = await this.gptService.getServiceStatus();
      const metrics = await this.database.getTaskMetrics();
      const executions = await this.database.getTaskExecutions(10);
      
      ws.send(JSON.stringify({
        type: 'initial_data',
        data: { status, metrics, executions }
      }));
    } catch (error) {
      this.logger.error('Failed to send initial data', { error });
    }
  }

  public broadcastUpdate(type: string, data: any): void {
    const message = JSON.stringify({ type, data });
    
    this.wss.clients.forEach((client) => {
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
      this.server.close();
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
