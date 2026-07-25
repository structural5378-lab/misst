import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Scheduled maintenance: expires ChatPresence records whose live GPS window has
// passed but were never explicitly cleared (e.g. app closed without a clear call).
// This is a safety net — the 60s client-side age filter already hides stale
// markers in real time; this just marks the DB records so sharing_location=false.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled jobs run unattended (no user session). Use service role directly.
    // Direct HTTP invocation is harmless — it only flips already-expired records.
    const all = await base44.asServiceRole.entities.ChatPresence.filter({ sharing_location: true });
    const now = Date.now();
    const expired = (all || []).filter((p) => {
      if (!p.location_expires_at) return true; // sharing with no expiry = stale
      const t = new Date(p.location_expires_at).getTime();
      return !isNaN(t) && t < now;
    });

    let count = 0;
    for (const p of expired) {
      try {
        await base44.asServiceRole.entities.ChatPresence.update(p.id, {
          sharing_location: false,
          location_expires_at: new Date(now - 1000).toISOString(),
        });
        count++;
      } catch (_) { /* skip individual failures */ }
    }
    return Response.json({ ok: true, checked: all?.length || 0, expired: count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});