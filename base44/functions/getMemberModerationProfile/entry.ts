import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// getMemberModerationProfile — the moderator's "single pane of glass" for a
// community member. Returns current status, role, active mute/suspension/ban,
// participation counts (messages, reactions, announcements, deleted messages),
// reports filed/against, notes count, last active, join date, and the most
// recent audit history. Community-scoped + server-validated: only community
// moderators/admins (or platform admins) may read another member's profile.

const MOD_ROLES = ['community_owner', 'community_admin', 'moderator'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '');
    const target_user_id = String(body.target_user_id || '');
    if (!community_id || !target_user_id) {
      return Response.json({ error: 'community_id and target_user_id are required' }, { status: 400 });
    }

    const mine = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: user.id, community_id, is_active: true });
    const membership = (mine && mine[0]) || null;
    const isPlatformAdmin = user.role === 'admin';
    let platformMod = false;
    try {
      const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
      platformMod = (pr || []).some(r => r.role === 'platform_owner' || r.role === 'platform_admin');
    } catch {}
    const isMod = membership && MOD_ROLES.includes(membership.role);
    if (!isMod && !isPlatformAdmin && !platformMod) {
      return Response.json({ error: 'Access denied: moderator role required' }, { status: 403 });
    }

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);

    // Membership record (status, role, mute, suspension, ban, join date).
    const targetMembers = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
    const member = (targetMembers && targetMembers[0]) || null;

    // Basic user identity.
    const targetUser = await base44.asServiceRole.entities.User.get(target_user_id).catch(() => null);

    // Participation: messages, reactions, deleted, announcements.
    const messages = await base44.asServiceRole.entities.ChatV2RoomMessage.filter({ sender_id: target_user_id, community_id }, '-created_date', 500).catch(() => []);
    const msgList = messages || [];
    let totalReactions = 0;
    msgList.forEach(m => {
      try {
        const r = m.reactions ? JSON.parse(m.reactions) : {};
        Object.values(r).forEach((arr: any) => { totalReactions += (Array.isArray(arr) ? arr.length : 0); });
      } catch {}
    });
    const deletedMessages = msgList.filter(m => m.deleted).length;
    const announcementsCreated = msgList.filter(m => m.is_announcement).length;

    // Reports filed by and reports against this member.
    const reportsFiled = await base44.asServiceRole.entities.Report.filter({ reporter_id: target_user_id, community_id }, '-created_date', 200).catch(() => []);
    const reportsAgainst = await base44.asServiceRole.entities.Report.filter({ target_owner_id: target_user_id, community_id }, '-created_date', 200).catch(() => []);

    // Moderator notes count.
    const notes = await base44.asServiceRole.entities.ModeratorNote.filter({ community_id, target_user_id }, '-created_date', 100).catch(() => []);

    // Recent audit history scoped to this member.
    const audit = await base44.asServiceRole.entities.CommunityAuditLog.filter({ community_id, target_user_id }, '-created_date', 10).catch(() => []);

    // Last active presence.
    let lastActive = null;
    try {
      const p = await base44.asServiceRole.entities.ChatV2Presence.filter({ user_id: target_user_id }, '-last_heartbeat', 1);
      if (p && p[0]) lastActive = p[0].last_heartbeat || p[0].last_seen || null;
    } catch {}
    if (!lastActive) {
      try {
        const p2 = await base44.asServiceRole.entities.ChatPresence.filter({ user_uid: target_user_id }, '-last_active', 1);
        if (p2 && p2[0]) lastActive = p2[0].last_active || null;
      } catch {}
    }

    return Response.json({
      community: { id: community_id, name: community?.name || '', slug: community?.slug || '' },
      member,
      user: targetUser ? {
        id: targetUser.id, name: targetUser.full_name || targetUser.email,
        email: targetUser.email, avatar: targetUser.avatar_url || '', callsign: targetUser.callsign || '',
      } : null,
      stats: {
        totalMessages: msgList.length,
        totalReactions,
        deletedMessages,
        announcementsCreated,
        reportsFiled: (reportsFiled || []).length,
        reportsAgainst: (reportsAgainst || []).length,
        notesCount: (notes || []).length,
      },
      lastActive,
      recentHistory: audit || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});