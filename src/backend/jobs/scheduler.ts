/**
 * Job Scheduler — Manages background jobs using cron-style scheduling.
 */

import { logger } from '../logging';
import { notificationCheckJob } from './notification-check.job';
import { eventReminderJob } from './event-reminder.job';
import { weatherAlertPollJob } from './weather-alert-poll.job';
import { repeaterSyncJob } from './repeater-sync.job';
import { sessionCleanupJob } from './session-cleanup.job';
import { tokenCleanupJob } from './token-cleanup.job';
import { locationExpiryJob } from './location-expiry.job';

interface ScheduledJob {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  timer?: NodeJS.Timeout;
}

const jobs: ScheduledJob[] = [
  { name: 'notification-check', intervalMs: 60_000, handler: notificationCheckJob },
  { name: 'event-reminders', intervalMs: 600_000, handler: eventReminderJob },
  { name: 'weather-alert-poll', intervalMs: 900_000, handler: weatherAlertPollJob },
  { name: 'repeater-sync', intervalMs: 3_600_000, handler: repeaterSyncJob },
  { name: 'session-cleanup', intervalMs: 3_600_000, handler: sessionCleanupJob },
  { name: 'token-cleanup', intervalMs: 3_600_000, handler: tokenCleanupJob },
  { name: 'location-expiry', intervalMs: 60_000, handler: locationExpiryJob },
];

export function startScheduler() {
  for (const job of jobs) {
    job.timer = setInterval(async () => {
      try {
        await job.handler();
      } catch (error) {
        logger.error(`Job ${job.name} failed`, error);
      }
    }, job.intervalMs);

    logger.info(`Scheduled job: ${job.name} (every ${job.intervalMs / 1000}s)`);
  }
}

export function stopScheduler() {
  for (const job of jobs) {
    if (job.timer) clearInterval(job.timer);
  }
  logger.info('All scheduled jobs stopped');
}