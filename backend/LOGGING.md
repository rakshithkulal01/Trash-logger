# Logging and Monitoring Documentation

## Overview

The Community Trash Logger backend implements comprehensive logging and monitoring to track application health, errors, and request activity.

## Log Files

### Location

Log files are stored in the `backend/logs/` directory by default. This location can be customized using the `LOG_DIR` environment variable.

### File Naming Convention

Log files are named using the pattern: `app-YYYY-MM-DD.log`

Example: `app-2025-11-23.log`

A new log file is created each day automatically.

### Log Format

Logs are written in JSON format with the following structure:

```json
{
  "timestamp": "2025-11-23T10:30:45.123Z",
  "level": "INFO",
  "message": "Server started successfully on port 3000",
  "data": {
    "port": 3000,
    "environment": "production",
    "nodeVersion": "v20.10.0"
  }
}
```

## Log Levels

The application uses four log levels:

- **ERROR**: Critical errors that require attention
- **WARN**: Warning messages for potential issues
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information (only in development mode)

## What Gets Logged

### Server Events

- Server startup and shutdown
- Database initialization
- Configuration loading

### HTTP Requests

All incoming HTTP requests are logged with:
- HTTP method and URL
- Client IP address
- User agent
- Response status code
- Request duration

Example:
```json
{
  "timestamp": "2025-11-23T10:31:15.456Z",
  "level": "INFO",
  "message": "Incoming request: POST /api/trash",
  "data": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Errors

All errors are logged with full context:
- Error message and stack trace
- Request details (method, URL, IP)
- Additional context data

Example:
```json
{
  "timestamp": "2025-11-23T10:32:00.789Z",
  "level": "ERROR",
  "message": "Error creating trash entry",
  "data": {
    "error": "Database connection failed",
    "trash_type": "plastic",
    "hasPhoto": true
  }
}
```

## Health Check Endpoint

### Endpoint: GET /health

The health check endpoint provides real-time application status and metrics.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T10:30:00.000Z",
  "uptime": "3600s",
  "memory": {
    "heapUsed": "45MB",
    "heapTotal": "60MB",
    "rss": "80MB"
  },
  "environment": "production"
}
```

**Use Cases:**
- Load balancer health checks
- Monitoring system integration
- Quick status verification

## Environment Variables

Configure logging behavior with these environment variables:

```bash
# Log directory location (default: backend/logs)
LOG_DIR=/var/log/trash-logger

# Node environment (affects debug logging)
NODE_ENV=production

# Disable file logging in test environment
NODE_ENV=test
```

## Log Management

### Log Rotation

Log files are automatically rotated daily. Old log files are not automatically deleted.

**Recommended log rotation strategy:**

1. Keep logs for 30 days
2. Compress logs older than 7 days
3. Archive logs older than 30 days

Example using logrotate (Linux):
```
/path/to/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
}
```

### Log Analysis

Since logs are in JSON format, they can be easily parsed and analyzed:

**Count errors in the last 24 hours:**
```bash
grep '"level":"ERROR"' logs/app-2025-11-23.log | wc -l
```

**Extract all error messages:**
```bash
grep '"level":"ERROR"' logs/app-2025-11-23.log | jq '.message'
```

**Find slow requests (>1000ms):**
```bash
grep '"duration"' logs/app-2025-11-23.log | jq 'select(.data.duration | tonumber > 1000)'
```

## Monitoring Best Practices

### 1. Monitor Error Rates

Set up alerts for:
- Error rate exceeding 5% of total requests
- Any ERROR level logs in production
- Repeated errors from the same endpoint

### 2. Track Response Times

Monitor the `duration` field in request logs:
- Alert if average response time > 1000ms
- Alert if 95th percentile > 2000ms

### 3. Monitor Health Endpoint

Poll `/health` endpoint every 30 seconds:
- Alert if status is not "ok"
- Alert if endpoint is unreachable
- Track memory usage trends

### 4. Disk Space

Monitor log directory disk usage:
- Alert if disk usage > 80%
- Implement log rotation to prevent disk full

## Integration with Monitoring Tools

### Example: Prometheus + Grafana

The health endpoint can be scraped by Prometheus:

```yaml
scrape_configs:
  - job_name: 'trash-logger'
    metrics_path: '/health'
    static_configs:
      - targets: ['localhost:3000']
```

### Example: ELK Stack

Forward logs to Elasticsearch using Filebeat:

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/backend/logs/*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
```

## Troubleshooting

### Logs Not Being Created

1. Check directory permissions: `ls -la backend/logs/`
2. Verify LOG_DIR environment variable
3. Check console output for file write errors

### Logs Too Large

1. Implement log rotation (see Log Management section)
2. Reduce log level in production (disable DEBUG)
3. Consider log aggregation service

### Missing Request Logs

1. Verify requestLoggerMiddleware is registered in app.ts
2. Check if NODE_ENV=test (file logging disabled in tests)
3. Verify middleware order (should be early in chain)

## Security Considerations

### Sensitive Data

The logger automatically excludes:
- Request bodies (may contain user data)
- Authorization headers
- Password fields

### Log Access

Restrict access to log files:
```bash
chmod 640 backend/logs/*.log
chown app:app backend/logs/*.log
```

### Log Retention

Follow data retention policies:
- Delete logs after required retention period
- Anonymize or encrypt archived logs
- Document retention policy in privacy policy

## Performance Impact

Logging has minimal performance impact:
- Async file writes (non-blocking)
- Structured logging (efficient JSON serialization)
- Disabled debug logging in production

Expected overhead: < 1ms per request
