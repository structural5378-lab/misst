import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Live GPS validation gate for RadioScope.
// Rejects: out-of-range coords, null island, low accuracy, stale/older-than-known fixes, future timestamps.
// Writes a validated, TTL-expiring location snapshot to the caller's ChatPresence record.
const TTL_MS = 60 * 1000;
const MAX_ACCURACY_M = 100;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { latitude, longitude, accuracy, speed, heading, source, timestamp } = body || {};

    // --- Coordinate validation ---
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        !isFinite(latitude) || !isFinite(longitude)) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return Response.json({ error: 'Coordinates out of range' }, { status: 400 });
    }
    // Reject null island / placeholder zero coords
    if (latitude === 0 && longitude === 0) {
      return Response.json({ error: 'Null coordinates rejected' }, { status: 400 });
    }

    // --- Accuracy gate ---
    if (typeof accuracy === 'number' && isFinite(accuracy) && accuracy > MAX_ACCURACY_M) {
      return Response.json({ error: 'Accuracy too low', accuracy, max: MAX_ACCURACY_M }, { status: 400 });
    }

    // --- Timestamp validation ---
    const ts = timestamp ? new Date(timestamp) : new Date();
    if (isNaN(ts.getTime())) {
      return Response.json({ error: 'Invalid timestamp' }, { status: 400 });
    }
    // Reject fixes more than 10s in the future (clock skew tolerance)
    if (ts.getTime() - Date.now() > 10000) {
      return Response.json({ error: 'Timestamp in future' }, { status: 400 });
    }

    const uid = String(user.mybb_uid || user.id);

    // Find the caller's presence record (user-scoped respects RLS)
    const existing = await base44.entities.ChatPresence.filter({ user_uid: uid });
    const rec = existing?.[0];

    // --- Stale rejection: never accept a fix older than the most recent known fix ---
    if (rec?.location_updated_at) {
      const existingTs = new Date(rec.location_updated_at).getTime();
      if (!isNaN(existingTs) && ts.getTime() < existingTs) {
        return Response.json(
          { error: 'Stale update rejected — older than most recent known location', status: 'stale' },
          { status: 409 }
        );
      }
    }

    // Infer source from accuracy if not provided
    let inferredSource = source;
    if (!inferredSource || inferredSource === 'unknown') {
      if (typeof accuracy === 'number') {
        if (accuracy <= 25) inferredSource = 'gps';
        else if (accuracy <= 75) inferredSource = 'network';
        else inferredSource = 'low';
      } else {
        inferredSource = 'unknown';
      }
    }

    const expiresAt = new Date(ts.getTime() + TTL_MS).toISOString();
    const patch = {
      latitude,
      longitude,
      gps_accuracy: typeof accuracy === 'number' && isFinite(accuracy) ? accuracy : null,
      gps_speed: typeof speed === 'number' && isFinite(speed) ? speed : null,
      gps_heading: typeof heading === 'number' && isFinite(heading) ? heading : null,
      location_source: inferredSource,
      location_updated_at: ts.toISOString(),
      location_expires_at: expiresAt,
      sharing_location: true,
      status: rec?.status && rec.status !== 'offline' ? rec.status : 'online',
      last_active: new Date().toISOString(),
    };

    if (rec) {
      await base44.entities.ChatPresence.update(rec.id, patch);
      return Response.json({ ok: true, id: rec.id, updated: true, expires_at: expiresAt });
    } else {
      const created = await base44.entities.ChatPresence.create({
        user_uid: uid,
        user_name: user.full_name || user.username || user.email || 'MIST Member',
        user_avatar: user.avatar_url || user.avatar || null,
        ...patch,
      });
      return Response.json({ ok: true, id: created?.id, created: true, expires_at: expiresAt });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});