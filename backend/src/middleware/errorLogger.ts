import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorLoggerMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log the error with request context
  logger.error('Unhandled error occurred', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    }
  });

  // Send error response
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.'
    }
  });
}
