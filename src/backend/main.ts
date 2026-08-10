/**
 * MIST Backend — Application Entry Point
 * Initializes the server, connects dependencies, and starts listening.
 *
 * Phase 1 (auth foundation): the WebSocket and job-scheduler subsystems are
 * optional and loaded lazily so the auth API can boot even before those
 * subsystems (and their dependencies) are installed/implemented.
 */

import { createServer } from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './logging';
import { initializeDatabase } from './db';

async function bootstrap() {
  try {
    logger.info('Starting MIST backend...');

    // Initialize database connection pool
    await initializeDatabase();
    logger.info('Database connected');

    // Create Express app
    const app = createApp();
    const httpServer = createServer(app);

    // Optional subsystems — loaded dynamically so a missing dependency or
    // not-yet-implemented module does not prevent the auth API from serving.
    try {
      const { initializeWebSocket } = await import('./websockets');
      initializeWebSocket(httpServer);
      logger.info('WebSocket server initialized');
    } catch (err) {
      logger.warn({ err }, 'WebSocket subsystem not available — running in auth-only mode');
    }

    try {
      const { startScheduler } = await import('./jobs');
      startScheduler();
      logger.info('Job scheduler started');
    } catch (err) {
      logger.warn({ err }, 'Job scheduler not available — running in auth-only mode');
    }

    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info(`MIST backend running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully');
  process.exit(0);
});

bootstrap();