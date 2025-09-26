# GPT Task Runner - API Documentation

## Overview
The GPT Task Runner provides a comprehensive REST API for managing tasks, monitoring system performance, and configuring scheduled operations.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging.gpt-task-runner.com/api`
- **Production**: `https://api.gpt-task-runner.com/api`

## Authentication
Currently, the API uses API key-based authentication for external services. Future versions will include user authentication.

```http
Authorization: Bearer YOUR_API_KEY
```

## API Endpoints

### System Status

#### GET /api/status
Get current system status and health information.

**Response:**
```json
{
  "isRunning": true,
  "scheduledTasks": 5,
  "metrics": {
    "totalTasks": 1250,
    "successfulTasks": 1180,
    "failedTasks": 70,
    "dryRunTasks": 0,
    "totalCost": 45.67,
    "totalTokens": 125000,
    "averageResponseTime": 1.23,
    "lastExecution": "2025-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - System status retrieved successfully
- `500 Internal Server Error` - System error

### Metrics

#### GET /api/metrics
Get detailed performance metrics and analytics.

**Query Parameters:**
- `period` (optional): Time period for metrics (`1h`, `24h`, `7d`, `30d`)
- `granularity` (optional): Data granularity (`minute`, `hour`, `day`)

**Response:**
```json
{
  "totalTasks": 1250,
  "successfulTasks": 1180,
  "failedTasks": 70,
  "dryRunTasks": 0,
  "totalCost": 45.67,
  "totalTokens": 125000,
  "averageResponseTime": 1.23,
  "lastExecution": "2025-01-15T10:30:00Z",
  "costBreakdown": {
    "gpt-3.5-turbo": 12.34,
    "gpt-4": 33.33
  },
  "timeSeriesData": [
    {
      "timestamp": "2025-01-15T10:00:00Z",
      "tasks": 50,
      "cost": 2.15,
      "averageResponseTime": 1.1
    }
  ]
}
```

### Scheduled Tasks

#### GET /api/scheduled-tasks
Get list of all scheduled tasks.

**Query Parameters:**
- `active` (optional): Filter by active status (`true`, `false`)
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "name": "Daily Report Generation",
      "schedule": "0 9 * * *",
      "inputFile": "/data/daily-tasks.csv",
      "outputFile": "/data/daily-results.csv",
      "isDryRun": false,
      "isActive": true,
      "createdAt": "2025-01-10T08:00:00Z",
      "lastRun": "2025-01-15T09:00:00Z",
      "nextRun": "2025-01-16T09:00:00Z"
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/scheduled-tasks
Create a new scheduled task.

**Request Body:**
```json
{
  "name": "Weekly Analysis",
  "schedule": "0 10 * * 1",
  "inputFile": "/data/weekly-tasks.csv",
  "outputFile": "/data/weekly-results.csv",
  "isDryRun": false,
  "isActive": true
}
```

**Response:**
```json
{
  "id": "task-456",
  "name": "Weekly Analysis",
  "schedule": "0 10 * * 1",
  "inputFile": "/data/weekly-tasks.csv",
  "outputFile": "/data/weekly-results.csv",
  "isDryRun": false,
  "isActive": true,
  "createdAt": "2025-01-15T10:30:00Z",
  "nextRun": "2025-01-20T10:00:00Z"
}
```

**Status Codes:**
- `201 Created` - Task created successfully
- `400 Bad Request` - Invalid request data
- `409 Conflict` - Task with same name already exists

#### GET /api/scheduled-tasks/:id
Get details of a specific scheduled task.

**Response:**
```json
{
  "id": "task-123",
  "name": "Daily Report Generation",
  "schedule": "0 9 * * *",
  "inputFile": "/data/daily-tasks.csv",
  "outputFile": "/data/daily-results.csv",
  "isDryRun": false,
  "isActive": true,
  "createdAt": "2025-01-10T08:00:00Z",
  "lastRun": "2025-01-15T09:00:00Z",
  "nextRun": "2025-01-16T09:00:00Z",
  "executionHistory": [
    {
      "timestamp": "2025-01-15T09:00:00Z",
      "status": "success",
      "tasksProcessed": 25,
      "duration": 45.2,
      "cost": 1.23
    }
  ]
}
```

#### PUT /api/scheduled-tasks/:id
Update an existing scheduled task.

**Request Body:**
```json
{
  "name": "Updated Daily Report",
  "schedule": "0 8 * * *",
  "isActive": false
}
```

**Response:**
```json
{
  "id": "task-123",
  "name": "Updated Daily Report",
  "schedule": "0 8 * * *",
  "inputFile": "/data/daily-tasks.csv",
  "outputFile": "/data/daily-results.csv",
  "isDryRun": false,
  "isActive": false,
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

#### DELETE /api/scheduled-tasks/:id
Delete a scheduled task.

**Response:**
```json
{
  "message": "Task deleted successfully",
  "id": "task-123"
}
```

**Status Codes:**
- `200 OK` - Task deleted successfully
- `404 Not Found` - Task not found

#### POST /api/scheduled-tasks/:id/enable
Enable a scheduled task.

**Response:**
```json
{
  "message": "Task enabled successfully",
  "id": "task-123",
  "nextRun": "2025-01-16T09:00:00Z"
}
```

#### POST /api/scheduled-tasks/:id/disable
Disable a scheduled task.

**Response:**
```json
{
  "message": "Task disabled successfully",
  "id": "task-123"
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "schedule",
      "reason": "Invalid cron expression"
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Rate Limiting
- **Default Limit**: 100 requests per minute per IP
- **Burst Limit**: 20 requests per second
- **Headers**: Rate limit information included in response headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Webhooks (Planned)
Future versions will support webhook notifications for:
- Task completion
- System alerts
- Scheduled task failures
- Performance thresholds

## SDK and Client Libraries (Planned)
- JavaScript/TypeScript SDK
- Python client library
- Go client library
- REST API collections for Postman/Insomnia

## OpenAPI Specification
A complete OpenAPI 3.0 specification is available at `/api/docs` (planned).

## Examples

### Creating a Daily Scheduled Task
```bash
curl -X POST http://localhost:3000/api/scheduled-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Customer Analysis",
    "schedule": "0 6 * * *",
    "inputFile": "/data/customer-tasks.csv",
    "outputFile": "/data/customer-results.csv",
    "isDryRun": false,
    "isActive": true
  }'
```

### Getting System Metrics
```bash
curl -X GET "http://localhost:3000/api/metrics?period=24h&granularity=hour" \
  -H "Accept: application/json"
```

### Disabling a Scheduled Task
```bash
curl -X POST http://localhost:3000/api/scheduled-tasks/task-123/disable \
  -H "Content-Type: application/json"
```

---

*Last Updated: September 26, 2025*
*Next Review: October 10, 2025*