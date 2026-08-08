// MISST Lighting Engine — External Event Seam (Phase 1)
//
// Generic, source-agnostic pub/sub that lets any external system request a
// transient visual lighting reaction from the MISST Lighting Engine WITHOUT
// coupling the engine to any producer. This is the single integration point
// between the four decoupled systems:
//
//   RadioScope         = WHERE the event is happening (geographic visualization)
//   Weather/Lightning  = WHAT is happening (LightningStrike, severity, distance)
//   Alert System       = WHO needs to be notified (Notification + push)
//   Lighting Engine    = HOW MISST visually reacts (this module + LightingEffect)
//   Premium Badges     = WHO owns premium visual effects (ownership/purchase)
//
// Flow (future, event-driven — NOT built in Phase 1):
//   Producer (e.g. lightningOnStrike / RadioScope)  →  dispatchLightingEvent(evt)
//   Lighting Engine  ←  subscribeLightingEvents(handler)
//   UI surface       ←  renders a transient LightingEffect from the event
//
// This module owns NO weather logic, NO distance rules, NO severity math. It
// only transports LightingEvent objects. Producers compute severity/distance/
// effect; consumers decide whether and how to react. This keeps the systems
// decoupled and avoids a monolith.
//
// LightingEvent contract (plain data — any field may be omitted except id):
//   id        string  — unique event id (for dedupe / dismiss)
//   effect    string  — registry effect id (e.g. 'thunder_storm'); see effectRegistry
//   accent    string  — hex color override (optional)
//   surface   string  — target surface (SURFACES.radioscope | .weather | .notification | …)
//   intensity string  — 'minimal' | 'normal' | 'performance' override (optional)
//   duration  number  — ms the reaction should last before auto-dismiss (optional)
//   severity  number  — 0–100 producer-computed severity (optional)
//   distance  number  — miles from the user (optional; from the existing Haversine engine)
//   location  { lat, lon } (optional)
//   age       number  — strike age in ms (optional)
//   source    string  — 'weather' | 'alert' | 'system' | 'badge' | …
//   metadata  object  — producer-specific extras (optional)
//
// Phase 1 status: seam only. Nothing dispatches yet and nothing subscribes yet.
// Phase 2+ will wire producers (e.g. lightningOnStrike → dispatchLightingEvent)
// and consumers (e.g. a RadioScope overlay or weather-card glow subscribes and
// renders a transient LightingEffect). No rewrite of this seam will be needed.

const listeners = new Set();

// Dispatch a LightingEvent to all subscribers. Best-effort: a throwing
// listener never blocks other listeners or the producer.
export function dispatchLightingEvent(event) {
  if (!event || !event.id) return;
  for (const fn of listeners) {
    try {
      fn(event);
    } catch {
      /* best-effort per listener — never propagate */
    }
  }
}

// Subscribe to LightingEvents. Returns an unsubscribe function.
export function subscribeLightingEvents(handler) {
  if (typeof handler !== 'function') return () => {};
  listeners.add(handler);
  return () => listeners.delete(handler);
}