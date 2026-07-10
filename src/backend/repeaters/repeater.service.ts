/**
 * Repeater Service — CRUD and geo-search for repeaters.
 */

import { RepeaterRepository } from '../repositories/repeater.repository';
import { geoSearchService } from './geo-search.service';
import { AppError } from '../utils/errors';

export class RepeaterService {
  constructor(private repeaterRepo: RepeaterRepository) {}

  async search(params: {
    lat?: number;
    lng?: number;
    radius?: number;
    band?: string;
    status?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }) {
    if (params.lat != null && params.lng != null) {
      return geoSearchService.findWithinRadius(
        params.lat,
        params.lng,
        params.radius ?? 50,
        params,
      );
    }
    return this.repeaterRepo.search(params);
  }

  async getById(id: string) {
    const repeater = await this.repeaterRepo.findById(id);
    if (!repeater) throw new AppError('RESOURCE_NOT_FOUND', 'Repeater not found', 404);
    return repeater;
  }

  async create(data: any, userId: string) {
    return this.repeaterRepo.create({ ...data, owner_id: userId });
  }

  async update(id: string, data: any, userId: string, userRole: string) {
    const repeater = await this.getById(id);
    if (repeater.owner_id !== userId && userRole !== 'admin') {
      throw new AppError('FORBIDDEN', 'Cannot edit another user\'s repeater', 403);
    }
    return this.repeaterRepo.update(id, data);
  }

  async delete(id: string, userId: string, userRole: string) {
    const repeater = await this.getById(id);
    if (repeater.owner_id !== userId && userRole !== 'admin') {
      throw new AppError('FORBIDDEN', 'Cannot delete another user\'s repeater', 403);
    }
    await this.repeaterRepo.delete(id);
  }
}