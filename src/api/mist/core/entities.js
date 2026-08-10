/**
 * MISST Core — Entity data client.
 *
 * Generic CRUD client backing `mist.entities.<Name>` when Core is enabled.
 * Mirrors the Base44 entity SDK surface so the unified facade can delegate
 * here without the frontend knowing which backend it is calling.
 *
 * Realtime subscriptions are intentionally deferred (see migration plan):
 * `subscribe()` returns a no-op unsubscribe so call sites keep working.
 */
import http from './http';

function buildQuery(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function entity(name) {
  const base = `/api/entities/${encodeURIComponent(name)}`;
  return {
    list: (sort, limit) => http.get(`${base}${buildQuery({ sort, limit })}`),

    filter: (query, sort, limit) => http.post(`${base}/filter`, { query, sort, limit }),

    get: (id) => http.get(`${base}/${encodeURIComponent(id)}`),

    create: (data) => http.post(base, data),

    update: (id, data) => http.patch(`${base}/${encodeURIComponent(id)}`, data),

    delete: (id) => http.delete(`${base}/${encodeURIComponent(id)}`),

    bulkCreate: (items) => http.post(`${base}/bulk`, { items }),

    bulkUpdate: (items) => http.patch(`${base}/bulk`, { items }),

    updateMany: (query, update) => http.patch(`${base}/update-many`, { query, update }),

    deleteMany: (query) => http.post(`${base}/delete-many`, { query }),

    schema: () => http.get(`${base}/schema`),

    /**
     * Realtime subscription stub. The Core realtime layer (WebSocket/SSE) is
     * not migrated in this phase; the no-op unsubscribe preserves the Base44
     * `subscribe((event) => {})` contract so callers need not branch.
     */
    subscribe: (_cb) => () => {},
  };
}

export default { entity };