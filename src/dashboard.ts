import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import * as fs from 'fs';
import helmet from 'helmet';
import { Server, createServer as createHttpServer } from 'http';
import {
  Server as HttpsServer,
  createServer as createHttpsServer,
} from 'https';
import * as path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { Database } from './database/database';
import { Logger } from './logger';
import { GPTTaskService } from './service';

class DashboardServer {
  public app: express.Application;
  private server: Server | HttpsServer | null = null;
  private wss!: WebSocketServer;
  private database: Database;
  private logger: Logger;
  private gptService: GPTTaskService;
  private strictLimiter!: ReturnType<typeof rateLimit>;
  private isHttps: boolean = false;

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
    // Enhanced security headers with TLS 1.3 support
    this.app.use(
      helmet({
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'ws:'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        crossOriginEmbedderPolicy: false, // Disable for compatibility
      })
    );

    // CORS with secure defaults
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'https://localhost:3000',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        maxAge: 86400, // 24 hours
      })
    );

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Authentication middleware
    this.app.use('/api', (req, res, next) => {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;

      // Skip auth for health check
      if (req.path === '/health') {
        return next();
      }

      // Check for API key in environment or header
      const expectedApiKey = process.env.DASHBOARD_API_KEY || 'dev-api-key';

      if (apiKey && apiKey === expectedApiKey) {
        return next();
      }

      // Check for Bearer token
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === expectedApiKey) {
          return next();
        }
      }

      // Check for basic auth (username:password)
      if (authHeader && authHeader.startsWith('Basic ')) {
        const credentials = Buffer.from(
          authHeader.substring(6),
          'base64'
        ).toString();
        const [username, password] = credentials.split(':');
        const expectedUsername = process.env.DASHBOARD_USERNAME || 'admin';
        const expectedPassword = process.env.DASHBOARD_PASSWORD || 'admin';

        if (username === expectedUsername && password === expectedPassword) {
          return next();
        }
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'E_UNAUTHORIZED',
          message:
            'Authentication required. Provide API key, Bearer token, or Basic auth.',
          details:
            'Use X-API-Key header, Authorization: Bearer <token>, or Authorization: Basic <base64(username:password)>',
        },
      });
    });

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

    // Scheduled tasks - GET all with query parameters
    this.app.get('/api/scheduled-tasks', async (req, res) => {
      try {
        const limit =
          parseInt((req.query as Record<string, unknown>).limit as string) ||
          100;
        const offset =
          parseInt((req.query as Record<string, unknown>).offset as string) ||
          0;
        const active = (req.query as Record<string, unknown>).active;

        let tasks;
        if (active === 'true') {
          tasks = await this.database.getActiveScheduledTasks();
        } else if (active === 'false') {
          const allTasks = await this.database.getScheduledTasks();
          tasks = allTasks.filter(
            (task: Record<string, unknown>) => !task.isActive
          );
        } else {
          tasks = await this.database.getScheduledTasks();
        }

        // Apply pagination
        const paginatedTasks = tasks.slice(offset, offset + limit);

        res.json({
          success: true,
          data: paginatedTasks,
          pagination: {
            limit,
            offset,
            total: tasks.length,
            hasMore: offset + limit < tasks.length,
          },
        });
      } catch (error) {
        console.error('Failed to get scheduled tasks:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'E_DATABASE_ERROR',
            message: 'Failed to get scheduled tasks',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    });

    // Scheduled tasks - GET specific task by ID
    this.app.get('/api/scheduled-tasks/:id', async (req, res) => {
      try {
        const task = await this.database.getScheduledTask(req.params.id);
        if (!task) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'E_TASK_NOT_FOUND',
              message: 'Scheduled task not found',
            },
          });
        }

        return res.json({
          success: true,
          data: task,
        });
      } catch (error) {
        console.error('Failed to get scheduled task:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'E_DATABASE_ERROR',
            message: 'Failed to get scheduled task',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    });

    // Scheduled tasks - POST create new task
    this.app.post(
      '/api/scheduled-tasks',
      this.strictLimiter,
      async (req, res) => {
        try {
          // Validate required fields
          const { name, schedule, inputFile, outputFile, isDryRun, isActive } =
            req.body;

          if (!name || !schedule || !inputFile) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'E_INVALID_INPUT',
                message: 'Missing required fields: name, schedule, inputFile',
              },
            });
          }

          const task = {
            name,
            schedule,
            inputFile,
            outputFile: outputFile || null,
            isDryRun: Boolean(isDryRun),
            isActive: isActive !== undefined ? Boolean(isActive) : true,
          };

          const taskId = await this.gptService.addScheduledTask(task);
          return res.status(201).json({
            success: true,
            data: { id: taskId },
            message: 'Scheduled task created successfully',
          });
        } catch (error) {
          console.error('Failed to create scheduled task:', error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'E_DATABASE_ERROR',
              message: 'Failed to create scheduled task',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    );

    // Scheduled tasks - PUT update existing task
    this.app.put(
      '/api/scheduled-tasks/:id',
      this.strictLimiter,
      async (req, res) => {
        try {
          const taskId = req.params.id;

          // Check if task exists
          const existingTask = await this.database.getScheduledTask(taskId);
          if (!existingTask) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'E_TASK_NOT_FOUND',
                message: 'Scheduled task not found',
              },
            });
          }

          const { name, schedule, inputFile, outputFile, isDryRun, isActive } =
            req.body;

          const updateData: Record<string, unknown> = {};
          if (name !== undefined) updateData.name = name;
          if (schedule !== undefined) updateData.schedule = schedule;
          if (inputFile !== undefined) updateData.inputFile = inputFile;
          if (outputFile !== undefined) updateData.outputFile = outputFile;
          if (isDryRun !== undefined) updateData.isDryRun = Boolean(isDryRun);
          if (isActive !== undefined) updateData.isActive = Boolean(isActive);

          await this.database.updateScheduledTask(taskId, updateData);

          return res.json({
            success: true,
            message: 'Scheduled task updated successfully',
          });
        } catch (error) {
          console.error('Failed to update scheduled task:', error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'E_DATABASE_ERROR',
              message: 'Failed to update scheduled task',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    );

    // Scheduled tasks - DELETE task
    this.app.delete(
      '/api/scheduled-tasks/:id',
      this.strictLimiter,
      async (req, res) => {
        try {
          const taskId = req.params.id;

          // Check if task exists
          const existingTask = await this.database.getScheduledTask(taskId);
          if (!existingTask) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'E_TASK_NOT_FOUND',
                message: 'Scheduled task not found',
              },
            });
          }

          await this.gptService.removeScheduledTask(taskId);
          return res.json({
            success: true,
            message: 'Scheduled task removed successfully',
          });
        } catch (error) {
          console.error('Failed to remove scheduled task:', error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'E_DATABASE_ERROR',
              message: 'Failed to remove scheduled task',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    );

    // Scheduled tasks - PATCH enable task
    this.app.patch(
      '/api/scheduled-tasks/:id/enable',
      this.strictLimiter,
      async (req, res) => {
        try {
          const taskId = req.params.id;

          // Check if task exists
          const existingTask = await this.database.getScheduledTask(taskId);
          if (!existingTask) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'E_TASK_NOT_FOUND',
                message: 'Scheduled task not found',
              },
            });
          }

          await this.database.enableScheduledTask(taskId);
          await this.gptService.enableScheduledTask(taskId);
          return res.json({
            success: true,
            message: 'Scheduled task enabled successfully',
          });
        } catch (error) {
          console.error('Failed to enable scheduled task:', error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'E_DATABASE_ERROR',
              message: 'Failed to enable scheduled task',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    );

    // Scheduled tasks - PATCH disable task
    this.app.patch(
      '/api/scheduled-tasks/:id/disable',
      this.strictLimiter,
      async (req, res) => {
        try {
          const taskId = req.params.id;

          // Check if task exists
          const existingTask = await this.database.getScheduledTask(taskId);
          if (!existingTask) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'E_TASK_NOT_FOUND',
                message: 'Scheduled task not found',
              },
            });
          }

          await this.database.disableScheduledTask(taskId);
          await this.gptService.disableScheduledTask(taskId);
          return res.json({
            success: true,
            message: 'Scheduled task disabled successfully',
          });
        } catch (error) {
          console.error('Failed to disable scheduled task:', error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'E_DATABASE_ERROR',
              message: 'Failed to disable scheduled task',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    );

    // Scheduled tasks - GET next run times
    this.app.get('/api/scheduled-tasks/next-runs', async (req, res) => {
      try {
        const limit =
          parseInt((req.query as Record<string, unknown>).limit as string) || 5;
        const tasks = await this.database.getActiveScheduledTasks();

        const nextRuns = [];

        for (const task of tasks) {
          try {
            // Import getNextRunTimes dynamically to avoid circular dependencies
            const { getNextRunTimes } = await import(
              './utils/schedule-validator'
            );
            const taskData = task as Record<string, unknown>;
            const runs = getNextRunTimes(taskData.schedule as string, limit);

            nextRuns.push({
              taskId: taskData.id,
              taskName: taskData.name,
              schedule: taskData.schedule,
              nextRuns: runs.map((date) => date.toISOString()),
            });
          } catch (error) {
            // If we can't calculate next runs for a task, include it with an error
            const taskData = task as Record<string, unknown>;
            nextRuns.push({
              taskId: taskData.id,
              taskName: taskData.name,
              schedule: taskData.schedule,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to calculate next runs',
            });
          }
        }

        return res.json({
          success: true,
          data: nextRuns,
        });
      } catch (error) {
        console.error('Failed to get next run times:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'E_DATABASE_ERROR',
            message: 'Failed to get next run times',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    });

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

    // Serve Next.js frontend for all non-API routes
    if (process.env.NODE_ENV !== 'test') {
      this.app.get('*', (req, res) => {
        // Redirect to Next.js dev server if running
        if (req.path !== '/api' && !req.path.startsWith('/api/')) {
          // Strict path mapping to prevent open redirect vulnerabilities
          const pathMapping: Record<string, string> = {
            '/': '/',
            '/dashboard': '/dashboard',
            '/settings': '/settings',
            '/tasks': '/tasks',
            '/reports': '/reports',
          };

          // Use strict mapping - only redirect to predefined paths
          const targetPath = pathMapping[req.path] || '/';
          res.redirect('http://localhost:3001' + targetPath);
        } else {
          res.status(404).json({ error: 'Not found' });
        }
      });
    }
  }

  private setupWebSocket(): void {
    // Skip WebSocket setup during testing
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const wsPort = this.isHttps ? 8082 : 8081; // Use WSS port if HTTPS is enabled
    const wsOptions: Record<string, unknown> = { port: wsPort };

    // Configure WSS if HTTPS is enabled
    if (this.isHttps) {
      const sslKeyPath = process.env.SSL_KEY_PATH;
      const sslCertPath = process.env.SSL_CERT_PATH;
      const sslCaPath = process.env.SSL_CA_PATH;

      if (
        sslKeyPath &&
        sslCertPath &&
        fs.existsSync(sslKeyPath) &&
        fs.existsSync(sslCertPath)
      ) {
        wsOptions.server = createHttpsServer({
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath),
          ca:
            sslCaPath && fs.existsSync(sslCaPath)
              ? fs.readFileSync(sslCaPath)
              : undefined,
          secureProtocol: 'TLSv1_3_method',
          ciphers: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_128_GCM_SHA256',
            '!aNULL',
            '!eNULL',
            '!EXPORT',
            '!DES',
            '!RC4',
            '!MD5',
            '!PSK',
            '!SRP',
            '!CAMELLIA',
          ].join(':'),
          honorCipherOrder: true,
          minVersion: 'TLSv1.3',
          maxVersion: 'TLSv1.3',
        });
      }
    }

    this.wss = new WebSocketServer(wsOptions);

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
    const httpsPort = process.env.HTTPS_PORT
      ? parseInt(process.env.HTTPS_PORT)
      : port + 1;

    // Check for SSL certificates
    const sslKeyPath = process.env.SSL_KEY_PATH;
    const sslCertPath = process.env.SSL_CERT_PATH;
    const sslCaPath = process.env.SSL_CA_PATH;

    if (
      sslKeyPath &&
      sslCertPath &&
      fs.existsSync(sslKeyPath) &&
      fs.existsSync(sslCertPath)
    ) {
      try {
        const httpsOptions: Record<string, unknown> = {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath),
          // TLS 1.3 configuration
          secureProtocol: 'TLSv1_3_method',
          ciphers: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_128_GCM_SHA256',
            '!aNULL',
            '!eNULL',
            '!EXPORT',
            '!DES',
            '!RC4',
            '!MD5',
            '!PSK',
            '!SRP',
            '!CAMELLIA',
          ].join(':'),
          honorCipherOrder: true,
          minVersion: 'TLSv1.3',
          maxVersion: 'TLSv1.3',
        };

        // Add CA certificate if provided
        if (sslCaPath && fs.existsSync(sslCaPath)) {
          httpsOptions.ca = fs.readFileSync(sslCaPath);
        }

        this.server = createHttpsServer(httpsOptions, this.app);
        this.isHttps = true;

        this.server!.listen(httpsPort, () => {
          this.logger.info(
            `🔒 HTTPS Dashboard server running on port ${httpsPort} (TLS 1.3)`
          );
          this.logger.info(
            `🔒 WebSocket server running on port ${httpsPort + 1} (WSS)`
          );
        });

        // Redirect HTTP to HTTPS
        const httpServer = createHttpServer((req, res) => {
          res.writeHead(301, {
            Location: `https://${req.headers.host}${req.url}`,
          });
          res.end();
        });

        httpServer.listen(port, () => {
          this.logger.info(
            `🔄 HTTP redirect server running on port ${port} (redirects to HTTPS)`
          );
        });
      } catch (error) {
        this.logger.error(
          'Failed to start HTTPS server, falling back to HTTP:',
          { error: error instanceof Error ? error.message : String(error) }
        );
        this.startHttpServer(port);
      }
    } else {
      this.logger.warn('SSL certificates not found, starting HTTP server only');
      this.logger.warn(
        'For production, set SSL_KEY_PATH and SSL_CERT_PATH environment variables'
      );
      this.startHttpServer(port);
    }
  }

  private startHttpServer(port: number): void {
    this.server = this.app.listen(port, () => {
      this.logger.info(`🌐 HTTP Dashboard server running on port ${port}`);
      this.logger.info(`🌐 WebSocket server running on port 8081`);
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
