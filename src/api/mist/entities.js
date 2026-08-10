/**
 * MISST — Unified `mist.entities` facade.
 *
 * A Proxy that returns a per-entity client on property access:
 *   mist.entities.Todo.list()
 *   mist.entities.Community.filter({ ... })
 *
 * When MISST Core is enabled (VITE_MIST_CORE_API_URL set), each call routes
 * to the Core entity API; otherwise it delegates to the existing Base44 SDK
 * unchanged, preserving current behavior during the migration.
 *
 * This does NOT replace base44.entities directly — `src/api/base44Client.js`
 * stays intact as the fallback. Components can adopt `mist.entities.*`
 * incrementally.
 */
import { base44 } from '@/api/base44Client';
import { isCoreEnabled } from './core/config';
import coreEntities from './core/entities';

function makeEntityFacade(name) {
  const core = () => coreEntities.entity(name);
  const legacy = () => base44.entities[name];

  return {
    list: (...a) => (isCoreEnabled() ? core().list(...a) : legacy().list(...a)),
    filter: (...a) => (isCoreEnabled() ? core().filter(...a) : legacy().filter(...a)),
    get: (...a) => (isCoreEnabled() ? core().get(...a) : legacy().get(...a)),
    create: (...a) => (isCoreEnabled() ? core().create(...a) : legacy().create(...a)),
    update: (...a) => (isCoreEnabled() ? core().update(...a) : legacy().update(...a)),
    delete: (...a) => (isCoreEnabled() ? core().delete(...a) : legacy().delete(...a)),
    bulkCreate: (...a) => (isCoreEnabled() ? core().bulkCreate(...a) : legacy().bulkCreate(...a)),
    bulkUpdate: (...a) => (isCoreEnabled() ? core().bulkUpdate(...a) : legacy().bulkUpdate(...a)),
    updateMany: (...a) => (isCoreEnabled() ? core().updateMany(...a) : legacy().updateMany(...a)),
    deleteMany: (...a) => (isCoreEnabled() ? core().deleteMany(...a) : legacy().deleteMany(...a)),
    subscribe: (...a) => (isCoreEnabled() ? core().subscribe(...a) : legacy().subscribe(...a)),
    schema: (...a) => (isCoreEnabled() ? core().schema(...a) : legacy().schema(...a)),
  };
}

const cache = Object.create(null);

export const entitiesFacade = new Proxy(
  {},
  {
    get(_target, name) {
      if (typeof name === 'symbol' || name === 'then' || name === 'toJSON') return undefined;
      if (cache[name]) return cache[name];
      const facade = makeEntityFacade(name);
      cache[name] = facade;
      return facade;
    },
  },
);

export default entitiesFacade;