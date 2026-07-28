import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// getModerationStats — community-scoped moderation overview for the Community
// Admin dashboard.
//
// SECURITY: caller must be community_owner / community_admin or a platform
// admin. Returns: pending reports, muted members, suspended members, recent
// moderation actions, recent bans/kicks/announcements/room-locks, and recent
// deleted messages. Every list is community-scoped.

const ADMIN_ROLES = ["community_owner", "community_admin"];

function actionCategory(action) {
  if (!action) return "other";
  if (["approve", "reject", "ban", "unban", "suspend", "unsuspend", "mute", "unmute", "kick", "leave"].includes(action)) return "membership";
  if (action.startsWith("set_role")) return "roles";
  if (action.startsWith("message") || action.startsWith("messages_bulk") || action === "room_cleared") return "chat";
  if (["update_settings", "room_updated"].includes(action)) return "settings";
  return "moderation";
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { community_id } = body;
    if (!community_id) return Response.json({ error: "community_id required" }, { status: 400 });

    const mine = await base44.asServiceRole.entities.CommunityMember
      .filter({ user_id: user.id, community_id, is_active: true }, "-joined_date", 10).catch(() => []);
    const me = (mine || [])[0] || null;
    const isCommunityAdmin = me && ADMIN_ROLES.includes(me.role);
    let platformAdmin = false;
    try {
      const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
      platformAdmin = (pr || []).some((r) => r.role === "platform_owner" || r.role === "platform_admin");
    } catch {}
    if (!isCommunityAdmin && !platformAdmin) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const [members, auditLogs, deletedMsgs] = await Promise.all([
      base44.asServiceRole.entities.CommunityMember.filter({ community_id, is_active: true }, "-joined_date", 1000).catch(() => []),
      base44.asServiceRole.entities.CommunityAuditLog.filter({ community_id }, "-created_date", 300).catch(() => []),
      base44.asServiceRole.entities.ChatV2RoomMessage.filter({ community_id, deleted: true }, "-deleted_at", 100).catch(() => []),
    ]);

    const muted = (members || []).filter((m) => m.muted);
    const suspended = (members || []).filter((m) => m.status === "suspended");

    let pendingReports = [] as any[];
    try {
      pendingReports = await base44.asServiceRole.entities.Report.filter({ community_id, status: "pending" }, "-created_date", 50);
    } catch { /* Report schema may differ */ }

    const logs = (auditLogs || []).map((l) => ({ ...l, action_category: l.action_category || actionCategory(l.action) }));
    const recentActions = logs.slice(0, 50);
    const recentBans = logs.filter((l) => l.action === "ban").slice(0, 20);
    const recentKicks = logs.filter((l) => l.action === "kick").slice(0, 20);
    const recentAnnouncements = logs.filter((l) => l.action === "message_announced" || l.action === "messages_bulk_is_announcement_set").slice(0, 20);
    const recentRoomLocks = logs.filter((l) => ["room_cleared", "room_locked", "slow_mode_enabled"].includes(l.action)).slice(0, 20);

    return Response.json({
      counts: {
        muted: muted.length,
        suspended: suspended.length,
        pendingReports: (pendingReports || []).length,
        deletedMessages: (deletedMsgs || []).length,
        totalActions: logs.length,
      },
      muted,
      suspended,
      pendingReports: pendingReports || [],
      recentActions,
      recentBans,
      recentKicks,
      recentAnnouncements,
      recentRoomLocks,
      recentDeleted: (deletedMsgs || []).slice(0, 20),
    });
  } catch (e) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
});