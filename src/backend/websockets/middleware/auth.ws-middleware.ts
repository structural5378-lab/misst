import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

/**
 * Authenticate a WebSocket upgrade using the same JWT secret as HTTP auth.
 * Token may be an Authorization Bearer header or `token` / `access_token` query.
 */
export function authenticateWs(req: IncomingMessage): { id: string; email: string; role: string } | null {
  const header = req.headers.authorization;
  let token = '';
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  }
  if (!token && req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      token = url.searchParams.get('token') || url.searchParams.get('access_token') || '';
    } catch {
      token = '';
    }
  }
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      sub?: string;
      email?: string;
      role?: string;
    };
    if (!decoded?.sub) return null;
    return {
      id: decoded.sub,
      email: decoded.email || '',
      role: decoded.role || 'member',
    };
  } catch {
    return null;
  }
}
