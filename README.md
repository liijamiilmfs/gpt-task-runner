# GPT Task Runner

[![CI/CD Pipeline](https://github.com/Rule-0-Softworks/gpt-task-runner/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/Rule-0-Softworks/gpt-task-runner/actions)
[![Security Scans](https://github.com/Rule-0-Softworks/gpt-task-runner/workflows/Security%20Scans/badge.svg)](https://github.com/Rule-0-Softworks/gpt-task-runner/actions)
[![Coverage](https://codecov.io/gh/Rule-0-Softworks/gpt-task-runner/branch/dev/graph/badge.svg)](https://codecov.io/gh/Rule-0-Softworks/gpt-task-runner)

> **Enterprise-grade AI task automation platform** with intelligent scheduling, secure API management, and comprehensive monitoring capabilities.

## 🚀 Overview

GPT Task Runner is a production-ready automation platform that leverages GPT models for intelligent task execution, workflow management, and enterprise-grade security. Built with TypeScript and modern web technologies, it provides a robust foundation for AI-powered automation at scale.

## ✨ Key Features

### 🤖 **AI-Powered Automation**

- **GPT Integration**: Seamless OpenAI API integration with rate limiting and retry logic
- **Intelligent Task Processing**: Batch processing with concurrency control and error handling
- **Smart Scheduling**: Cron-based scheduling with next-run prediction and validation

### 🔒 **Enterprise Security**

- **TLS 1.3 Encryption**: End-to-end encryption for all communications
- **Multi-Factor Authentication**: API key, Bearer token, and Basic auth support
- **Rate Limiting**: Advanced rate limiting with DDoS protection
- **Security Headers**: HSTS, CSP, and comprehensive security middleware

### 📊 **Monitoring & Management**

- **REST API**: Complete CRUD operations for task management
- **Real-time Dashboard**: Next.js-based web interface with live updates
- **Comprehensive Logging**: Structured logging with sensitive data redaction
- **Health Monitoring**: Service health checks and status reporting

### 🛠️ **Developer Experience**

- **TypeScript**: Full type safety and IntelliSense support
- **Testing**: Comprehensive test suite with 95%+ coverage
- **CI/CD**: Automated testing, security scanning, and semantic releases
- **Documentation**: Complete API documentation and setup guides

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │    │  Express API   │    │   GPT Service   │
│   (Port 3001)  │◄──►│  (Port 3000)   │◄──►│   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   SQLite DB     │    │  Rate Limiter   │
│   (Port 8081)   │    │   (Persistent)  │    │  (Token Bucket) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **npm** or **yarn**
- **OpenAI API Key**

### Installation

```bash
# Clone the repository
git clone https://github.com/Rule-0-Softworks/gpt-task-runner.git
cd gpt-task-runner

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your OpenAI API key and configuration
```

### Development

```bash
# Start the development servers
npm run dev          # Next.js frontend (port 3001)
node dist/src/dashboard.js  # Express API server (port 3000)

# Run tests
npm test

# Build for production
npm run build
```

## 📋 Usage

### CLI Commands

```bash
# Run a single task
npx gpt-task-runner run --input tasks.csv --output results.json

# Schedule a recurring task
npx gpt-task-runner schedule add --name "Daily Report" --schedule "0 9 * * *" --input daily.csv

# List scheduled tasks
npx gpt-task-runner schedule list

# Manage tasks via API
curl -X GET http://localhost:3000/api/scheduled-tasks \
  -H "X-API-Key: your-api-key"
```

### API Endpoints

| Method   | Endpoint                           | Description                    |
| -------- | ---------------------------------- | ------------------------------ |
| `GET`    | `/api/scheduled-tasks`             | List all tasks with pagination |
| `POST`   | `/api/scheduled-tasks`             | Create new scheduled task      |
| `PUT`    | `/api/scheduled-tasks/:id`         | Update existing task           |
| `DELETE` | `/api/scheduled-tasks/:id`         | Delete task                    |
| `PATCH`  | `/api/scheduled-tasks/:id/enable`  | Enable task                    |
| `PATCH`  | `/api/scheduled-tasks/:id/disable` | Disable task                   |
| `GET`    | `/api/scheduled-tasks/next-runs`   | Get next run times             |

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000

# Dashboard Configuration
DASHBOARD_API_KEY=your_secure_api_key
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your_secure_password

# TLS/SSL Configuration (Production)
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem
HTTPS_PORT=3443

# Rate Limiting
RATE_LIMIT_RPM=60
RATE_LIMIT_WINDOW_MS=60000
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 🔒 Security

- **TLS 1.3** encryption for all communications
- **Rate limiting** with configurable thresholds
- **Input validation** and sanitization
- **Security headers** (HSTS, CSP, X-Frame-Options)
- **Authentication** via API keys, Bearer tokens, or Basic auth
- **Audit logging** for all security events

## 📈 Performance

- **Concurrency control** with worker pools
- **Batch processing** for efficient API usage
- **Connection pooling** for database operations
- **Caching** for frequently accessed data
- **Optimized queries** with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow conventional commit format
- Maintain 95%+ test coverage
- Run `npm run lint` before committing
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Rule-0-Softworks/gpt-task-runner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Rule-0-Softworks/gpt-task-runner/discussions)

## 🏢 About Rule-0-Softworks

Rule-0-Softworks is a software development organization focused on building enterprise-grade automation tools and AI-powered solutions. We specialize in creating robust, secure, and scalable applications that solve real-world problems.

---

**Built with ❤️ by the Rule-0-Softworks team**
