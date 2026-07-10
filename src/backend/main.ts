/**
 * MIST Backend — Application Entry Point
 * Initializes the server, connects dependencies, and starts listening.
 */

import { createApp } from './app';
import { config } from './config';
import { logger } from './logging';
import { initializeDatabase } from './db';
import { initializeWebSocket } from './websockets';
import { startScheduler } from './jobs';

async function bootstrap() {
  try {
    logger.info('Starting MIST backend...');

    // Initialize database connection pool
    await initializeDatabase();
    logger.info('Database connected');

    // Create Express/Fastify app
    const app = createApp();

    // Initialize WebSocket server
    const httpServer = initializeWebSocket(app);
    logger.info('WebSocket server initialized');

    // Start background job scheduler
    startScheduler();
    logger.info('Job scheduler started');

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