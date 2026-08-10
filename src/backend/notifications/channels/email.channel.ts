/**
 * Email Channel — Sends transactional email (OTP, password reset).
 *
 * Uses nodemailer when SMTP_URL is configured; otherwise logs the message
 * (development mode) so the auth flow works end-to-end without an SMTP
 * server during local setup.
 */
import { logger } from '../../logging';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export const emailChannel = {
  async send(msg: EmailMessage): Promise<void> {
    const transport = process.env.SMTP_URL;
    if (!transport) {
      logger.warn({ to: msg.to, subject: msg.subject }, 'SMTP_URL not set — email not sent (dev mode)');
      return;
    }
    let nodemailer: any;
    try {
      nodemailer = (await import('nodemailer')).default;
    } catch {
      logger.error('nodemailer not installed — cannot send email');
      return;
    }
    const transporter = nodemailer.createTransport(transport);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@mist.local',
      to: msg.to,
      subject: msg.subject,
      text: msg.body,
    });
  },
};