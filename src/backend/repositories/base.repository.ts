/**
 * Base Repository — Generic CRUD operations.
 * All entity repositories extend this class.
 */

import { Pool, QueryResult } from 'pg';

export abstract class BaseRepository<T> {
  constructor(
    protected pool: Pool,
    protected tableName: string,
  ) {}

  async findById(id: string): Promise<T | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id],
    );
    return result.rows[0] || null;
  }

  async findAll(limit = 50, offset = 0): Promise<T[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return result.rows;
  }

  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await this.pool.query(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    if (filter && Object.keys(filter).length > 0) {
      const keys = Object.keys(filter);
      const values = Object.values(filter);
      const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      const result = await this.pool.query(
        `SELECT COUNT(*) FROM ${this.tableName} WHERE ${whereClause}`,
        values,
      );
      return parseInt(result.rows[0].count, 10);
    }
    const result = await this.pool.query(`SELECT COUNT(*) FROM ${this.tableName}`);
    return parseInt(result.rows[0].count, 10);
  }
}