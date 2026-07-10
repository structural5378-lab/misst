/**
 * Custom Error Classes — Used by services to signal expected errors.
 */

export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('RESOURCE_NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('RATE_LIMITED', `Rate limit exceeded. Try again in ${retryAfter} seconds.`, 429, { retry_after: retryAfter });
  }
}