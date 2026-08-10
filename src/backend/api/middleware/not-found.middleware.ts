/**
 * Not Found Handler — Returns a 404 envelope for unmatched routes.
 */
import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}