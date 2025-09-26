# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the GPT Task Runner in various environments, from local development to production Kubernetes clusters.

## Deployment Options

### 1. Local Development
**Best for**: Individual developers and testing

**Prerequisites:**
- Node.js 20.17.0+
- npm 10.0.0+
- OpenAI API key

**Quick Start:**
```bash
# Clone the repository
git clone <repository-url>
cd gpt-task-runner

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

**Environment Variables:**
```env
# Required
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=./data/tasks.db
LOG_LEVEL=info

# Optional
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

### 2. Docker Deployment
**Best for**: Single-server production deployments

#### Using Docker Compose

**Prerequisites:**
- Docker 20.0+
- Docker Compose 2.0+

**Setup:**
```bash
# Copy docker configuration
cp docker-compose.example.yml docker-compose.yml

# Edit configuration as needed
vim docker-compose.yml

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Docker Compose Configuration:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=/app/data/tasks.db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/app/data
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=gpt_tasks
      - POSTGRES_USER=gpt_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

#### Using Docker Swarm

**Prerequisites:**
- Docker Swarm cluster

**Deploy:**
```bash
# Initialize swarm (if not already)
docker swarm init

# Build and deploy
docker build -t gpt-task-runner .
docker stack deploy -c docker-compose.swarm.yml gpt-task-runner
```

### 3. Kubernetes Deployment
**Best for**: High-availability production deployments

#### Prerequisites
- Kubernetes 1.24+
- Helm 3.0+
- kubectl configured for your cluster

#### Quick Deployment

**1. Install Helm Chart:**
```bash
# Add repository
helm repo add gpt-task-runner https://charts.gpt-task-runner.io
helm repo update

# Install with default values
helm install gpt-task-runner gpt-task-runner/gpt-task-runner
```

**2. Custom Installation:**
```bash
# Create values file
cat > values.yaml << EOF
replicaCount: 3

image:
  repository: gpt-task-runner
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: "nginx"
  annotations:
    kubernetes.io/ingress.class: nginx
    kubernetes.io/tls-acme: "true"
  hosts:
    - host: gpt-task-runner.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: gpt-task-runner-tls
      hosts:
        - gpt-task-runner.example.com

config:
  openaiApiKey: "${OPENAI_API_KEY}"
  databaseUrl: "postgresql://gpt_user:${DB_PASSWORD}@postgres:5432/gpt_tasks"
  redisUrl: "redis://redis:6379"
  logLevel: "info"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

monitoring:
  enabled: true
  prometheus: true
  grafana: true

EOF

# Deploy
helm install gpt-task-runner gpt-task-runner/gpt-task-runner \
  -f values.yaml \
  --namespace gpt-task-runner \
  --create-namespace
```

#### Manual Kubernetes Deployment

**1. Create Namespace:**
```bash
kubectl create namespace gpt-task-runner
```

**2. Deploy Database:**
```bash
# PostgreSQL
kubectl apply -f k8s/postgres/

# Redis
kubectl apply -f k8s/redis/
```

**3. Deploy Application:**
```bash
# ConfigMap for configuration
kubectl apply -f k8s/config/

# Secrets for sensitive data
kubectl apply -f k8s/secrets/

# Deployment
kubectl apply -f k8s/deployment/

# Service
kubectl apply -f k8s/service/

# Ingress
kubectl apply -f k8s/ingress/
```

**4. Verify Deployment:**
```bash
# Check pods
kubectl get pods -n gpt-task-runner

# Check services
kubectl get services -n gpt-task-runner

# Check logs
kubectl logs -n gpt-task-runner deployment/gpt-task-runner
```

### 4. Cloud Provider Deployment

#### AWS (ECS Fargate)

**Prerequisites:**
- AWS CLI configured
- ECS cluster created

**Deploy:**
```bash
# Build and push image
aws ecr create-repository --repository-name gpt-task-runner
docker build -t gpt-task-runner .
docker tag gpt-task-runner:latest ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/gpt-task-runner:latest
aws ecr get-login-password | docker login --username AWS --password-stdin ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com
docker push ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/gpt-task-runner:latest

# Deploy to ECS
aws ecs update-service --cluster gpt-task-runner --service gpt-task-runner --force-new-deployment
```

#### Google Cloud (Cloud Run)

**Deploy:**
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/${PROJECT_ID}/gpt-task-runner
gcloud run deploy --image gcr.io/${PROJECT_ID}/gpt-task-runner --platform managed
```

#### Azure (Container Instances)

**Deploy:**
```bash
# Build and push to ACR
az acr build --registry ${ACR_NAME} --image gpt-task-runner:latest .

# Deploy to ACI
az container create --resource-group ${RESOURCE_GROUP} --name gpt-task-runner --image ${ACR_NAME}.azurecr.io/gpt-task-runner:latest --ports 3000
```

## Configuration Management

### Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=./data/tasks.db
REDIS_URL=redis://localhost:6379
```

**Staging:**
```env
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=postgresql://user:pass@db-staging:5432/gpt_tasks
REDIS_URL=redis://redis-staging:6379
```

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=postgresql://user:pass@db-prod:5432/gpt_tasks
REDIS_URL=redis://redis-prod:6379
```

### Secret Management

**Using Kubernetes Secrets:**
```bash
# Create secret for API keys
kubectl create secret generic gpt-task-runner-secrets \
  --from-literal=openai-api-key=${OPENAI_API_KEY} \
  --from-literal=database-password=${DB_PASSWORD}

# Reference in deployment
env:
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: gpt-task-runner-secrets
        key: openai-api-key
```

**Using Docker Secrets:**
```bash
# Create secrets
echo ${OPENAI_API_KEY} | docker secret create openai_api_key -
echo ${DB_PASSWORD} | docker secret create db_password -

# Reference in compose file
secrets:
  - openai_api_key
  - db_password
```

## Monitoring & Observability

### Health Checks

**Application Health:**
```bash
curl http://localhost:3000/api/v1/status
```

**Kubernetes Liveness Probe:**
```yaml
livenessProbe:
  httpGet:
    path: /api/v1/status
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Kubernetes Readiness Probe:**
```yaml
readinessProbe:
  httpGet:
    path: /api/v1/status
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Logging

**Structured Logging Configuration:**
```json
{
  "level": "info",
  "format": "json",
  "outputs": [
    {
      "type": "console",
      "level": "info"
    },
    {
      "type": "file",
      "path": "/var/log/gpt-task-runner/app.log",
      "level": "debug"
    },
    {
      "type": "elk",
      "host": "elasticsearch:9200",
      "level": "info"
    }
  ]
}
```

### Metrics & Dashboards

**Prometheus Configuration:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gpt-task-runner'
    static_configs:
      - targets: ['gpt-task-runner:3000']
    metrics_path: /metrics
```

**Grafana Dashboard:**
- Task execution metrics
- System performance indicators
- Error rates and patterns
- Resource utilization

## Backup & Recovery

### Database Backup

**SQLite:**
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cp /app/data/tasks.db ${BACKUP_DIR}/tasks_${DATE}.db
find ${BACKUP_DIR} -name "tasks_*.db" -mtime +7 -delete
```

**PostgreSQL:**
```bash
# Automated backup
pg_dump gpt_tasks > /backups/gpt_tasks_$(date +%Y%m%d_%H%M%S).sql
```

### Configuration Backup

**Backup critical files:**
```bash
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  /app/config/ \
  /app/.env \
  /app/ssl/
```

### Recovery Procedures

**1. Database Recovery:**
```bash
# Stop application
systemctl stop gpt-task-runner

# Restore database
cp /backups/tasks_20250101_120000.db /app/data/tasks.db

# Start application
systemctl start gpt-task-runner
```

**2. Full System Recovery:**
```bash
# Restore configuration
tar -xzf config_backup_20250101.tar.gz -C /

# Restore database
# Follow database recovery steps

# Restart services
docker-compose down && docker-compose up -d
```

## Scaling Strategies

### Horizontal Scaling

**Application Tier:**
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gpt-task-runner-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gpt-task-runner
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Database Scaling

**Read Replicas:**
```sql
-- PostgreSQL read replica setup
CREATE PUBLICATION gpt_tasks_pub FOR TABLE tasks, batches, scheduled_tasks;
```

**Connection Pooling:**
```yaml
# PgBouncer configuration
[databases]
gpt_tasks = host=primary-db port=5432

[pgbouncer]
pool_mode = transaction
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
```

## Security Hardening

### Network Security

**Firewall Rules:**
```bash
# Only allow necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH for admin only
ufw default deny incoming
```

**Security Groups (AWS):**
```json
{
  "GroupId": "sg-12345",
  "GroupDescription": "GPT Task Runner Security Group",
  "IpPermissions": [
    {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    },
    {
      "IpProtocol": "tcp",
      "FromPort": 443,
      "ToPort": 443,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    }
  ]
}
```

### SSL/TLS Configuration

**Certificate Management:**
```bash
# Using Let's Encrypt
certbot certonly --webroot -w /var/www/html -d gpt-task-runner.example.com
```

**Nginx SSL Configuration:**
```nginx
server {
    listen 443 ssl;
    server_name gpt-task-runner.example.com;

    ssl_certificate /etc/letsencrypt/live/gpt-task-runner.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gpt-task-runner.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://gpt-task-runner:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Common Issues

**1. High Memory Usage:**
```bash
# Check memory usage
docker stats

# Restart with memory limits
docker-compose down
docker-compose up -d --renew-anon-volumes
```

**2. Database Connection Issues:**
```bash
# Test database connectivity
docker-compose exec app npx prisma db ping

# Check database logs
docker-compose logs postgres
```

**3. API Rate Limiting:**
```bash
# Check rate limit status
curl -H "Authorization: Bearer ${API_KEY}" \
  http://localhost:3000/api/v1/status

# Monitor rate limit headers
curl -v -H "Authorization: Bearer ${API_KEY}" \
  http://localhost:3000/api/v1/tasks
```

### Debug Mode

**Enable Debug Logging:**
```env
LOG_LEVEL=debug
DEBUG_MODE=true
```

**Check Application Logs:**
```bash
# Docker Compose
docker-compose logs -f app

# Kubernetes
kubectl logs -f deployment/gpt-task-runner -n gpt-task-runner
```

**Database Inspection:**
```bash
# SQLite
sqlite3 /app/data/tasks.db ".schema"
sqlite3 /app/data/tasks.db "SELECT COUNT(*) FROM tasks;"

# PostgreSQL
docker-compose exec postgres psql -U gpt_user -d gpt_tasks -c "\dt"
docker-compose exec postgres psql -U gpt_user -d gpt_tasks -c "SELECT COUNT(*) FROM tasks;"
```

## Performance Tuning

### Application Tuning

**Node.js Optimization:**
```env
NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
UV_THREADPOOL_SIZE=4
```

**Database Optimization:**
```sql
-- Create indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_batches_status ON batches(status);
```

**Caching Configuration:**
```json
{
  "cache": {
    "ttl": 3600,
    "maxSize": 1000,
    "strategy": "LRU"
  }
}
```

## Cost Optimization

### Resource Optimization
- Use appropriate instance sizes based on load
- Implement auto-scaling to handle traffic spikes
- Use spot instances for non-critical workloads
- Monitor and right-size resources regularly

### API Cost Management
- Implement request batching to reduce API calls
- Use caching to avoid redundant requests
- Monitor token usage and optimize prompts
- Set up budget alerts for API costs

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor system health and performance
- Check log files for errors
- Verify backup completion

**Weekly:**
- Review resource utilization
- Update dependencies
- Test backup restoration

**Monthly:**
- Security updates and patches
- Performance optimization review
- Capacity planning

### Support Contacts

**Emergency Support:**
- On-call engineer: +1-555-0123
- Emergency email: support@gpt-task-runner.com

**Regular Support:**
- Documentation: https://docs.gpt-task-runner.io
- Community Forum: https://forum.gpt-task-runner.io
- Issue Tracker: https://github.com/your-org/gpt-task-runner/issues

## Appendix

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | Yes |
| `DATABASE_URL` | Database connection string | `./data/tasks.db` | Yes |
| `REDIS_URL` | Redis connection string | - | No |
| `PORT` | Application port | `3000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `MAX_CONCURRENCY` | Max concurrent tasks | `10` | No |
| `BATCH_SIZE` | Task batch size | `50` | No |
| `CACHE_TTL` | Cache time-to-live | `3600` | No |

### Port Reference

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Application | 3000 | HTTP | Main application |
| PostgreSQL | 5432 | TCP | Database |
| Redis | 6379 | TCP | Cache |
| Prometheus | 9090 | HTTP | Metrics |
| Grafana | 3001 | HTTP | Dashboards |
| Nginx | 80, 443 | HTTP/HTTPS | Reverse proxy |

### File System Layout

```
/app/
├── /data/                 # Application data
│   ├── tasks.db          # SQLite database
│   └── uploads/          # File uploads
├── /config/               # Configuration files
├── /logs/                 # Application logs
├── /backups/              # Database backups
└── /ssl/                  # SSL certificates
```