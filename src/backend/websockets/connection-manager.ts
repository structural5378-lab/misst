/**
 * Connection Manager — Tracks active WebSocket connections per user.
 * Supports multiple connections per user (multiple devices).
 */

import { WebSocket } from 'ws';

interface Connection {
  id: string;
  userId: string;
  ws: WebSocket;
  joinedRooms: Set<string>;
}

export class ConnectionManager {
  private connections = new Map<string, Connection>();
  private userConnections = new Map<string, Set<string>>();

  add(userId: string, ws: WebSocket): string {
    const id = `conn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const conn: Connection = { id, userId, ws, joinedRooms: new Set() };
    this.connections.set(id, conn);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(id);

    return id;
  }

  remove(userId: string, connectionId: string): void {
    this.connections.delete(connectionId);
    this.userConnections.get(userId)?.delete(connectionId);
    if (this.userConnections.get(userId)?.size === 0) {
      this.userConnections.delete(userId);
    }
  }

  joinRoom(connectionId: string, room: string): void {
    this.connections.get(connectionId)?.joinedRooms.add(room);
  }

  leaveRoom(connectionId: string, room: string): void {
    this.connections.get(connectionId)?.joinedRooms.delete(room);
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    const connIds = this.userConnections.get(userId);
    if (!connIds) return;

    const message = JSON.stringify({ event, data });
    for (const connId of connIds) {
      const conn = this.connections.get(connId);
      if (conn && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    }
  }

  broadcastToRoom(room: string, event: string, data: unknown, excludeUserId?: string): void {
    const message = JSON.stringify({ event, data });
    for (const conn of this.connections.values()) {
      if (conn.joinedRooms.has(room) && conn.ws.readyState === WebSocket.OPEN) {
        if (!excludeUserId || conn.userId !== excludeUserId) {
          conn.ws.send(message);
        }
      }
    }
  }

  isOnline(userId: string): boolean {
    return (this.userConnections.get(userId)?.size ?? 0) > 0;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userConnections.keys());
  }
}