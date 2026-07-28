import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// getModerationAnalytics — aggregated, filterable moderation analytics for a
// community. Returns summary counts plus chart datasets (daily/weekly/monthly
// actions, top moderators, most moderated members/rooms, common reasons, mute
// duration distribution, ban trends, report resolution time). Server-side
// aggregation over CommunityAuditLog, Reports, ChatV2Rooms, CommunityMembers.
// Community-scoped + server-validated (moderator/admin or platform admin).

const MOD_ROLES = ['community_owner', 'community_admin', 'moderator'];

function dayKey(d: string): string { return (d || '').slice(0, 10); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '');
    if (!community_id) return Response.json({ error: 'community_id is required' }, { status: 400 });

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

    // Date range.
    const range = String(body.range || '30d');
    const now = new Date();
    let dateFrom: Date | null = null;
    if (range === 'today') dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (range === '7d') dateFrom = new Date(now.getTime() - 7 * 86400000);
    else if (range === '30d') dateFrom = new Date(now.getTime() - 30 * 86400000);
    else if (range === '90d') dateFrom = new Date(now.getTime() - 90 * 86400000);
    else if (range === 'custom') dateFrom = body.date_from ? new Date(body.date_from) : null;
    const dateTo = body.date_to ? new Date(body.date_to) : null;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);

    const inRange = (d: string) => {
      if (!d) return false;
      const t = new Date(d);
      if (dateFrom && t < dateFrom) return false;
      if (dateTo && t > dateTo) return false;
      return true;
    };

    const audit = await base44.asServiceRole.entities.CommunityAuditLog.filter({ community_id }, '-created_date', 1000).catch(() => []);
    const reports = await base44.asServiceRole.entities.Report.filter({ community_id }, '-created_date', 500).catch(() => []);
    const rooms = await base44.asServiceRole.entities.ChatV2Room.filter({ community_id }, '-created_date', 200).catch(() => []);
    const members = await base44.asServiceRole.entities.CommunityMember.filter({ community_id }, '-created_date', 500).catch(() => []);

    const auditInRange = (audit || []).filter(a => inRange(a.created_date));

    // Summary.
    const activeMutes = (members || []).filter(m => m.muted && (!m.muted_until || new Date(m.muted_until) > now)).length;
    const activeSuspensions = (members || []).filter(m => m.status === 'suspended').length;
    const totalBans = (audit || []).filter(a => a.action === 'ban').length;
    const deletedMessages = auditInRange.filter(a => {
      const act = a.action || '';
      return act.startsWith('message') && act.includes('delete') || act === 'messages_bulk_deleted' || act === 'room_cleared';
    }).length;
    const reportsReviewed = (reports || []).filter(r => r.status !== 'pending' && inRange(r.resolved_at || r.created_date)).length;
    const announcements = auditInRange.filter(a => (a.action || '').includes('announc')).length;
    const lockedRooms = (rooms || []).filter(r => r.is_locked).length;

    // Daily actions.
    const dailyMap: Record<string, number> = {};
    auditInRange.forEach(a => { const k = dayKey(a.created_date); if (k) dailyMap[k] = (dailyMap[k] || 0) + 1; });
    const dailyActions = Object.keys(dailyMap).sort().map(k => ({ date: k, count: dailyMap[k] }));

    // Weekly actions (7-day buckets from now backwards).
    const weeklyMap: Record<string, number> = {};
    auditInRange.forEach(a => {
      const days = Math.floor((now.getTime() - new Date(a.created_date).getTime()) / 86400000);
      const wk = Math.floor(days / 7);
      const key = `W${wk}`;
      weeklyMap[key] = (weeklyMap[key] || 0) + 1;
    });
    const weeklyActions = Object.keys(weeklyMap).sort().map(k => ({ week: k, count: weeklyMap[k] }));

    // Monthly actions.
    const monthlyMap: Record<string, number> = {};
    auditInRange.forEach(a => { const k = (a.created_date || '').slice(0, 7); if (k) monthlyMap[k] = (monthlyMap[k] || 0) + 1; });
    const monthlyActions = Object.keys(monthlyMap).sort().map(k => ({ month: k, count: monthlyMap[k] }));

    const tally = (field: string) => {
      const m: Record<string, number> = {};
      auditInRange.forEach(a => { const v = (a as any)[field]; if (v) m[v] = (m[v] || 0) + 1; });
      return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
    };
    const topModerators = tally('admin_name');
    const mostModeratedMembers = tally('target_user_name');
    const mostModeratedRooms = tally('room_name');

    const reasonMap: Record<string, number> = {};
    auditInRange.forEach(a => {
      const r = (a.reason || '').trim().toLowerCase().slice(0, 48);
      if (r) reasonMap[r] = (reasonMap[r] || 0) + 1;
    });
    const commonReasons = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([reason, count]) => ({ reason, count }));

    // Mute duration distribution.
    const muteBuckets: Record<string, number> = { '<1h': 0, '1-24h': 0, '1-7d': 0, '>7d': 0, permanent: 0 };
    auditInRange.filter(a => a.action === 'mute' || a.action === 'voice_mute').forEach(a => {
      const d = String(a.duration || '').toLowerCase();
      if (!d || d.includes('perm')) { muteBuckets.permanent++; return; }
      const m = d.match(/(\d+(?:\.\d+)?)\s*(h|hour|d|day|w|week|m|min)?/);
      if (!m) { muteBuckets.permanent++; return; }
      const n = Number(m[1]);
      const unit = (m[2] || 'h')[0];
      const hours = unit === 'd' ? n * 24 : unit === 'w' ? n * 168 : unit === 'm' ? n / 60 : n;
      if (hours < 1) muteBuckets['<1h']++;
      else if (hours <= 24) muteBuckets['1-24h']++;
      else if (hours <= 168) muteBuckets['1-7d']++;
      else muteBuckets['>7d']++;
    });
    const muteDurationDistribution = Object.entries(muteBuckets).map(([bucket, count]) => ({ bucket, count }));

    // Ban trends (monthly, all-time).
    const banMap: Record<string, number> = {};
    (audit || []).filter(a => a.action === 'ban').forEach(a => { const k = (a.created_date || '').slice(0, 7); if (k) banMap[k] = (banMap[k] || 0) + 1; });
    const banTrends = Object.keys(banMap).sort().map(k => ({ month: k, count: banMap[k] }));

    // Report resolution time (average hours).
    const resolvedReports = (reports || []).filter(r => r.status !== 'pending' && r.resolved_at && r.created_date);
    let avgHours = 0;
    if (resolvedReports.length) {
      const sum = resolvedReports.reduce((s, r) => s + (new Date(r.resolved_at).getTime() - new Date(r.created_date).getTime()), 0);
      avgHours = sum / resolvedReports.length / 3600000;
    }
    const reportResolutionTime = [{ label: 'Average hours', hours: Math.round(avgHours * 10) / 10, count: resolvedReports.length }];

    return Response.json({
      community: { name: community?.name || '', slug: community?.slug || '' },
      range,
      date_from: dateFrom ? dateFrom.toISOString() : null,
      date_to: dateTo ? dateTo.toISOString() : null,
      generated_at: new Date().toISOString(),
      summary: {
        totalActions: auditInRange.length,
        activeMutes, activeSuspensions, totalBans,
        deletedMessages, reportsReviewed, announcements, lockedRooms,
      },
      charts: {
        dailyActions, weeklyActions, monthlyActions,
        topModerators, mostModeratedMembers, mostModeratedRooms, commonReasons,
        muteDurationDistribution, banTrends, reportResolutionTime,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});