# Production Deployment Guide

Deploy ClawTerm Business Agents in production with Docker, orchestration, and monitoring.

---

## Quick Start (Docker)

```bash
# Clone repository
git clone https://github.com/zanabalofficial/claw-term.git
cd claw-term

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start services
docker-compose up -d

# Check health
curl http://localhost:3000/health

# View logs
docker-compose logs -f claw-term
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  claw-term   │  │    Redis     │  │  PostgreSQL  │      │
│  │  (orchestrator│  │   (cache)    │  │  (database)  │      │
│  │   + API)     │  │              │  │              │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                   │
│         │  REST API (port 3000)                            │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │   Dashboard  │  (optional, port 8080)                   │
│  │   (Web UI)   │                                           │
│  └──────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables (.env)

```bash
# Required API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Business Agent Credentials
QB_ACCESS_TOKEN=...           # QuickBooks for AR Recovery
STRIPE_SECRET_KEY=sk_...      # Stripe for Dunning
GITHUB_TOKEN=ghp_...          # GitHub for PR automation
SLACK_TOKEN=xoxb-...          # Slack for notifications

# Database
DATABASE_URL=postgresql://claw:password@postgres:5432/clawterm
# Or use SQLite (default for single node)
# DATABASE_URL=sqlite:///app/data/claw.db

# Redis (optional, for caching)
REDIS_URL=redis://redis:6379

# Orchestrator
PORT=3000
CLAW_DATA_DIR=/app/data
CLAW_LOG_LEVEL=info
CLAW_JOBS_CONFIG=/app/config/jobs.json
```

### Job Configuration (config/jobs.json)

```json
{
  "jobs": [
    {
      "agentId": "ar-recovery",
      "name": "Daily AR Recovery",
      "schedule": "daily",
      "config": {
        "accountingSystem": "quickbooks",
        "credentials": {
          "accessToken": "${QB_ACCESS_TOKEN}"
        },
        "agingThreshold": 30
      },
      "enabled": true
    },
    {
      "agentId": "subscription-dunning",
      "name": "Hourly Dunning",
      "schedule": "hourly",
      "config": {
        "billingSystem": "stripe"
      },
      "enabled": true
    },
    {
      "agentId": "invoice-audit",
      "name": "Monthly Invoice Audit",
      "schedule": "monthly",
      "config": {
        "vendorType": "software"
      },
      "enabled": true
    }
  ]
}
```

**Schedule Options:**
- `hourly` - Every hour
- `daily` - Every 24 hours
- `weekly` - Every 7 days
- `monthly` - Every 30 days
- `custom` - Use cronExpression (e.g., `0 */6 * * *` for every 6 hours)

---

## API Reference

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.0.0",
  "activeJobs": 5,
  "failedRuns": 0,
  "last24h": 12
}
```

### Metrics

```bash
GET /metrics
```

Response:
```json
{
  "totalJobs": 10,
  "activeJobs": 8,
  "totalRuns": 156,
  "totalRevenue": 245000.50,
  "totalFees": 49000.10,
  "successRate": 0.97
}
```

### List Jobs

```bash
GET /jobs
```

### Create Job

```bash
POST /jobs
Content-Type: application/json

{
  "agentId": "ar-recovery",
  "name": "Custom AR Job",
  "schedule": "daily",
  "config": {
    "accountingSystem": "quickbooks",
    "agingThreshold": 45
  },
  "enabled": true
}
```

### Execute Job Immediately

```bash
POST /jobs/{jobId}/execute
```

Response:
```json
{
  "jobId": "job_12345",
  "agentId": "ar-recovery",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": "2024-01-15T10:32:15Z",
  "duration": 135000,
  "success": true,
  "revenueImpact": 15000,
  "fee": 3000
}
```

### Webhook Trigger

```bash
POST /webhook
Content-Type: application/json

{
  "agentId": "chargeback-dispute",
  "config": {
    "platform": "stripe",
    "disputeId": "dp_12345"
  }
}
```

### Run All Enabled Jobs

```bash
POST /run-all
```

---

## Deployment Scenarios

### Single Node (SQLite)

For small deployments, use SQLite:

```yaml
# docker-compose.yml
services:
  claw-term:
    build: .
    environment:
      - DATABASE_URL=sqlite:///app/data/claw.db
    volumes:
      - ./data:/app/data
```

### Multi-Node (PostgreSQL + Redis)

For production with multiple workers:

```yaml
# docker-compose.yml
services:
  claw-term:
    build: .
    environment:
      - DATABASE_URL=postgresql://claw:password@postgres:5432/clawterm
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=claw
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=clawterm
    volumes:
      - postgres-data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claw-term
spec:
  replicas: 2
  selector:
    matchLabels:
      app: claw-term
  template:
    metadata:
      labels:
        app: claw-term
    spec:
      containers:
      - name: claw-term
        image: zanabalofficial/claw-term:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: claw-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: claw-secrets
              key: openai-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## Monitoring

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f claw-term

# JSON logs (for log aggregation)
docker-compose logs -f claw-term | jq
```

### Health Monitoring

```bash
# Simple health check
watch -n 30 'curl -s http://localhost:3000/health | jq'

# Metrics polling
watch -n 60 'curl -s http://localhost:3000/metrics | jq'
```

### Alerting (Example with Prometheus)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'claw-term'
    static_configs:
      - targets: ['claw-term:3000']
    metrics_path: /metrics
    scrape_interval: 60s

alerting:
  rules:
    - alert: ClawTermDown
      expr: up{job="claw-term"} == 0
      for: 5m
      
    - alert: HighFailureRate
      expr: claw_success_rate < 0.8
      for: 10m
```

---

## Backup and Recovery

### Database Backup

```bash
# PostgreSQL
docker exec claw-postgres pg_dump -U claw clawterm > backup.sql

# SQLite
cp data/claw.db backup/claw-$(date +%Y%m%d).db
```

### Job Configuration Backup

```bash
cp config/jobs.json config/jobs-$(date +%Y%m%d).json
```

### Restore

```bash
# PostgreSQL
docker exec -i claw-postgres psql -U claw clawterm < backup.sql

# SQLite
cp backup/claw-20240115.db data/claw.db
```

---

## Security

### Secrets Management

Use Docker secrets or external vault:

```yaml
# docker-compose.yml with secrets
secrets:
  openai_key:
    file: ./secrets/openai_key.txt
  
services:
  claw-term:
    secrets:
      - openai_key
    environment:
      - OPENAI_API_KEY_FILE=/run/secrets/openai_key
```

### Network Security

```yaml
# docker-compose.yml with network isolation
networks:
  claw-internal:
    internal: true
  claw-external:
    driver: bridge

services:
  claw-term:
    networks:
      - claw-internal
      - claw-external
  
  postgres:
    networks:
      - claw-internal  # Not exposed externally
```

### API Authentication

Add middleware to `src/api/server.ts`:

```typescript
// API Key authentication
const apiKey = request.headers.get('x-api-key');
if (apiKey !== process.env.API_KEY) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## Scaling

### Horizontal Scaling

Run multiple orchestrator instances with shared database:

```yaml
services:
  claw-term-1:
    build: .
    environment:
      - NODE_ID=worker-1
  
  claw-term-2:
    build: .
    environment:
      - NODE_ID=worker-2
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "3000:80"
```

### Queue-Based Scaling

For high-volume agents, use Redis queue:

```typescript
// Add to orchestrator
import { Queue } from 'bullmq';

const jobQueue = new Queue('agent-jobs', { connection: redis });

// Instead of executing directly
await jobQueue.add('run-agent', { agentId, config });

// Worker processes
const worker = new Worker('agent-jobs', async (job) => {
  return runAgent(job.data.agentId, job.data.config);
});
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs claw-term

# Verify environment
docker-compose config

# Check file permissions
ls -la data/ config/
```

### Jobs Not Running

```bash
# Check job status
curl http://localhost:3000/jobs | jq

# Check if enabled
curl http://localhost:3000/jobs/{jobId} | jq '.enabled'

# Check logs for errors
docker-compose logs claw-term | grep -i error
```

### High Memory Usage

```bash
# Check memory stats
docker stats claw-term

# Restart container
docker-compose restart claw-term

# Limit memory in compose
services:
  claw-term:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec claw-postgres pg_isready -U claw

# Check connection string
echo $DATABASE_URL

# Verify network
docker network inspect claw-term_claw-network
```

---

## Best Practices

### 1. Use Environment Variables for Secrets

Never commit API keys to git:

```bash
# Good: Use .env
echo "OPENAI_API_KEY=sk-..." >> .env

# Bad: Hardcode in config
# "apiKey": "sk-..."  # DON'T DO THIS
```

### 2. Enable Only Needed Agents

```json
{
  "jobs": [
    {
      "agentId": "ar-recovery",
      "enabled": true  // Only enable what you use
    },
    {
      "agentId": "rfp-response",
      "enabled": false  // Disable unused agents
    }
  ]
}
```

### 3. Monitor Job Success Rates

```bash
# Alert if success rate drops
curl -s http://localhost:3000/metrics | \
  jq '.successRate' | \
  awk '{if ($1 < 0.9) print "ALERT: Success rate below 90%"}'
```

### 4. Set Resource Limits

```yaml
services:
  claw-term:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### 5. Regular Backups

```bash
# Cron job for daily backup
0 2 * * * /opt/claw-term/scripts/backup.sh
```

---

## Production Checklist

Before going live:

- [ ] API keys configured in environment
- [ ] Database credentials secured
- [ ] Jobs configured and enabled
- [ ] Health check endpoint responding
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] Resource limits set
- [ ] Monitoring alerts configured
- [ ] SSL/TLS configured (if external access)
- [ ] Disaster recovery plan documented

---

**Your business agents are now running in production!**

Monitor at: http://localhost:3000/metrics
API Docs: See API Reference section above
