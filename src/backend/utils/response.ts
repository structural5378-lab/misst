/**
 * Response Utilities — Standard response envelope helpers.
 */

import { Response } from 'express';

interface AppErrorLike {
  code?: string;
  message: string;
  status?: number;
  details?: unknown;
}

export function sendSuccess(res: Response, status: number, data?: unknown) {
  return res.status(status).json({
    success: true,
    data: data ?? null,
    meta: {
      request_id: res.req.headers['x-request-id'] || '',
      timestamp: new Date().toISOString(),
    },
  });
}

export function sendPaginated(res: Response, data: unknown[], pagination: {
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      pagination,
      request_id: res.req.headers['x-request-id'] || '',
      timestamp: new Date().toISOString(),
    },
  });
}

export function sendError(res: Response, error: AppErrorLike | Error) {
  const code = (error as AppErrorLike).code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';
  const status = (error as AppErrorLike).status || 500;
  const details = (error as AppErrorLike).details;

  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
    meta: {
      request_id: res.req.headers['x-request-id'] || '',
      timestamp: new Date().toISOString(),
    },
  });
}