/**
 * Validate Middleware — Validates req.body against a Zod schema.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
import { sendError } from '../../utils/response';

export function validate(schema: ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err: any) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: err?.errors?.[0]?.message || 'Validation failed',
        status: 400,
        details: err?.errors,
      });
    }
  };
}