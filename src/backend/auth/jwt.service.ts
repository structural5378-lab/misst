/**
 * JWT Service — Signs and verifies access tokens.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

export const jwtService = {
  sign(payload: { sub: string; email: string; role: string }): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        { ...payload, iss: 'mist', iat: Math.floor(Date.now() / 1000) },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn },
        (err, token) => {
          if (err) reject(err);
          else resolve(token!);
        },
      );
    });
  },

  verify(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
  },
};