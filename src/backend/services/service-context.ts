/**
 * Service Context — Backend-only privileged repository access.
 *
 * This is the MISST Core equivalent of Base44's `base44.asServiceRole`: a path
 * that bypasses Row-Level Security so backend services can perform privileged
 * operations (cross-user writes, counter increments, audit logging,
 * notification fan-out, badge ownership grants).
 *
 * SECURITY CONTRACT — read carefully:
 *   1. This module MUST NEVER be imported by an HTTP route handler or
 *      middleware. It is for Core services and automations only.
 *   2. The browser must never receive a service-role credential. There is no
 *      token, header, or query parameter that grants this context — it is a
 *      plain function call available only inside the Node process.
 *   3. The generic entity HTTP API (/api/entities/:name/*) continues to
 *      enforce normal user RLS via entity.service.ts. This module does NOT
 *      change that.
 *   4. Every caller is responsible for its own authorization checks
 *      (rbac.service / community-access.service) BEFORE using the service
 *      context to mutate data. The service context does not re-check
 *      permissions — it is the trusted inner ring.
 *
 * Usage (inside a Core service only):
 *   const repo = serviceContext.entities('CommunityMember');
 *   await repo.update(memberId, { status: 'active' });
 *   await serviceContext.transaction(async (client) => { ... });
 */
import { getPool, withTransaction, PoolClient } from '../db';
import { getRepository, EntityRepository } from '../repositories/entity.repository';

const serviceContext = {
  /**
   * Return the raw EntityRepository for an entity — NO RLS enforcement.
   * Backend services only. Never expose through an HTTP route.
   */
  entities(name: string): EntityRepository {
    return getRepository(name);
  },

  /** Run a callback inside a single DB transaction (commit/rollback). */
  transaction: withTransaction,

  /** Direct access to the connection pool for ad-hoc privileged queries. */
  pool: getPool,
};

export type ServiceContext = typeof serviceContext;
export { PoolClient };

export default serviceContext;