import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import trashRoutes from './routes/trashRoutes';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { errorLoggerMiddleware } from './middleware/errorLogger';
import { logger } from './utils/logger';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../data/photos');
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_BUILD_PATH = path.join(__dirname, '../../frontend/dist');

// Rate limiting middleware - 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const rateLimit = rateLimitMap.get(ip)!;

  if (now > rateLimit.resetTime) {
    // Reset the window
    rateLimit.count = 1;
    rateLimit.resetTime = now + windowMs;
    return next();
  }

  if (rateLimit.count >= maxRequests) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    });
  }

  rateLimit.count++;
  next();
}

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(requestLoggerMiddleware);
  app.use(rateLimitMiddleware);

  // Static file serving for photos
  app.use('/photos', express.static(UPLOAD_DIR));

  // API routes
  app.use('/api', trashRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
      },
      environment: NODE_ENV
    });
  });

  // Serve frontend static files in production
  if (NODE_ENV === 'production') {
    app.use(express.static(FRONTEND_BUILD_PATH));
    
    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'));
    });
  }

  // Error logging middleware (must be last)
  app.use(errorLoggerMiddleware);

  return app;
}
