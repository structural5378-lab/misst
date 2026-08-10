/**
 * Authorization Engine — Evaluates Base44 RLS rules server-side.
 *
 * The Base44 RLS JSON is a declarative rule language. This module interprets
 * it directly against the authenticated platform user + the record(s) in
 * question, preserving the exact permission intent of every entity without
 * hand-translating 69 rule sets.
 *
 * Supported rule shapes (combined via implicit AND):
 *   {}                                            → allow (public)
 *   { "user_condition": { "role": "admin" } }     → platform admin only
 *   { "created_by_id": "{{user.id}}" }            → record owner
 *   { "data.<field>": "{{user.id}}" }             → record.<field> === user.id
 *   { "data.<field>": <literal> }                 → record.<field> === literal
 *   { "$or":  [rule, ...] }                        → any sub-rule passes
 *   { "$and": [rule, ...] }                        → all sub-rules pass
 *
 * `user` is the platform user from the JWT ({ id, email, role }). Community-
 * scoped roles are enforced separately by existing backend functions
 * (not migrated in this phase) and are intentionally NOT evaluated here.
 */

import { getEntitySchema } from './entitySchemas';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

function resolveValue(val: any, user: AuthUser): any {
  if (typeof val === 'string') {
    return val.replace(/\{\{user\.id\}\}/g, user.id);
  }
  return val;
}

export function evaluateRule(rule: any, user: AuthUser, record: any): boolean {
  if (!rule || typeof rule !== 'object' || Object.keys(rule).length === 0) {
    return true; // {} = allow
  }
  let ok = true;
  for (const [key, val] of Object.entries(rule)) {
    if (key === '$or') {
      ok = ok && (Array.isArray(val) && val.some((r) => evaluateRule(r, user, record)));
    } else if (key === '$and') {
      ok = ok && (Array.isArray(val) && val.every((r) => evaluateRule(r, user, record)));
    } else if (key === 'user_condition') {
      for (const [uk, uv] of Object.entries(val || {})) {
        if ((user as any)[uk] !== uv) {
          ok = false;
          break;
        }
      }
    } else {
      const field = key.startsWith('data.') ? key.slice(5) : key;
      const expected = resolveValue(val, user);
      if ((record as any)?.[field] !== expected) ok = false;
    }
    if (!ok) break;
  }
  return ok;
}

export function canRead(entityName: string, user: AuthUser, record: any): boolean {
  const schema = getEntitySchema(entityName);
  if (!schema) return false;
  return evaluateRule(schema.rls.read, user, record);
}

export function canCreate(entityName: string, user: AuthUser, data: any): boolean {
  const schema = getEntitySchema(entityName);
  if (!schema) return false;
  const synthetic = { ...(data || {}), created_by_id: user.id };
  return evaluateRule(schema.rls.create, user, synthetic);
}

export function canUpdate(entityName: string, user: AuthUser, record: any): boolean {
  const schema = getEntitySchema(entityName);
  if (!schema) return false;
  return evaluateRule(schema.rls.update, user, record);
}

export function canDelete(entityName: string, user: AuthUser, record: any): boolean {
  const schema = getEntitySchema(entityName);
  if (!schema) return false;
  return evaluateRule(schema.rls.delete, user, record);
}