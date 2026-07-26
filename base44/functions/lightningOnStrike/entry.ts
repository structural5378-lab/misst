import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { processLightningStrike, bumpNotificationsToday } from '../../shared/lightning.ts';

// lightningOnStrike — entity automation fired when a LightningStrike is created.
// Processes the new strike in real time against all enabled users with a live
// location, then marks the strike processed. This is the primary processing path
// for single-record creation (e.g. mock dev actions, future webhook providers);
// lightningPoll owns ingestion for the live polled provider.
//
// Skips strikes already flagged processed (e.g. bulk-created by the live poller,
// which processes them itself) to avoid double work. Dedupe via
// LightningAlertDelivery keeps notifications safe regardless.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const strike = body.data || body;
    if (!strike || !strike.id || !strike.latitude || !strike.longitude) {
      return Response.json({ ok: true, skipped: true });
    }
    // already handled (e.g. live poller bulk-creates with processed=true)
    if (strike.processed === true) {
      return Response.json({ ok: true, skipped: true, reason: "already-processed" });
    }

    const res = await processLightningStrike(base44, strike);

    await base44.asServiceRole.entities.LightningStrike
      .update(strike.id, { processed: true })
      .catch(() => {});

    if (res.processed > 0) await bumpNotificationsToday(base44, res.processed);

    return Response.json({ ok: true, ...res });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}