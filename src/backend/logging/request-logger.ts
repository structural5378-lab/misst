/**
 * Request Logger — Logs each HTTP request with method, path, status, duration.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        requestId: req.headers['x-request-id'],
      },
      'request',
    );
  });
  next();
}