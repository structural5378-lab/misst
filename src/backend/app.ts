/**
 * MIST Backend — App Configuration
 * Configures middleware, routes, and error handling.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './logging';
import { requestIdMiddleware } from './api/middleware/request-id.middleware';
import { requestLogger } from './logging/request-logger';
import { errorHandler } from './api/middleware/error.middleware';
import { notFoundHandler } from './api/middleware/not-found.middleware';
import { apiRouter } from './api';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({ origin: config.cors.allowedOrigins, credentials: true }));
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request tracking
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Global rate limiter
  app.use(rateLimit({
    windowMs: 60 * 1000,
    max: config.rateLimits.global,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', apiRouter);

  // 404 + error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}