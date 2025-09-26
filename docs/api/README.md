# API Documentation

## Overview

The GPT Task Runner provides a comprehensive REST API for task management, execution, and monitoring. The API follows RESTful conventions and includes detailed error handling, validation, and documentation.

## Base URL

```
http://localhost:3000/api/v1
```

All API endpoints are prefixed with `/api/v1`.

## Authentication

The API uses API key authentication. Include your API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

## Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {}
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Common Headers

- `Content-Type: application/json` - For requests with JSON body
- `Accept: application/json` - Expected response format
- `X-Request-ID: uuid` - Request correlation ID (optional)

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Default Limit**: 100 requests per minute
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Timestamp when limit resets

## Pagination

Paginated endpoints support the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (e.g., `createdAt`, `name`)
- `order`: Sort order (`asc` or `desc`, default: `desc`)

## Tasks API

### Create Task

**POST** `/tasks`

Create a new task for execution.

**Request Body:**

```json
{
  "id": "task-001",
  "prompt": "Write a haiku about programming",
  "messages": [
    {
      "role": "system",
      "content": "You are a creative assistant."
    },
    {
      "role": "user",
      "content": "Write a haiku about programming"
    }
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 1000,
  "metadata": {
    "category": "creative",
    "priority": "high"
  },
  "batchId": "batch-001",
  "idempotencyKey": "task-001-unique-key"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Task created successfully"
}
```

### Get Task

**GET** `/tasks/{id}`

Retrieve a specific task by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "prompt": "Write a haiku about programming",
    "status": "completed",
    "result": {
      "content": "Code flows like a stream...",
      "usage": {
        "promptTokens": 15,
        "completionTokens": 50,
        "totalTokens": 65
      }
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "completedAt": "2025-01-01T00:00:05.000Z"
  }
}
```

### List Tasks

**GET** `/tasks`

Retrieve a paginated list of tasks.

**Query Parameters:**

- `status`: Filter by status (`pending`, `running`, `completed`, `failed`)
- `batchId`: Filter by batch ID
- `createdAfter`: Filter tasks created after timestamp
- `createdBefore`: Filter tasks created before timestamp

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-001",
        "status": "completed",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Update Task

**PATCH** `/tasks/{id}`

Update an existing task.

**Request Body:**

```json
{
  "prompt": "Updated prompt text",
  "model": "gpt-4-turbo",
  "temperature": 0.8,
  "metadata": {
    "priority": "urgent"
  }
}
```

### Delete Task

**DELETE** `/tasks/{id}`

Delete a task and its associated data.

**Response:**

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Execute Task

**POST** `/tasks/{id}/execute`

Manually trigger task execution.

**Response:**

```json
{
  "success": true,
  "data": {
    "executionId": "exec-001",
    "status": "running"
  },
  "message": "Task execution started"
}
```

## Batch API

### Create Batch

**POST** `/batches`

Create a new batch of tasks.

**Request Body:**

```json
{
  "id": "batch-001",
  "name": "Creative Writing Tasks",
  "description": "A collection of creative writing tasks",
  "tasks": [
    {
      "id": "task-001",
      "prompt": "Write a haiku about programming"
    },
    {
      "id": "task-002",
      "prompt": "Write a short story about AI"
    }
  ],
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxConcurrency": 5
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "batch-001",
    "status": "pending",
    "taskCount": 2,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Get Batch

**GET** `/batches/{id}`

Retrieve batch details and status.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "batch-001",
    "name": "Creative Writing Tasks",
    "status": "completed",
    "progress": {
      "total": 2,
      "completed": 2,
      "failed": 0,
      "pending": 0
    },
    "tasks": [
      {
        "id": "task-001",
        "status": "completed",
        "result": "..."
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "completedAt": "2025-01-01T00:00:10.000Z"
  }
}
```

### Execute Batch

**POST** `/batches/{id}/execute`

Start batch execution.

**Response:**

```json
{
  "success": true,
  "data": {
    "executionId": "batch-exec-001",
    "status": "running"
  },
  "message": "Batch execution started"
}
```

## Scheduled Tasks API

### Create Scheduled Task

**POST** `/scheduled-tasks`

Create a new scheduled task.

**Request Body:**

```json
{
  "name": "Daily Report Generator",
  "schedule": "0 9 * * *",
  "inputFile": "/path/to/tasks.csv",
  "outputFile": "/path/to/results.csv",
  "isDryRun": false,
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxRetries": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sched-001",
    "name": "Daily Report Generator",
    "schedule": "0 9 * * *",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "nextRun": "2025-01-02T09:00:00.000Z"
  }
}
```

### List Scheduled Tasks

**GET** `/scheduled-tasks`

Retrieve all scheduled tasks.

**Query Parameters:**

- `isActive`: Filter by active status
- `name`: Filter by name (partial match)

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "sched-001",
        "name": "Daily Report Generator",
        "schedule": "0 9 * * *",
        "isActive": true,
        "lastRun": "2025-01-01T09:00:00.000Z",
        "nextRun": "2025-01-02T09:00:00.000Z"
      }
    ]
  }
}
```

### Update Scheduled Task

**PATCH** `/scheduled-tasks/{id}`

Update a scheduled task.

**Request Body:**

```json
{
  "name": "Updated Task Name",
  "schedule": "0 12 * * *",
  "isActive": false
}
```

### Enable/Disable Scheduled Task

**POST** `/scheduled-tasks/{id}/enable`

Enable a scheduled task.

**POST** `/scheduled-tasks/{id}/disable`

Disable a scheduled task.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sched-001",
    "isActive": true
  },
  "message": "Scheduled task enabled"
}
```

## Metrics API

### Get System Metrics

**GET** `/metrics`

Retrieve system performance metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 150,
      "completed": 145,
      "failed": 3,
      "pending": 2,
      "running": 0
    },
    "performance": {
      "averageExecutionTime": 2.5,
      "successRate": 0.98,
      "throughput": 15.2
    },
    "system": {
      "cpuUsage": 0.35,
      "memoryUsage": 0.67,
      "activeConnections": 12
    }
  }
}
```

### Get Task Metrics

**GET** `/metrics/tasks`

Retrieve detailed task execution metrics.

**Query Parameters:**

- `period`: Time period (`hour`, `day`, `week`, `month`)
- `status`: Filter by task status
- `model`: Filter by AI model

## Status API

### Get System Status

**GET** `/status`

Retrieve overall system health and status.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "services": {
      "database": "healthy",
      "openai": "healthy",
      "scheduler": "healthy"
    },
    "lastHealthCheck": "2025-01-01T00:00:00.000Z"
  }
}
```

### Get Service Status

**GET** `/status/services/{service}`

Retrieve detailed status for a specific service.

**Response:**

```json
{
  "success": true,
  "data": {
    "service": "database",
    "status": "healthy",
    "details": {
      "connectionCount": 5,
      "queryTime": 0.02,
      "lastError": null
    }
  }
}
```

## Error Codes

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid API key)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable

### Application Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `TASK_NOT_FOUND`: Task does not exist
- `BATCH_NOT_FOUND`: Batch does not exist
- `SCHEDULED_TASK_NOT_FOUND`: Scheduled task does not exist
- `INVALID_CRON_EXPRESSION`: Invalid cron schedule format
- `MODEL_NOT_SUPPORTED`: Unsupported AI model
- `QUOTA_EXCEEDED`: API quota exceeded
- `SERVICE_UNAVAILABLE`: External service unavailable

## Examples

### Execute Single Task

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "example-task",
    "prompt": "Explain quantum computing in simple terms",
    "model": "gpt-4",
    "temperature": 0.7
  }'
```

### Create Batch from CSV

```bash
curl -X POST http://localhost:3000/api/v1/batches \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "csv-batch",
    "name": "CSV Processing",
    "inputFile": "/path/to/tasks.csv",
    "config": {
      "model": "gpt-3.5-turbo",
      "maxConcurrency": 10
    }
  }'
```

### Get System Metrics

```bash
curl -X GET http://localhost:3000/api/v1/metrics \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## SDK Support

The API is designed to work with:

- JavaScript/TypeScript SDK
- Python SDK
- REST API clients
- Custom integrations

## Webhooks

Configure webhooks for real-time notifications:

```json
{
  "url": "https://your-app.com/webhook",
  "events": ["task.completed", "batch.finished", "system.alert"],
  "secret": "your-webhook-secret"
}
```

Available webhook events:

- `task.created`
- `task.started`
- `task.completed`
- `task.failed`
- `batch.created`
- `batch.started`
- `batch.completed`
- `batch.failed`
- `scheduled_task.executed`
- `system.alert`
