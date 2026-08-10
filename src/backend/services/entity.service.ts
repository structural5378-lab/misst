/**
 * Generic Entity Service — Applies RLS authorization on top of the repository.
 *
 * Every operation enforces the entity's Base44 RLS intent (ownership / platform
 * admin / public) before touching the database. Read operations filter the
 * result set through the read rule; write operations check the matching rule
 * per record.
 */
import { getEntitySchema } from '../entities/entitySchemas';
import { getRepository } from '../repositories/entity.repository';
import { canRead, canCreate, canUpdate, canDelete, AuthUser } from '../entities/authorization';
import { AppError } from '../utils/errors';

function requireEntity(name: string) {
  const schema = getEntitySchema(name);
  if (!schema) throw new AppError('ENTITY_NOT_FOUND', `Unknown entity: ${name}`, 404);
  return schema;
}

export const entityService = {
  async list(name: string, user: AuthUser, sort?: string, limit?: number, offset?: number) {
    requireEntity(name);
    const rows = await getRepository(name).list(sort, limit, offset);
    return rows.filter((row: any) => canRead(name, user, row));
  },

  async filter(name: string, user: AuthUser, query: any, sort?: string, limit?: number) {
    requireEntity(name);
    const rows = await getRepository(name).filter(query, sort, limit);
    return rows.filter((row: any) => canRead(name, user, row));
  },

  async get(name: string, user: AuthUser, id: string) {
    requireEntity(name);
    const row = await getRepository(name).get(id);
    if (!row) throw new AppError('NOT_FOUND', `${name} not found`, 404);
    if (!canRead(name, user, row)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    return row;
  },

  async create(name: string, user: AuthUser, data: any) {
    requireEntity(name);
    if (!canCreate(name, user, data)) throw new AppError('FORBIDDEN', 'Insufficient permissions to create', 403);
    return getRepository(name).create(data, user.id);
  },

  async update(name: string, user: AuthUser, id: string, data: any) {
    requireEntity(name);
    const repo = getRepository(name);
    const row = await repo.get(id);
    if (!row) throw new AppError('NOT_FOUND', `${name} not found`, 404);
    if (!canUpdate(name, user, row)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    return repo.update(id, data);
  },

  async delete(name: string, user: AuthUser, id: string) {
    requireEntity(name);
    const repo = getRepository(name);
    const row = await repo.get(id);
    if (!row) throw new AppError('NOT_FOUND', `${name} not found`, 404);
    if (!canDelete(name, user, row)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    return repo.delete(id);
  },

  async bulkCreate(name: string, user: AuthUser, items: any[]) {
    requireEntity(name);
    for (const it of items) {
      if (!canCreate(name, user, it)) throw new AppError('FORBIDDEN', 'Insufficient permissions to create', 403);
    }
    return getRepository(name).bulkCreate(items, user.id);
  },

  async bulkUpdate(name: string, user: AuthUser, items: { id: string; [k: string]: any }[]) {
    requireEntity(name);
    const repo = getRepository(name);
    const out: any[] = [];
    for (const it of items) {
      const row = await repo.get(it.id);
      if (!row) continue;
      if (!canUpdate(name, user, row)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
      const updated = await repo.update(it.id, it);
      if (updated) out.push(updated);
    }
    return out;
  },

  async updateMany(name: string, user: AuthUser, filter: any, updateOps: any) {
    requireEntity(name);
    const repo = getRepository(name);
    const rows = await repo.filter(filter);
    const updatable = rows.filter((row: any) => canUpdate(name, user, row));
    if (!updatable.length) return { modified: 0, has_more: false };
    return repo.updateMany({ id: { $in: updatable.map((r: any) => r.id) } }, updateOps);
  },

  async deleteMany(name: string, user: AuthUser, filter: any) {
    requireEntity(name);
    const repo = getRepository(name);
    const rows = await repo.filter(filter);
    const deletable = rows.filter((row: any) => canDelete(name, user, row));
    if (!deletable.length) return { deleted: 0 };
    return repo.deleteMany({ id: { $in: deletable.map((r: any) => r.id) } });
  },

  async count(name: string, user: AuthUser, filter?: any) {
    const rows = await this.filter(name, user, filter || {});
    return rows.length;
  },

  /** Returns the public schema (properties + required) — no RLS/table internals. */
  schema(name: string) {
    const s = requireEntity(name);
    return { name: s.name, properties: s.properties, required: s.required };
  },
};