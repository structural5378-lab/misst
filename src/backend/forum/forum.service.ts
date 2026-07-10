/**
 * Forum Service — Unified forum API.
 * Delegates to the active connector (MyBB or native).
 */

import { mybbConnector } from './connectors/mybb.connector';
import { ForumLinkRepository } from '../repositories/forum-link.repository';
import { AppError } from '../utils/errors';

export class ForumService {
  constructor(private forumLinkRepo: ForumLinkRepository) {}

  private get connector() {
    // Currently only MyBB is supported; this is the swappable point
    return mybbConnector;
  }

  async listCategories() {
    return this.connector.listCategories();
  }

  async listThreads(categoryId: string, limit = 20, offset = 0) {
    return this.connector.listThreads(categoryId, limit, offset);
  }

  async getThread(threadId: string, page = 1, limit = 20) {
    return this.connector.getThread(threadId, page, limit);
  }

  async createThread(data: { title: string; body: string; category_id: string }, user: any) {
    const thread = await this.connector.createThread(data, user);

    // Store a forum link record for follow tracking
    await this.forumLinkRepo.create({
      link_type: 'mybb_thread',
      external_id: thread.id,
      external_url: thread.url,
      title: data.title,
      category_name: thread.category_name,
      author_name: user.full_name,
      author_callsign: user.callsign,
    });

    return thread;
  }

  async replyToThread(threadId: string, body: string, user: any) {
    return this.connector.replyToThread(threadId, body, user);
  }

  async followThread(threadId: string, userId: string) {
    const link = await this.forumLinkRepo.findByExternalId(threadId);
    if (!link) throw new AppError('RESOURCE_NOT_FOUND', 'Thread not found', 404);
    return this.forumLinkRepo.follow(link.id, userId);
  }

  async unfollowThread(threadId: string, userId: string) {
    const link = await this.forumLinkRepo.findByExternalId(threadId);
    if (!link) return;
    return this.forumLinkRepo.unfollow(link.id, userId);
  }
}