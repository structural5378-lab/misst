import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Immediately removes the caller from RadioScope.
// Called on logout, app close, tab hidden, or location permission revoked/disabled.
// Does NOT delete the presence record — it flips sharing_location off so the
// user's cached coordinates are never rendered as a live marker again.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: true, cleared: false, reason: 'no session' });

    const uid = String(user.mybb_uid || user.id);
    const existing = await base44.entities.ChatPresence.filter({ user_uid: uid });
    const rec = existing?.[0];
    if (rec) {
      await base44.entities.ChatPresence.update(rec.id, {
        sharing_location: false,
        location_expires_at: new Date(Date.now() - 1000).toISOString(),
      });
    }
    return Response.json({ ok: true, cleared: !!rec });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});