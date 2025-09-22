# Guardrails and Rate Limiting System

This document describes the guardrails and rate limiting system implemented for Librán Voice Forge to prevent runaway API costs and ensure fair usage.

## Overview

The system consists of two main components:

1. **Rate Limiting**: Controls the number of requests per time period
2. **Budget Guardrails**: Controls character usage and cost limits

## Features

### Rate Limiting

- **Per-user limits**: 10 requests per minute (configurable)
- **Global limits**: 60 requests per minute across all users (configurable)
- **Token bucket algorithm**: Allows bursts while preventing sustained high usage
- **Automatic cleanup**: Removes old user data to prevent memory leaks

### Budget Guardrails

- **Per-request limit**: Maximum characters per single request (default: 10,000)
- **Daily limit**: Maximum characters per day (default: 100,000)
- **Monthly limit**: Maximum characters per month (default: 1,000,000)
- **Cost tracking**: Optional cost limits based on character usage
- **Automatic reset**: Daily and monthly counters reset automatically

## Configuration

All limits are configurable via environment variables:

```bash
# Rate Limiting
MAX_REQUESTS_PER_MINUTE=10
MAX_REQUESTS_PER_HOUR=100
MAX_REQUESTS_PER_DAY=1000
RATE_LIMIT_BURST=10

# Budget Guardrails
MAX_CHARS_PER_REQUEST=10000
MAX_CHARS_PER_DAY=100000
MAX_CHARS_PER_MONTH=1000000
MAX_MONTHLY_COST_USD=50.00
COST_PER_THOUSAND_CHARS=0.002
```

## API Integration

The guardrails are automatically applied to:

- `/api/translate` - Translation API
- `/api/speak` - Text-to-speech API

### Response Headers

Successful responses include rate limit and budget information:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 2024-01-01T12:00:00.000Z
X-Budget-Remaining-Daily: 50000
X-Budget-Remaining-Monthly: 500000
```

### Error Responses

When limits are exceeded, the API returns HTTP 429 with detailed error information:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 60,
  "resetTime": "2024-01-01T12:00:00.000Z"
}
```

```json
{
  "error": "Budget exceeded",
  "message": "Daily character limit exceeded, try again tomorrow",
  "remainingDaily": 0,
  "remainingMonthly": 500000,
  "resetTime": "2024-01-01T12:00:00.000Z"
}
```

## Status Endpoint

Check current guardrails status:

```bash
GET /api/guardrails-status
```

Response:
```json
{
  "userId": "192.168.1.1",
  "status": {
    "rateLimiting": {
      "user": {
        "tokens": 5,
        "requestCount": 5
      },
      "global": {
        "tokens": 8,
        "requestCount": 12
      }
    },
    "budget": {
      "dailyChars": 25000,
      "monthlyChars": 125000,
      "totalCost": 0.25,
      "dailyResetTime": "2024-01-01T12:00:00.000Z",
      "monthlyResetTime": "2024-02-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T10:30:00.000Z"
}
```

## Testing

### Unit Tests

Run the guardrails unit tests:

```bash
npm run test:vitest:run -- test/unit/rate-limiter.test.ts
npm run test:vitest:run -- test/unit/budget-guardrails.test.ts
```

### Integration Tests

Run the integration tests:

```bash
npm run test:vitest:run -- test/integration/guardrails-api.integration.test.ts
```

### Load Testing

Test the guardrails with load testing:

```bash
# Start the development server
npm run dev

# In another terminal, run load tests
npm run test:load
```

The load test will:
1. Make 50 requests to test rate limiting
2. Make 50 requests with large text to test budget guardrails
3. Check the status endpoint
4. Display a summary of results

## Implementation Details

### Rate Limiter (`lib/rate-limiter.ts`)

- Implements token bucket algorithm
- Tracks per-user and global limits
- Automatic token refill based on time
- Memory-efficient with cleanup

### Budget Guardrails (`lib/budget-guardrails.ts`)

- Tracks character usage per user
- Enforces daily and monthly limits
- Optional cost tracking
- Automatic counter reset

### API Guardrails (`lib/api-guardrails.ts`)

- Middleware for applying guardrails
- Extracts user ID from request IP
- Records usage after successful requests
- Adds informative headers to responses

## Monitoring

The system logs all guardrails activity:

- Rate limit violations
- Budget limit violations
- Usage tracking
- Cleanup operations

Check the application logs for detailed information about guardrails behavior.

## Browser Compatibility

Rate limits and budget guardrails are server-side, so there are no browser-specific issues. The system works with all modern browsers and HTTP clients.

## Security Considerations

- User identification is currently based on IP address
- In production, consider using authenticated user IDs
- Rate limits help prevent abuse and DoS attacks
- Budget limits prevent runaway costs
- All limits are configurable without code changes
