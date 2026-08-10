/**
 * Error Handler Middleware — Final error boundary. Logs and normalizes.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { sendError } from '../../utils/response';
import { logger } from '../../logging';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'Unhandled error');
  if (err instanceof AppError) return sendError(res, err);
  return sendError(res, {
    code: 'INTERNAL_ERROR',
    message: err?.message || 'Internal server error',
    status: 500,
  });
}