/**
 * PushAlert Configuration — Push notification API key (optional).
 */
import { env } from './env';

export const pushalertConfig = {
  apiKey: env.PUSHALERT_API_KEY ?? null,
};