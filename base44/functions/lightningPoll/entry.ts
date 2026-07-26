import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  getActiveProviderName, getProvider, processLightningStrikesBatch,
  deleteExpiredStrikes, getProviderState, updateProviderState, bumpStrikesToday, bumpNotificationsToday,
  todayStr,
} from '../../shared/lightning.ts';

// lightningPoll — scheduled background service.
//
// LIVE provider path (production):
//   1. Fetch latest strikes from the API (only since the previous poll).
//   2. Dedupe by provider_strike_id (DB + in-memory cache).
//   3. Persist new strikes (processed=true → entity automation skips them).
//   4. Process the batch against enabled users (real-time delivery).
//   5. Retention sweep (delete expired strikes).
//   6. Update LightningProviderState (health, latency, counters).
//
// MOCK provider path (dev/test):
//   Process any unprocessed existing strikes (fallback safety net).
//
// Reliability: retry with exponential backoff inside the provider; on failure the
// state records the error and the app keeps serving cached strikes. Never crashes.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const name = getActiveProviderName();
    const provider = getProvider(name, base44);

    let newCount = 0, processed = 0, checked = 0, expired = 0;
    let health = "ok", lastError = "", latencyMs = 0, rateLimit = "";

    if (name === "live") {
      const st: any = await getProviderState(base44);
      const sinceMs = st?.last_poll_at ? new Date(st.last_poll_at).getTime() : Date.now() - 30 * 60_000;
      const t0 = Date.now();
      try {
        const raw: any[] = await provider.getLatestStrikes(sinceMs);
        latencyMs = Date.now() - t0;
        checked = raw.length;

        // dedupe against persisted strikes by provider_strike_id
        const ids = raw.map((r: any) => r.provider_strike_id).filter(Boolean);
        const existingSet = new Set<string>();
        if (ids.length) {
          const ex = await base44.asServiceRole.entities.LightningStrike
            .filter({ provider_strike_id: { $in: ids } }, "-created_date", 1000)
            .catch(() => []);
          (ex || []).forEach((e: any) => existingSet.add(e.provider_strike_id));
        }
        const fresh = raw.filter((r: any) => r.provider_strike_id && !existingSet.has(r.provider_strike_id));
        if (fresh.length) {
          const rows = fresh.slice(0, 1000).map((r: any) => ({
            latitude: r.latitude, longitude: r.longitude,
            strike_time: r.strike_time, provider: "live",
            provider_strike_id: r.provider_strike_id,
            strike_type: r.strike_type || "", intensity: r.intensity ?? null,
            metadata: r.metadata || "", processed: true,
          }));
          const created: any = await base44.asServiceRole.entities.LightningStrike.bulkCreate(rows);
          const createdArr = Array.isArray(created) ? created : [];
          newCount = createdArr.length;
          // process the freshly-persisted batch (real ids) for delivery
          const res = await processLightningStrikesBatch(base44, createdArr);
          processed = res.processed;
          await bumpNotificationsToday(base44, res.processed);
        }
      } catch (e: any) {
        health = "down";
        lastError = String(e?.message || e).slice(0, 240);
        latencyMs = Date.now() - t0;
      }
      await bumpStrikesToday(base44, newCount);
    } else {
      // mock: process any unprocessed existing strikes (fallback)
      const strikes: any[] = await provider.getLatestStrikes(Date.now() - 30 * 60_000);
      checked = strikes.length;
      const unprocessed = strikes.filter((s: any) => !s.processed);
      if (unprocessed.length) {
        const res = await processLightningStrikesBatch(base44, unprocessed);
        processed = res.processed;
        for (const s of unprocessed) {
          await base44.asServiceRole.entities.LightningStrike.update(s.id, { processed: true }).catch(() => {});
        }
        await bumpNotificationsToday(base44, res.processed);
      }
    }

    // retention sweep
    expired = await deleteExpiredStrikes(base44, 30);

    // update provider state
    const st: any = await getProviderState(base44);
    const today = todayStr();
    const reset = st?.stats_date !== today;
    const patch: any = {
      provider: name,
      last_poll_at: new Date().toISOString(),
      rate_limit_status: rateLimit || (name === "live" ? "ok" : "n/a"),
    };
    if (health === "ok") {
      patch.health = "ok";
      patch.last_successful_update = new Date().toISOString();
      patch.consecutive_failures = 0;
      patch.last_error = "";
      const prevAvg = st?.avg_response_time_ms || 0;
      patch.avg_response_time_ms = prevAvg ? Math.round(prevAvg * 0.7 + latencyMs * 0.3) : latencyMs;
    } else {
      patch.health = "down";
      patch.last_error = lastError;
      patch.last_error_at = new Date().toISOString();
      patch.consecutive_failures = (st?.consecutive_failures || 0) + 1;
    }
    patch.total_strikes_today = (reset ? 0 : st?.total_strikes_today || 0) + newCount;
    patch.notifications_sent_today = (reset ? 0 : st?.notifications_sent_today || 0) + processed;
    patch.stats_date = today;
    await updateProviderState(base44, patch);

    return Response.json({ ok: true, provider: name, checked, newStrikes: newCount, processed, expired });
  } catch (error) {
    // never crash the notification service
    return Response.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}