/**
 * Weather Configuration — External weather API key (optional).
 */
import { env } from './env';

export const weatherConfig = {
  apiKey: env.WEATHER_API_KEY ?? null,
};