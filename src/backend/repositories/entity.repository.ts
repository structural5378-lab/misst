/**
 * Generic Entity Repository — CRUD for any entity defined in the registry.
 *
 * One class backs all 69 entities. Column names are validated against the
 * entity schema (properties + built-ins) to prevent SQL injection. Query
 * filters use a MongoDB-style subset translated to parameterized SQL:
 *   equality, $gte, $gt, $lte, $lt, $ne, $in, $nin, $exists, $and, $or.
 *
 * Built-in columns on every table: id, created_date, updated_date, created_by_id.
 */
import { getPool } from '../db';
import { EntitySchema, getEntitySchema } from '../entities/entitySchemas';

const BUILTINS = new Set(['id', 'created_date', 'updated_date', 'created_by_id']);

export class EntityRepository {
  private pool = getPool();
  private columns: Set<string>;

  constructor(private schema: EntitySchema) {
    this.columns = new Set([...BUILTINS, ...Object.keys(schema.properties)]);
  }

  private col(name: string): string {
    if (!this.columns.has(name)) throw new Error(`Unknown column "${name}" for entity ${this.schema.name}`);
    return `"${name}"`;
  }

  // --- ORDER BY -------------------------------------------------------------
  private buildOrder(sort?: string): string {
    if (!sort) return '';
    const parts: string[] = [];
    for (const p of sort.split(',').map((s) => s.trim()).filter(Boolean)) {
      const desc = p.startsWith('-');
      const name = desc ? p.slice(1) : p;
      if (!this.columns.has(name)) continue;
      parts.push(`"${name}" ${desc ? 'DESC' : 'ASC'}`);
    }
    return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
  }

  // --- WHERE ----------------------------------------------------------------
  private buildWhere(query: any, params: any[]): string {
    if (!query || typeof query !== 'object' || Object.keys(query).length === 0) return '';
    const parts: string[] = [];
    for (const [key, val] of Object.entries(query)) {
      if (key === '$and') {
        const subs = (val as any[]).map((c) => this.buildWhere(c, params)).filter(Boolean);
        if (subs.length) parts.push(`(${subs.join(' AND ')})`);
      } else if (key === '$or') {
        const subs = (val as any[]).map((c) => this.buildWhere(c, params)).filter(Boolean);
        if (subs.length) parts.push(`(${subs.join(' OR ')})`);
      } else if (this.columns.has(key)) {
        parts.push(this.fieldCondition(key, val, params));
      }
    }
    return parts.length ? ` WHERE ${parts.join(' AND ')}` : '';
  }

  private fieldCondition(key: string, val: any, params: any[]): string {
    const col = `"${key}"`;
    if (val === null) return `${col} IS NULL`;
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).some((k) => k.startsWith('$'))) {
      const clauses: string[] = [];
      for (const [op, operand] of Object.entries(val)) {
        if (op === '$gte') { params.push(operand); clauses.push(`${col} >= $${params.length}`); }
        else if (op === '$gt') { params.push(operand); clauses.push(`${col} > $${params.length}`); }
        else if (op === '$lte') { params.push(operand); clauses.push(`${col} <= $${params.length}`); }
        else if (op === '$lt') { params.push(operand); clauses.push(`${col} < $${params.length}`); }
        else if (op === '$ne') { params.push(operand); clauses.push(`${col} <> $${params.length}`); }
        else if (op === '$in') { params.push(operand); clauses.push(`${col} = ANY($${params.length})`); }
        else if (op === '$nin') { params.push(operand); clauses.push(`${col} <> ALL($${params.length})`); }
        else if (op === '$exists') { clauses.push(operand ? `${col} IS NOT NULL` : `${col} IS NULL`); }
      }
      return clauses.join(' AND ');
    }
    params.push(val);
    return `${col} = $${params.length}`;
  }

  // --- Read operations ------------------------------------------------------
  async list(sort?: string, limit?: number, offset?: number): Promise<any[]> {
    const lim = Number.isFinite(limit) ? Math.max(1, Math.min(1000, limit as number)) : 100;
    const off = Number.isFinite(offset) ? Math.max(0, offset as number) : 0;
    const sql = `SELECT * FROM "${this.schema.table}"${this.buildOrder(sort)} LIMIT ${lim} OFFSET ${off}`;
    const res = await this.pool.query(sql);
    return res.rows;
  }

  async filter(query: any, sort?: string, limit?: number): Promise<any[]> {
    const params: any[] = [];
    const where = this.buildWhere(query, params);
    const lim = Number.isFinite(limit) ? Math.max(1, Math.min(1000, limit as number)) : 1000;
    const sql = `SELECT * FROM "${this.schema.table}"${where}${this.buildOrder(sort)} LIMIT ${lim}`;
    const res = await this.pool.query(sql, params);
    return res.rows;
  }

  async get(id: string): Promise<any | null> {
    const res = await this.pool.query(`SELECT * FROM "${this.schema.table}" WHERE "id" = $1`, [id]);
    return res.rows[0] || null;
  }

  async count(filter?: any): Promise<number> {
    const params: any[] = [];
    const where = this.buildWhere(filter || {}, params);
    const res = await this.pool.query(`SELECT COUNT(*)::int AS count FROM "${this.schema.table}"${where}`, params);
    return res.rows[0].count;
  }

  // --- Write operations -----------------------------------------------------
  async create(data: any, userId?: string): Promise<any> {
    const input: any = { ...data };
    if (userId && input.created_by_id === undefined) input.created_by_id = userId;
    delete input.id;
    delete input.created_date;
    delete input.updated_date;
    const keys = Object.keys(input).filter((k) => this.columns.has(k));
    const values = keys.map((k) => input[k]);
    if (!keys.length) {
      const res = await this.pool.query(`INSERT INTO "${this.schema.table}" DEFAULT VALUES RETURNING *`);
      return res.rows[0];
    }
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const res = await this.pool.query(
      `INSERT INTO "${this.schema.table}" (${cols}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return res.rows[0];
  }

  async update(id: string, data: any): Promise<any | null> {
    const input: any = { ...data };
    delete input.id;
    delete input.created_date;
    delete input.updated_date;
    delete input.created_by_id;
    const keys = Object.keys(input).filter((k) => this.columns.has(k));
    if (!keys.length) return this.get(id);
    const sets = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = keys.map((k) => input[k]);
    const res = await this.pool.query(
      `UPDATE "${this.schema.table}" SET ${sets}, "updated_date" = NOW() WHERE "id" = $1 RETURNING *`,
      [id, ...values],
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM "${this.schema.table}" WHERE "id" = $1 RETURNING id`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Bulk operations ------------------------------------------------------
  async bulkCreate(items: any[], userId?: string): Promise<any[]> {
    if (!items.length) return [];
    const cleaned = items.map((it) => {
      const o: any = { ...it };
      if (userId && o.created_by_id === undefined) o.created_by_id = userId;
      delete o.id;
      delete o.created_date;
      delete o.updated_date;
      return o;
    });
    const keySet = new Set<string>();
    for (const it of cleaned) for (const k of Object.keys(it)) if (this.columns.has(k)) keySet.add(k);
    const keys = [...keySet];
    if (!keys.length) return [];
    const params: any[] = [];
    const rows = cleaned.map((it) =>
      keys.map((k) => {
        params.push(it[k] ?? null);
        return `$${params.length}`;
      }).join(', '),
    );
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const res = await this.pool.query(
      `INSERT INTO "${this.schema.table}" (${cols}) VALUES ${rows.map((r) => `(${r})`).join(', ')} RETURNING *`,
      params,
    );
    return res.rows;
  }

  async bulkUpdate(items: { id: string; [k: string]: any }[]): Promise<any[]> {
    const out: any[] = [];
    for (const it of items) {
      const { id, ...data } = it;
      const updated = await this.update(id, data);
      if (updated) out.push(updated);
    }
    return out;
  }

  async updateMany(filter: any, updateOps: any): Promise<{ modified: number; has_more: boolean }> {
    const params: any[] = [];
    const where = this.buildWhere(filter, params);
    const sets: string[] = [];
    const addSet = (col: string, val: any) => {
      if (!this.columns.has(col)) return;
      params.push(val);
      sets.push(`"${col}" = $${params.length}`);
    };
    for (const [op, fields] of Object.entries(updateOps || {})) {
      if (op === '$set') for (const [k, v] of Object.entries(fields as any)) addSet(k, v);
      else if (op === '$inc') for (const [k, v] of Object.entries(fields as any)) {
        if (!this.columns.has(k)) continue;
        params.push(v);
        sets.push(`"${k}" = COALESCE("${k}", 0) + $${params.length}`);
      }
      else if (op === '$mul') for (const [k, v] of Object.entries(fields as any)) {
        if (!this.columns.has(k)) continue;
        params.push(v);
        sets.push(`"${k}" = COALESCE("${k}", 0) * $${params.length}`);
      }
      else if (op === '$min') for (const [k, v] of Object.entries(fields as any)) {
        if (!this.columns.has(k)) continue;
        params.push(v);
        sets.push(`"${k}" = LEAST(COALESCE("${k}", $${params.length}), $${params.length})`);
      }
      else if (op === '$max') for (const [k, v] of Object.entries(fields as any)) {
        if (!this.columns.has(k)) continue;
        params.push(v);
        sets.push(`"${k}" = GREATEST(COALESCE("${k}", $${params.length}), $${params.length})`);
      }
      else if (op === '$unset') for (const k of (fields as any[])) {
        if (this.columns.has(k)) sets.push(`"${k}" = NULL`);
      }
      else if (op === '$rename') for (const [k, v] of Object.entries(fields as any)) {
        if (this.columns.has(k) && this.columns.has(v)) sets.push(`"${v}" = "${k}"`, `"${k}" = NULL`);
      }
      else if (op === '$currentDate') for (const k of (fields as any[])) {
        if (this.columns.has(k)) sets.push(`"${k}" = NOW()`);
      }
      else if (op === '$push' || op === '$addToSet') for (const [k, v] of Object.entries(fields as any)) {
        if (!this.columns.has(k)) continue;
        params.push(JSON.stringify([v]));
        sets.push(`"${k}" = COALESCE("${k}", '[]'::jsonb) || $${params.length}::jsonb`);
      }
      else if (op === '$pull') for (const [k, v] of Object.entries(fields as any)) {
        if (!this.columns.has(k)) continue;
        params.push(JSON.stringify(v));
        sets.push(`"${k}" = COALESCE("${k}", '[]'::jsonb) - $${params.length}::jsonb`);
      }
    }
    if (!sets.length) return { modified: 0, has_more: false };
    sets.push(`"updated_date" = NOW()`);
    const res = await this.pool.query(`UPDATE "${this.schema.table}" SET ${sets.join(', ')}${where}`, params);
    return { modified: res.rowCount ?? 0, has_more: false };
  }

  async deleteMany(filter: any): Promise<{ deleted: number }> {
    const params: any[] = [];
    const where = this.buildWhere(filter, params);
    const res = await this.pool.query(`DELETE FROM "${this.schema.table}"${where} RETURNING id`, params);
    return { deleted: res.rowCount ?? 0 };
  }
}

// --- Repository cache --------------------------------------------------------
const cache = new Map<string, EntityRepository>();
export function getRepository(entityName: string): EntityRepository {
  let r = cache.get(entityName);
  if (!r) {
    const schema = getEntitySchema(entityName);
    if (!schema) throw new Error(`Unknown entity: ${entityName}`);
    r = new EntityRepository(schema);
    cache.set(entityName, r);
  }
  return r;
}