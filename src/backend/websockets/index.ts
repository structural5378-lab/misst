/**
 * WebSocket Server — Real-time connection management.
 * Manages rooms for chat, presence, alerts, and location sharing.
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config';
import { logger } from '../logging';
import { ConnectionManager } from './connection-manager';
import { authenticateWs } from './middleware/auth.ws-middleware';

let wss: WebSocketServer;
const connectionManager = new ConnectionManager();

export function initializeWebSocket(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: any) => {
    // Authenticate the WebSocket connection
    const user = authenticateWs(req);
    if (!user) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const connectionId = connectionManager.add(user.id, ws);
    logger.info(`WebSocket connected: user=${user.id} conn=${connectionId}`);

    ws.on('message', (data: Buffer) => {
      handleMessage(user.id, data.toString());
    });

    ws.on('close', () => {
      connectionManager.remove(user.id, connectionId);
      logger.info(`WebSocket disconnected: user=${user.id}`);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${user.id}`, error);
      connectionManager.remove(user.id, connectionId);
    });
  });

  return server;
}

function handleMessage(userId: string, raw: string) {
  try {
    const msg = JSON.parse(raw);
    // Route to appropriate handler based on msg.type
    logger.debug(`WS message from ${userId}: ${msg.type}`);
  } catch {
    logger.warn(`Invalid WS message from ${userId}`);
  }
}

export { wss, connectionManager };