import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requirePermission } from '../../shared/rbac.ts';

// getPlatformStats — Super Administrator platform stats endpoint.
//
// Currently implements only the "Platform Online Now" aggregate: the count of
// users with a fresh presence heartbeat across the entire MIST platform.
//
// The response shape is intentionally extensible so future Super Admin widgets
// (total users, users online today, new users today, active sessions,
// communities online, platform health, database status, API response time,
// notification queue, active nets/repeaters/chats) can be added without
// changing the contract — unimplemented metrics are returned as `null`.
//
// SECURITY: Only Super Administrators (RBAC permission `admin.access`) may
// call this endpoint. Community owners/admins/moderators/members receive 403.
// The endpoint never returns per-user data — only the aggregate count — so it
// scales without leaking user records.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ok } = await requirePermission(base44, user, 'admin.access', 'getPlatformStats');
    if (!ok) return Response.json({ error: 'Forbidden: Super Administrator access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    // Online = presence heartbeat updated within this window (default 60s).
    const windowSeconds = Math.min(300, Math.max(15, parseInt(body.online_window_seconds, 10) || 60));
    const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();

    // ChatPresence is the platform-wide heartbeat store: every active client
    // refreshes `last_active` (~30s) and sets `status: 'online'`. We fetch only
    // the matching records (capped) to derive the count — no per-user payload is
    // returned to the client.
    const online = await base44.asServiceRole.entities.ChatPresence.filter(
      { status: 'online', last_active: { $gte: cutoff } },
      '-last_active',
      5000,
    );

    return Response.json({
      success: true,
      metrics: {
        online_now: (online || []).length,
        online_window_seconds: windowSeconds,
        // Future Super Admin platform dashboard metrics (reserved):
        total_users: null,
        users_online_today: null,
        new_users_today: null,
        active_sessions: null,
        communities_online: null,
        platform_health: null,
        database_status: null,
        api_response_time_ms: null,
        notification_queue: null,
        active_nets: null,
        active_repeaters: null,
        active_chats: null,
      },
      server_time: new Date().toISOString(),
      generated_at: Date.now(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});