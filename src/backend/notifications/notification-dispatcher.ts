/**
 * Notification Dispatcher — Routes notifications to the correct delivery channels
 * based on user preferences.
 */

import { notificationPreferencesService } from './preferences.service';
import { quietHoursService } from './quiet-hours.service';
import { pushChannel } from './channels/push.channel';
import { emailChannel } from './channels/email.channel';
import { inAppChannel } from './channels/in-app.channel';
import { logger } from '../logging';

export interface NotificationPayload {
  userId: string;
  type: 'chat' | 'forum' | 'event' | 'alert' | 'system' | 'friend_request' | 'location' | 'mention';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

class NotificationDispatcher {
  async dispatch(payload: NotificationPayload): Promise<void> {
    try {
      // Always create in-app notification
      await inAppChannel.send(payload);

      // Check user preferences
      const prefs = await notificationPreferencesService.get(payload.userId);
      if (!prefs[payload.type]) return;

      // Check quiet hours
      if (quietHoursService.isQuietHours(prefs)) {
        logger.debug(`Suppressing push for user ${payload.userId} — quiet hours`);
        return;
      }

      // Send push notification
      await pushChannel.send(payload);
    } catch (error) {
      logger.error('Failed to dispatch notification', error);
    }
  }

  async broadcastEmergency(payload: Omit<NotificationPayload, 'userId'>, userIds: string[]): Promise<void> {
    // Emergency alerts bypass quiet hours and preferences
    await Promise.allSettled(
      userIds.map((userId) =>
        inAppChannel.send({ ...payload, userId }).then(() =>
          pushChannel.send({ ...payload, userId }),
        ),
      ),
    );
  }
}

export const notificationDispatcher = new NotificationDispatcher();