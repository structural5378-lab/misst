import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getActiveProviderName, getProvider, processLightningStrike } from '../../shared/lightning.ts';

// lightningPoll — scheduled background service (fallback path).
//
// Retrieves the latest strikes from the active LightningProvider and processes any
// that the real-time entity automation missed (processed != true). Dedupe is
// enforced by LightningAlertDelivery, so re-processing is safe.
//
// NOTE: the platform minimum for scheduled automations is 5 minutes. The ideal
// cadence for lightning is sub-minute; Phase 2 (real provider) replaces polling
// with real-time provider ingestion → entity automation. This poller remains as a
// safety net.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const provider = getProvider(getActiveProviderName(), base44);
    const sinceMs = Date.now() - 30 * 60 * 1000; // last 30 min window
    const strikes = await provider.getLatestStrikes(sinceMs);

    let processed = 0;
    for (const s of strikes) {
      if (s.processed) continue;
      try {
        await processLightningStrike(base44, s);
        processed++;
      } catch { /* best-effort per strike */ }
      await base44.asServiceRole.entities.LightningStrike.update(s.id, { processed: true }).catch(() => {});
    }

    return Response.json({ ok: true, provider: provider.name, checked: strikes.length, processed });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});