#!/usr/bin/env node

/**
 * Production startup script for Community Trash Logger
 * This script ensures proper environment configuration before starting the server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set production environment
process.env.NODE_ENV = 'production';

// Load environment variables from .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env file...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Set default values if not provided
process.env.PORT = process.env.PORT || '3000';
process.env.DB_PATH = process.env.DB_PATH || './backend/data/trash.db';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || './backend/data/photos';
process.env.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '5242880';

// Ensure data directories exist
const dataDir = path.join(__dirname, 'backend', 'data');
const photosDir = path.join(__dirname, 'backend', 'data', 'photos');

if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(photosDir)) {
  console.log('Creating photos directory...');
  fs.mkdirSync(photosDir, { recursive: true });
}

// Check if build exists
const backendBuildPath = path.join(__dirname, 'backend', 'dist', 'server.js');
const frontendBuildPath = path.join(__dirname, 'frontend', 'dist', 'index.html');

if (!fs.existsSync(backendBuildPath)) {
  console.error('ERROR: Backend build not found. Please run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(frontendBuildPath)) {
  console.error('ERROR: Frontend build not found. Please run "npm run build" first.');
  process.exit(1);
}

console.log('Starting Community Trash Logger in production mode...');
console.log(`Port: ${process.env.PORT}`);
console.log(`Database: ${process.env.DB_PATH}`);
console.log(`Upload Directory: ${process.env.UPLOAD_DIR}`);
console.log('');

// Start the server
const serverProcess = spawn('node', [backendBuildPath], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  serverProcess.kill('SIGTERM');
});
