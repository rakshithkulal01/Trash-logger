# Quick Start Guide

Get the Community Trash Logger up and running in minutes.

## For Development

```bash
# 1. Install dependencies
npm run install:all

# 2. Start development servers
npm run dev

# 3. Open browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

## For Production

```bash
# 1. Install dependencies
npm run install:all

# 2. Build the application
npm run build

# 3. Configure environment (optional)
cp .env.example .env
# Edit .env with your settings

# 4. Start production server
npm start

# 5. Access application
# Open: http://localhost:3000
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development servers (frontend + backend) |
| `npm run dev:backend` | Start only backend dev server |
| `npm run dev:frontend` | Start only frontend dev server |
| `npm run build` | Build both frontend and backend for production |
| `npm start` | Start production server |
| `npm test` | Run all tests |

## Project URLs (Development)

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Health Check:** http://localhost:3000/health
- **API Endpoints:** http://localhost:3000/api/*

## Default Configuration

- **Port:** 3000
- **Database:** `backend/data/trash.db` (created automatically)
- **Photos:** `backend/data/photos/` (created automatically)
- **Max Photo Size:** 5MB

## Need Help?

- **Full documentation:** See [README.md](README.md)
- **Deployment guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Environment variables:** See [.env.example](.env.example)

## Troubleshooting

**Port already in use?**
```bash
# Change port in .env file
echo "PORT=3001" > .env
```

**Build fails?**
```bash
# Clean install
rm -rf node_modules */node_modules
npm run install:all
```

**Database locked?**
```bash
# Ensure only one instance is running
# Check: ps aux | grep node
```
