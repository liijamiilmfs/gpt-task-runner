# Librán Voice Forge Logging System

This document describes the comprehensive logging system implemented for Librán Voice Forge, including error taxonomy, correlation IDs, and log file management.

## Overview

The logging system provides:
- **Structured logging** with JSON format for easy parsing
- **Correlation IDs** for request tracking across services
- **Error taxonomy** with standardized error codes and user-friendly messages
- **Sensitive data sanitization** to protect API keys and credentials
- **Log rotation** with configurable sizes and retention periods
- **Multiple log files** for different purposes and severity levels

## Log Files

### Node.js Application Logs

| File | Purpose | Max Size | Retention | Location |
|------|---------|----------|-----------|----------|
| `application-YYYY-MM-DD.log` | Main application logs | 500MB (dev) / 200MB (prod) | 7d (dev) / 30d (prod) | `logs/` |
| `error-YYYY-MM-DD.log` | Error-only logs | 200MB (dev) / 100MB (prod) | 14d (dev) / 60d (prod) | `logs/` |

### Python Dictionary Importer Logs

| File | Purpose | Max Size | Retention | Location |
|------|---------|----------|-----------|----------|
| `dict_importer.log` | Main importer logs | 50MB | 30d | `logs/` |
| `dict_importer_error.log` | Error-only logs | 50MB | 60d | `logs/` |

## Error Taxonomy System

### Error Categories

- **VALIDATION** (400) - Input validation errors
- **AUTHENTICATION** (401) - Authentication failures
- **AUTHORIZATION** (403) - Authorization failures
- **RATE_LIMIT** (429) - Rate limiting errors
- **BUDGET_LIMIT** (429) - Budget/usage limit errors
- **TRANSLATION** (500) - Translation service errors
- **TTS** (500) - Text-to-speech errors
- **CACHE** (500) - Caching system errors
- **EXTERNAL_API** (500) - External API errors (OpenAI, etc.)
- **INTERNAL** (500) - Internal server errors
- **NETWORK** (500) - Network connectivity errors
- **TIMEOUT** (500) - Request timeout errors

### Error Severity Levels

- **LOW** - Informational errors, minor issues
- **MEDIUM** - Warning-level errors, recoverable issues
- **HIGH** - Error-level issues, service degradation
- **CRITICAL** - Critical errors, service unavailable

### Error Codes

#### Validation Errors
- `VALIDATION_MISSING_TEXT` - Text input is required
- `VALIDATION_INVALID_TEXT` - Invalid text format
- `VALIDATION_INVALID_VARIANT` - Invalid language variant
- `VALIDATION_INVALID_VOICE` - Invalid voice parameter
- `VALIDATION_INVALID_FORMAT` - Invalid audio format
- `VALIDATION_TEXT_TOO_LONG` - Text exceeds length limit
- `VALIDATION_EMPTY_INPUT` - Empty input provided

#### Translation Errors
- `TRANSLATION_FAILED` - General translation failure
- `TRANSLATION_DICTIONARY_LOAD` - Dictionary loading failed
- `TRANSLATION_TOKENIZATION` - Text tokenization failed

#### TTS Errors
- `TTS_GENERATION_FAILED` - General TTS generation failure
- `TTS_OPENAI_ERROR` - OpenAI TTS service error
- `TTS_CACHE_ERROR` - TTS cache operation failed
- `TTS_AUDIO_PROCESSING` - Audio processing failed

#### Rate Limiting
- `RATE_LIMIT_EXCEEDED` - General rate limit exceeded
- `RATE_LIMIT_DAILY_EXCEEDED` - Daily rate limit exceeded
- `RATE_LIMIT_MONTHLY_EXCEEDED` - Monthly rate limit exceeded

#### Budget Limits
- `BUDGET_DAILY_EXCEEDED` - Daily budget limit exceeded
- `BUDGET_MONTHLY_EXCEEDED` - Monthly budget limit exceeded
- `BUDGET_CHARACTER_LIMIT` - Character limit exceeded

#### External API Errors
- `OPENAI_API_ERROR` - General OpenAI API error
- `OPENAI_QUOTA_EXCEEDED` - OpenAI quota exceeded
- `OPENAI_RATE_LIMIT` - OpenAI rate limit exceeded
- `OPENAI_AUTHENTICATION` - OpenAI authentication failed

#### Internal Errors
- `INTERNAL_SERVER_ERROR` - General internal server error
- `INTERNAL_CACHE_ERROR` - Cache operation failed
- `INTERNAL_METRICS_ERROR` - Metrics collection failed

#### Network Errors
- `NETWORK_TIMEOUT` - Network timeout
- `NETWORK_CONNECTION` - Network connection error
- `NETWORK_DNS` - DNS resolution failed

## Correlation IDs

Every request is assigned a unique correlation ID in the format:
```
req_{timestamp}_{random_string}
```

Example: `req_1703123456789_abc123def456`

Correlation IDs are used to:
- Track requests across multiple services
- Correlate errors with specific requests
- Debug issues by following request flow
- Monitor performance and error patterns

## Log Format

### Application Logs
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "Translation completed",
  "service": "libran-voice-forge",
  "environment": "production",
  "type": "translation",
  "correlationId": "req_1703123456789_abc123def456",
  "textLength": 25,
  "variant": "ancient",
  "confidence": 0.95,
  "duration": 150
}
```

### Error Logs
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "error",
  "message": "Error Taxonomy",
  "service": "libran-voice-forge",
  "environment": "production",
  "type": "error_taxonomy",
  "correlationId": "req_1703123456789_abc123def456",
  "errorCode": "TRANSLATION_FAILED",
  "userMessage": "Translation failed. Please try again or contact support if the issue persists",
  "category": "translation",
  "severity": "high",
  "retryable": true
}
```

## Sensitive Data Sanitization

The logging system automatically redacts sensitive information:

- API keys (OpenAI, etc.)
- Passwords and secrets
- Authentication tokens
- Email addresses
- Credit card numbers
- Social Security Numbers

Redacted data appears as `[REDACTED]` in logs.

## Log Rotation

### Node.js Logs
- **Daily rotation** based on date pattern
- **Size-based rotation** when max size is reached
- **Automatic compression** of rotated files
- **Configurable retention** periods

### Python Logs
- **Size-based rotation** when max size is reached
- **Configurable backup count** for retention
- **Automatic compression** of rotated files

## Monitoring and Alerting

### Error Monitoring
- Track error rates by category and severity
- Monitor correlation IDs for request tracing
- Alert on critical errors or high error rates

### Performance Monitoring
- Track request response times
- Monitor cache hit rates
- Track translation and TTS generation times

### Usage Monitoring
- Track daily/monthly usage patterns
- Monitor rate limit and budget limit hits
- Track unknown token collection

## Configuration

### Environment Variables
```bash
LOG_LEVEL=info                    # Log level (debug, info, warn, error)
NODE_ENV=production              # Environment (affects log sizes and retention)
```

### Log Levels
- **DEBUG** - Detailed debugging information
- **INFO** - General information about application flow
- **WARN** - Warning messages for potential issues
- **ERROR** - Error messages for failures

## Best Practices

### For Developers
1. Always include correlation IDs in log messages
2. Use structured logging with consistent field names
3. Include relevant context in error messages
4. Use appropriate log levels
5. Avoid logging sensitive data

### For Operations
1. Monitor error rates and patterns
2. Set up alerts for critical errors
3. Regularly review log retention policies
4. Monitor disk space usage
5. Use correlation IDs for debugging

### For Support
1. Use correlation IDs to trace user issues
2. Check error taxonomy for user-friendly messages
3. Monitor retry patterns and success rates
4. Use log aggregation tools for analysis

## Troubleshooting

### Common Issues

1. **Log files too large**
   - Check if log rotation is working
   - Verify max size settings
   - Consider increasing retention periods

2. **Missing correlation IDs**
   - Ensure all API routes use ErrorTaxonomy.generateCorrelationId()
   - Check that correlation IDs are passed through all log calls

3. **Sensitive data in logs**
   - Verify sensitive data patterns are up to date
   - Check that sanitization is working correctly

4. **High error rates**
   - Use correlation IDs to trace specific requests
   - Check error taxonomy for patterns
   - Monitor external API status

## Future Enhancements

- **Log aggregation** with tools like ELK stack
- **Real-time monitoring** dashboards
- **Automated alerting** based on error patterns
- **Log analysis** for usage insights
- **Performance metrics** integration
