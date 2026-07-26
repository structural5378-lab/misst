import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { processLightningStrike } from '../../shared/lightning.ts';

// lightningOnStrike — entity automation fired when a LightningStrike is created.
// Processes the new strike in real time against all enabled users with a live
// location, then marks the strike processed. This is the primary processing path;
// lightningPoll is the fallback.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const strike = body.data || body;
    if (!strike || !strike.id || !strike.latitude || !strike.longitude) {
      return Response.json({ ok: true, skipped: true });
    }

    const res = await processLightningStrike(base44, strike);

    // Mark processed so the poller skips it (fallback safety net)
    await base44.asServiceRole.entities.LightningStrike
      .update(strike.id, { processed: true })
      .catch(() => {});

    return Response.json({ ok: true, ...res });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});