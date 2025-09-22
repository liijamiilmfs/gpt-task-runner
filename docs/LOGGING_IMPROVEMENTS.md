# Enhanced Logging System

This document describes the improved logging system with color coding, better directory structure, and human-readable formats.

## 🎨 **Color Coding**

The console output now includes color coding for better readability:

- 🔴 **ERROR** - Red text for errors
- 🟡 **WARN** - Yellow text for warnings  
- 🔵 **INFO** - Cyan text for information
- 🟣 **HTTP** - Magenta text for API requests
- ⚫ **DEBUG** - Gray text for debug information
- 🟢 **SUCCESS** - Green text for success messages

## 📁 **Directory Structure**

Logs are now organized into specific subdirectories:

```
logs/
├── application/          # General application logs
│   └── application-YYYY-MM-DD.log
├── api/                  # API request/response logs
│   └── api-YYYY-MM-DD.log
├── translation/          # Translation operation logs
│   └── translation-YYYY-MM-DD.log
├── tts/                  # Text-to-speech logs
│   └── tts-YYYY-MM-DD.log
├── errors/               # Error logs only
│   └── error-YYYY-MM-DD.log
├── performance/          # Performance metrics
│   └── performance-YYYY-MM-DD.log
└── security/             # Security events
    └── security-YYYY-MM-DD.log
```

## 🚀 **Log Viewer Commands**

### **Basic Log Viewing**
```bash
# View recent logs from all types
npm run logs:view

# Follow logs in real-time
npm run logs:follow

# View last 100 lines
npm run logs:view -- --lines=100
```

### **Filtered Log Viewing**
```bash
# Follow API logs only
npm run logs:api

# Follow error logs only
npm run logs:error

# Follow translation logs only
npm run logs:translation

# Follow TTS logs only
npm run logs:tts
```

### **Advanced Filtering**
```bash
# Filter by specific text
npm run logs:view -- --filter="translation"

# Filter by log level
npm run logs:view -- --level=error

# Filter by type and level
npm run logs:view -- --type=api --level=error

# Show last 50 lines of API logs
npm run logs:view -- --type=api --lines=50
```

## 📊 **Log Types and Their Purpose**

### **Application Logs** (`logs/application/`)
- General application flow
- Service startup/shutdown
- Configuration changes
- System events

### **API Logs** (`logs/api/`)
- HTTP request/response details
- API endpoint access
- Request timing and status codes
- API error responses

### **Translation Logs** (`logs/translation/`)
- Translation operations
- Dictionary lookups
- Unknown token collection
- Translation confidence scores

### **TTS Logs** (`logs/tts/`)
- Text-to-speech generation
- Voice synthesis details
- Audio file creation
- TTS cache hits/misses

### **Error Logs** (`logs/errors/`)
- All error-level messages
- Stack traces
- Error context and correlation IDs
- Critical system failures

### **Performance Logs** (`logs/performance/`)
- Response time metrics
- Memory usage
- Cache performance
- Database query times

### **Security Logs** (`logs/security/`)
- Authentication events
- Authorization failures
- Suspicious activity
- Security policy violations

## 🔧 **Log Format Examples**

### **Console Output (Human-Readable)**
```
2024-01-21 18:51:32 [libran-voice-forge] [req_abc123] [api_request] [INFO] API Request
{
  "method": "POST",
  "url": "/api/translate",
  "requestId": "req_abc123"
}

2024-01-21 18:51:33 [libran-voice-forge] [translation] [INFO] Translation completed
{
  "textLength": 25,
  "variant": "ancient",
  "confidence": 0.95,
  "duration": 150
}
```

### **File Output (JSON)**
```json
{
  "timestamp": "2024-01-21T18:51:32.874Z",
  "level": "info",
  "message": "API Request",
  "service": "libran-voice-forge",
  "environment": "development",
  "type": "api_request",
  "correlationId": "req_abc123",
  "method": "POST",
  "url": "/api/translate"
}
```

## 🎯 **Usage Examples**

### **Development Debugging**
```bash
# Follow all logs during development
npm run logs:follow

# Watch for translation issues
npm run logs:translation

# Monitor API performance
npm run logs:api
```

### **Production Monitoring**
```bash
# Check for errors
npm run logs:error -- --lines=100

# Monitor TTS usage
npm run logs:tts -- --lines=50

# Check security events
npm run logs:view -- --type=security --level=warn
```

### **Troubleshooting**
```bash
# Find specific error
npm run logs:view -- --filter="OpenAI" --level=error

# Check API failures
npm run logs:api -- --filter="500"

# Monitor translation confidence
npm run logs:translation -- --filter="confidence"
```

## 🔍 **Log Analysis Tips**

### **Finding Issues**
1. **Start with error logs**: `npm run logs:error`
2. **Check API logs**: `npm run logs:api`
3. **Look for patterns**: Use `--filter` to search for specific terms
4. **Follow real-time**: Use `--follow` to see issues as they happen

### **Performance Analysis**
1. **Check performance logs**: `npm run logs:view -- --type=performance`
2. **Monitor API response times**: Look for high `responseTime` values
3. **Check TTS cache hits**: Look for `cacheHit: true/false` in TTS logs

### **Security Monitoring**
1. **Check security logs**: `npm run logs:view -- --type=security`
2. **Look for failed authentications**: Filter for `auth` or `security` events
3. **Monitor API access patterns**: Check for unusual request patterns

## 📈 **Benefits of New System**

1. **Better Organization** - Logs are separated by purpose
2. **Color Coding** - Easy to spot errors and important events
3. **Human-Readable** - Console output is formatted for humans
4. **Filtering** - Easy to find specific log entries
5. **Real-time Monitoring** - Follow logs as they happen
6. **Structured Data** - JSON format for programmatic analysis
7. **Correlation IDs** - Track requests across multiple log files

## 🚀 **Quick Start**

```bash
# View recent logs
npm run logs:view

# Follow all logs
npm run logs:follow

# Watch API logs
npm run logs:api

# Check for errors
npm run logs:error
```

The enhanced logging system makes debugging and monitoring much more efficient and user-friendly!
