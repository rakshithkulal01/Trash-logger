import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const { method, url, ip } = req;

  // Log request
  logger.info(`Incoming request: ${method} ${url}`, {
    ip: ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    
    logger.info(`Response: ${method} ${url} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      statusCode: res.statusCode
    });

    return originalSend.call(this, data);
  };

  next();
}
