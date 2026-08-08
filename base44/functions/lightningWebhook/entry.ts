import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { normalizeStrikeArray } from '../../shared/lightning.ts';

// lightningWebhook — push/webhook ingestion endpoint for realtime lightning providers.
//
// This is the FASTEST AVAILABLE ingestion path: any push-capable provider (webhook,
// SSE bridge, streaming relay) POSTs strikes here the instant it detects them. This
// function authenticates, normalizes, dedupes, and creates LightningStrike records.
// The EXISTING architecture handles the rest with no polling:
//   - LightningStrike create → platform realtime "create" event → RadioScope + Lighting Engine
//   - LightningStrike create → lightningOnStrike entity automation → alert evaluation + push
//
// It does NOT replace lightningPoll (which serves pull-only HTTP providers on a 5-min
// cycle). It is the push path; lightningPoll is the pull path. Both write to the same
// LightningStrike entity; downstream behavior is identical.
//
// AUTH (shared secret, fail-closed):
//   Provider sends header `x-lightning-webhook-secret` (or `Authorization: Bearer <secret>`)
//   matching the LIGHTNING_WEBHOOK_SECRET app secret. If the secret is unset or mismatched,
//   the endpoint rejects (503 not-configured / 401 unauthorized). No valid secret = no
//   ingestion. This is the only ingress an unauthenticated external caller has.
//
// BODY: a single strike object, an array of strikes, or { strikes: [...] } / { data: [...] }.
// Each strike needs latitude + longitude (flexible field names: lat/latitude/Latitude,
// lon/lon/lng/Longitude). time/intensity/type are optional. provider_strike_id (id/strikeId/
// uuid) is used for cross-poll dedupe; if absent, a composite id is synthesized.

const MAX_BATCH = 500;

function getSecret(name: string): string {
  try {
    const v = (secrets as any).get(name);
    return v == null ? "" : String(v);
  } catch {
    return "";
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 1) Fail-closed auth — no valid secret, no ingress.
    const secret = getSecret("LIGHTNING_WEBHOOK_SECRET");
    if (!secret) return Response.json({ error: "Webhook not configured (set LIGHTNING_WEBHOOK_SECRET)" }, { status: 503 });
    const provided =
      req.headers.get("x-lightning-webhook-secret") ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!provided || !timingSafeEqual(provided, secret)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse + normalize (shared with the live polled provider).
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
    // Provider name passes through if the payload declares one (e.g. { provider: "vaisala" });
    // defaults to "live" for any real-provider push. Pass-through only — not invented.
    const providerName = (body && typeof body === "object" && !Array.isArray(body) && body.provider) ? String(body.provider) : "live";
    const strikes = normalizeStrikeArray(body, MAX_BATCH, providerName);
    if (strikes.length === 0) {
      return Response.json({ ok: true, received: 0, created: 0, duplicates: 0 });
    }

    // 3) Dedupe by provider_strike_id against already-persisted strikes (provider
    //    retries / replays never create duplicates). Composite ids (no provider id)
    //    are always treated as fresh — they're unique by lat/lon/time by construction.
    const base44 = createClientFromRequest(req);
    const ids = strikes.map((s) => s.provider_strike_id).filter(Boolean);
    const existing = new Set<string>();
    if (ids.length) {
      const ex = await base44.asServiceRole.entities.LightningStrike
        .filter({ provider_strike_id: { $in: ids } }, "-created_date", 1000)
        .catch(() => []);
      (ex || []).forEach((e: any) => existing.add(e.provider_strike_id));
    }
    const fresh = strikes.filter((s) => s.provider_strike_id && !existing.has(s.provider_strike_id!));
    const duplicates = strikes.length - fresh.length;
    if (fresh.length === 0) {
      return Response.json({ ok: true, received: strikes.length, created: 0, duplicates });
    }

    // 4) Create with processed=false → lightningOnStrike entity automation fires per
    //    record for alert evaluation + push, and the realtime "create" event fires per
    //    record for RadioScope + Lighting Engine. No inline processing needed; no new
    //    system. Database persistence is the RECORD, not the discovery mechanism — the
    //    realtime event (fired by this create) is what downstream consumers subscribe to.
    const rows = fresh.slice(0, MAX_BATCH).map((s) => ({
      latitude: s.latitude,
      longitude: s.longitude,
      strike_time: s.strike_time,
      provider: s.provider,
      provider_strike_id: s.provider_strike_id,
      strike_type: s.strike_type || "",
      intensity: s.intensity ?? null,
      metadata: s.metadata || "",
      processed: false,
    }));
    const created: any = await base44.asServiceRole.entities.LightningStrike.bulkCreate(rows);
    const createdCount = Array.isArray(created) ? created.length : 0;

    return Response.json({ ok: true, received: strikes.length, created: createdCount, duplicates });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}