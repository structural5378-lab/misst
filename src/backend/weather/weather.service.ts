/**
 * Weather Service — Fetches and caches weather data.
 * Delegates to provider implementations.
 */

import { weatherApiProvider } from './providers/weatherapi.provider';
import { noaaProvider } from './providers/noaa.provider';
import { cacheService } from './cache.service';
import { config } from '../config';

export class WeatherService {
  async getCurrentWeather(lat: number, lng: number, units: string = 'imperial') {
    const cacheKey = `weather:${lat}:${lng}:${units}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return { ...cached, _cached: true };

    const data = await weatherApiProvider.getCurrentWeather(lat, lng, units);
    await cacheService.set(cacheKey, data, 900); // 15-min TTL
    return data;
  }

  async getActiveStorms() {
    const cacheKey = 'weather:storms:active';

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const data = await noaaProvider.getActiveStorms();
    await cacheService.set(cacheKey, data, 600); // 10-min TTL
    return data;
  }

  async getRadar(lat: number, lng: number, zoom: number) {
    return weatherApiProvider.getRadarUrl(lat, lng, zoom);
  }
}

export const weatherService = new WeatherService();