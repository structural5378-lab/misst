/**
 * User Controller — Handles user HTTP requests, delegates to user.service.
 */
import { Request, Response } from 'express';
import { userService } from '../../services/user.service';
import { sendSuccess, sendError } from '../../utils/response';

export const userController = {
  async getMe(req: Request, res: Response) {
    try {
      const user = await userService.getMe(req.user.id);
      return sendSuccess(res, 200, user);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async updateMe(req: Request, res: Response) {
    try {
      const user = await userService.updateMe(req.user.id, req.body);
      return sendSuccess(res, 200, user);
    } catch (error) {
      return sendError(res, error);
    }
  },
};