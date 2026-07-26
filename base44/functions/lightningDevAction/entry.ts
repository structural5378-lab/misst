import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  generateRandomStrike, generateStorm, clearStrikes, replayLastHour,
  getActiveProviderName, getProvider,
} from '../../shared/lightning.ts';

// lightningDevAction — admin-only testing endpoint for the "Lightning" dev panel.
// Actions: generate_random | generate_storm | clear_storm | replay_last_hour.
// Creating strikes triggers the entity automation (lightningOnStrike) for real-time
// delivery to enabled users with a live location.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    let res: any;

    if (action === 'generate_random') {
      res = await generateRandomStrike(base44, user);
    } else if (action === 'generate_storm') {
      res = await generateStorm(base44, user, Number(body.count) || 12);
    } else if (action === 'clear_storm') {
      res = await clearStrikes(base44);
    } else if (action === 'replay_last_hour') {
      res = await replayLastHour(base44, user, Number(body.count) || 30);
    } else if (action === 'health') {
      const provider = getProvider(getActiveProviderName(), base44);
      res = { health: await provider.healthCheck(), provider: provider.name };
    } else {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    return Response.json({ ok: true, action, ...res });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});