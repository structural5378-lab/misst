/**
 * Auth Controller — Handles HTTP request/response, delegates to services.
 * Never touches the database directly.
 */

import { Request, Response } from 'express';
import { authService } from '../../services/auth.service';
import { sendSuccess, sendError } from '../../utils/response';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, 201, result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async verifyOtp(req: Request, res: Response) {
    try {
      const result = await authService.verifyOtp(req.body);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async resendOtp(req: Request, res: Response) {
    try {
      const result = await authService.resendOtp(req.body.email);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const result = await authService.refreshToken(req.body.refresh_token);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async logout(req: Request, res: Response) {
    try {
      await authService.logout(req.body.refresh_token);
      return sendSuccess(res, 204);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async resetRequest(req: Request, res: Response) {
    await authService.requestPasswordReset(req.body.email);
    return sendSuccess(res, 200, { message: 'If an account exists, a reset link has been sent.' });
  },

  async reset(req: Request, res: Response) {
    try {
      await authService.resetPassword(req.body);
      return sendSuccess(res, 200, { message: 'Password reset successful.' });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async oauthRedirect(req: Request, res: Response) {
    const url = await authService.getOAuthUrl(req.params.provider);
    return res.redirect(url);
  },

  async oauthCallback(req: Request, res: Response) {
    try {
      const result = await authService.handleOAuthCallback(req.params.provider, req.query);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async me(req: Request, res: Response) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return sendSuccess(res, 200, user);
    } catch (error) {
      return sendError(res, error);
    }
  },
};