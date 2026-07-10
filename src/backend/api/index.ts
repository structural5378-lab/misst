/**
 * API Router — Mounts all route modules under /api
 */

import { Router } from 'express';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { profileRoutes } from './routes/profile.routes';
import { chatRoutes } from './routes/chat.routes';
import { groupRoutes } from './routes/group.routes';
import { channelRoutes } from './routes/channel.routes';
import { imageRoutes } from './routes/image.routes';
import { notificationRoutes } from './routes/notification.routes';
import { weatherRoutes } from './routes/weather.routes';
import { repeaterRoutes } from './routes/repeater.routes';
import { mapRoutes } from './routes/map.routes';
import { eventRoutes } from './routes/event.routes';
import { alertRoutes } from './routes/alert.routes';
import { aiRoutes } from './routes/ai.routes';
import { forumRoutes } from './routes/forum.routes';
import { feedRoutes } from './routes/feed.routes';
import { adminRoutes } from './routes/admin.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/profiles', profileRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/groups', groupRoutes);
apiRouter.use('/channels', channelRoutes);
apiRouter.use('/images', imageRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/weather', weatherRoutes);
apiRouter.use('/repeaters', repeaterRoutes);
apiRouter.use('/maps', mapRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/alerts', alertRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/forum', forumRoutes);
apiRouter.use('/feed', feedRoutes);
apiRouter.use('/admin', adminRoutes);