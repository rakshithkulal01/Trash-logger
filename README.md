# Community Trash Logger

A web application that enables local residents to log trash found during walks, visualize trash hotspots on a map, and generate reports for city council presentations.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Database Backup](#database-backup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Technology Stack](#technology-stack)

## Features

- 📍 GPS-based trash logging with manual fallback
- 🗺️ Interactive map visualization with clustering
- 📊 Statistics and analytics dashboard
- 📄 PDF report generation
- 📱 Mobile-responsive design
- 🔗 Shareable reports with URL parameters
- 📸 Photo upload support

## Project Structure

```
community-trash-logger/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── database/    # Database initialization and queries
│   │   ├── models/      # Data models and types
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic
│   │   ├── app.ts       # Express app configuration
│   │   └── server.ts    # Server entry point
│   ├── data/            # SQLite database and photos (created at runtime)
│   ├── dist/            # Compiled JavaScript (created by build)
│   ├── package.json
│   └── tsconfig.json
├── frontend/            # React + TypeScript UI
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API client services
│   │   ├── App.tsx      # Main app component
│   │   └── main.tsx     # Entry point
│   ├── dist/            # Production build (created by build)
│   ├── package.json
│   └── vite.config.ts
├── .env.example         # Environment variable template
├── start-production.js  # Production startup script
└── package.json         # Root package with scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git (for cloning the repository)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd community-trash-logger
```

2. Install all dependencies:
```bash
npm run install:all
```

3. (Optional) Create a `.env` file for custom configuration:
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

## Development

### Running Development Servers

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Backend API on http://localhost:3000
- Frontend dev server on http://localhost:5173

Or run them separately:
```bash
# Terminal 1 - Backend (runs on port 3000)
npm run dev:backend

# Terminal 2 - Frontend (runs on port 5173)
npm run dev:frontend
```

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Production Deployment

### Building for Production

1. Build both frontend and backend:
```bash
npm run build
```

This will:
- Compile TypeScript backend code to `backend/dist/`
- Build optimized frontend bundle to `frontend/dist/`
- Enable code splitting and minification

2. Verify the build:
```bash
# Check that build directories exist
ls backend/dist/server.js
ls frontend/dist/index.html
```

### Running in Production

Start the production server:
```bash
npm start
```

The production server will:
- Serve the frontend from `frontend/dist/`
- Run the API on the configured port (default: 3000)
- Handle client-side routing automatically
- Create necessary data directories if they don't exist

Access the application at: http://localhost:3000

### Deployment Platforms

#### Option 1: VPS or Cloud Server (DigitalOcean, AWS EC2, etc.)

1. **Prepare the server:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Deploy the application:**
```bash
# Clone and build
git clone <repository-url>
cd community-trash-logger
npm run install:all
npm run build

# Start with PM2
pm2 start start-production.js --name trash-logger

# Save PM2 configuration
pm2 save
pm2 startup
```

3. **Configure reverse proxy (optional but recommended):**

Install and configure Nginx:
```bash
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/trash-logger
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/trash-logger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Set up SSL with Let's Encrypt:**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Option 2: Platform as a Service (Heroku, Railway, Render)

1. **Create a `Procfile`:**
```
web: npm start
```

2. **Configure build command:**
- Build command: `npm run install:all && npm run build`
- Start command: `npm start`

3. **Set environment variables** in the platform dashboard (see Environment Variables section)

4. **Deploy** using the platform's CLI or Git integration

#### Option 3: Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create data directories
RUN mkdir -p backend/data/photos

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t trash-logger .
docker run -p 3000:3000 -v $(pwd)/backend/data:/app/backend/data trash-logger
```

### Post-Deployment Checklist

- [ ] Verify the application is accessible
- [ ] Test trash entry submission
- [ ] Test photo upload functionality
- [ ] Test map visualization
- [ ] Test PDF report generation
- [ ] Set up database backups (see Database Backup section)
- [ ] Configure monitoring and logging
- [ ] Set up SSL certificate for HTTPS
- [ ] Test on mobile devices

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory or set them in your deployment platform.

### Available Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `DB_PATH` | SQLite database file path | `./backend/data/trash.db` | No |
| `UPLOAD_DIR` | Photo upload directory | `./backend/data/photos` | No |
| `LOG_DIR` | Log file directory | `./backend/logs` | No |
| `MAX_FILE_SIZE` | Max photo size in bytes | `5242880` (5MB) | No |
| `CORS_ORIGIN` | Allowed CORS origin (if needed) | `*` | No |

### Example Configuration

Development (`.env`):
```bash
PORT=3000
NODE_ENV=development
DB_PATH=./backend/data/trash.db
UPLOAD_DIR=./backend/data/photos
MAX_FILE_SIZE=5242880
```

Production (`.env`):
```bash
PORT=3000
NODE_ENV=production
DB_PATH=/var/data/trash-logger/trash.db
UPLOAD_DIR=/var/data/trash-logger/photos
MAX_FILE_SIZE=5242880
```

### Frontend Environment Variables

The frontend uses Vite's environment variable system. Create `frontend/.env` for custom API configuration:

```bash
# API URL (only needed if frontend is hosted separately)
VITE_API_URL=https://api.yourdomain.com
```

## Database Backup

The application uses SQLite for data storage. Regular backups are essential to prevent data loss.

### Manual Backup

```bash
# Create a backup with timestamp
cp backend/data/trash.db backend/data/trash.db.backup-$(date +%Y%m%d-%H%M%S)

# Or use SQLite's backup command
sqlite3 backend/data/trash.db ".backup 'backup/trash-$(date +%Y%m%d).db'"
```

### Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash

# Configuration
DB_PATH="./backend/data/trash.db"
BACKUP_DIR="./backups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/trash-$TIMESTAMP.db"

# Perform backup
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Compress backup
gzip "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE.gz"

# Remove old backups
find "$BACKUP_DIR" -name "trash-*.db.gz" -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
```

Make it executable:
```bash
chmod +x backup.sh
```

### Schedule Automated Backups

Using cron (Linux/Mac):
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/community-trash-logger && ./backup.sh >> backup.log 2>&1
```

Using PM2 (if using PM2 for process management):
```bash
# Create a backup script that PM2 can run
pm2 start backup.sh --cron "0 2 * * *" --no-autorestart
```

### Restore from Backup

```bash
# Stop the application
pm2 stop trash-logger  # or however you're running it

# Restore the database
cp backups/trash-20231215-020000.db.gz ./
gunzip trash-20231215-020000.db.gz
cp trash-20231215-020000.db backend/data/trash.db

# Restart the application
pm2 start trash-logger
```

### Backup Photos

Don't forget to backup the photos directory:
```bash
# Create photos backup
tar -czf backups/photos-$(date +%Y%m%d).tar.gz backend/data/photos/

# Restore photos
tar -xzf backups/photos-20231215.tar.gz -C backend/data/
```

## Monitoring and Logging

The application includes comprehensive logging and monitoring capabilities. For detailed information, see [backend/LOGGING.md](backend/LOGGING.md).

### Quick Overview

**Health Check Endpoint:**
```bash
curl http://localhost:3000/health
```

Returns server status, uptime, and memory usage.

**Log Files:**
- Location: `backend/logs/`
- Format: JSON (one entry per line)
- Rotation: Daily (automatic)

**What's Logged:**
- All HTTP requests and responses
- Server errors with full context
- Application startup and shutdown
- Database operations

For complete documentation on logging configuration, log analysis, and monitoring best practices, see [backend/LOGGING.md](backend/LOGGING.md).

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, React Router, Leaflet, jsPDF
- **Backend**: Node.js, Express, TypeScript, SQLite, Multer
- **Development**: Concurrently, ts-node-dev, Jest, Vitest
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Database**: SQLite (file-based, no separate server needed)

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

**Database locked error:**
- Ensure only one instance of the application is running
- Check file permissions on the database file

**Photos not displaying:**
- Verify UPLOAD_DIR exists and has write permissions
- Check that photos are being saved to the correct directory
- Ensure the server can serve static files from the photos directory

**Build fails:**
- Clear node_modules and reinstall: `rm -rf node_modules */node_modules && npm run install:all`
- Check Node.js version: `node --version` (should be 18+)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
