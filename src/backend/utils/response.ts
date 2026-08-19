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

export function sendError(res: Response, error: AppErrorLike | Error | unknown) {
  const err = (error ?? {}) as AppErrorLike & Error;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const status = err.status || 500;
  const details = err.details;

  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
    meta: {
      request_id: res.req.headers['x-request-id'] || '',
      timestamp: new Date().toISOString(),
    },
  });
}