/**
 * Logger — Structured logging using pino.
 * All modules import from here, never creating their own logger instances.
 */

import pino from 'pino';
import { config } from '../config';

const transport = config.isProduction
  ? undefined
  : {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    };

export const logger = pino({
  level: config.isProduction ? 'info' : 'debug',
  transport,
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      headers: { 'x-request-id': req.headers?.['x-request-id'] },
    }),
    err: pino.stdSerializers.err,
  },
});