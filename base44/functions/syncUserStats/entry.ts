import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// syncUserStats — computes a user's lifetime activity stats from existing
// entities (net check-ins, net-control sessions, forum posts, photos) and
// tracks the daily login streak. Persists the result on the UserStats record.
// The `leaderboard` action returns all stats records sorted by check-ins.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // ── Leaderboard action ──
    if (body.action === 'leaderboard') {
      const all = await base44.asServiceRole.entities.UserStats.list('-net_checkins', 200);
      return Response.json({ leaderboard: all });
    }

    // ── Sync action (default) ──
    const mybbUid = body.uid || user.id;

    // Get or create UserStats
    let statsList = await base44.asServiceRole.entities.UserStats.filter({ user_id: user.id });
    let stats: any = statsList[0];
    if (!stats) {
      stats = await base44.asServiceRole.entities.UserStats.create({
        user_id: user.id,
        user_name: user.full_name || user.email || '',
      });
    }

    // Compute stats from existing entities (defensive — entity may not exist yet)
    let netCheckins = 0, netControl = 0, forumPosts = 0, photos = 0;
    try { const r = await base44.asServiceRole.entities.NetCheckIn.filter({ user_id: mybbUid }); netCheckins = r.length; } catch {}
    try { const r = await base44.asServiceRole.entities.NetSession.filter({ net_control_uid: mybbUid }); netControl = r.length; } catch {}
    try { const r = await base44.asServiceRole.entities.ChatMessage.filter({ sender_uid: mybbUid }); forumPosts = r.length; } catch {}
    try { const r = await base44.asServiceRole.entities.GatheringPhoto.filter({ uploader_id: user.id }); photos = r.length; } catch {}

    // Build updated stats (preserve manually-set values, take max with computed)
    const s = stats || {};
    const updated: any = {
      net_checkins: Math.max(s.net_checkins || 0, netCheckins),
      net_control_sessions: Math.max(s.net_control_sessions || 0, netControl),
      forum_posts: Math.max(s.forum_posts || 0, forumPosts),
      photos_uploaded: Math.max(s.photos_uploaded || 0, photos),
    };

    // Daily login streak
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = s.last_login_date;
    if (lastLogin !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = (lastLogin === yesterday) ? (s.daily_login_streak || 0) + 1 : 1;
      updated.daily_login_streak = newStreak;
      updated.longest_login_streak = Math.max(s.longest_login_streak || 0, newStreak);
      updated.last_login_date = today;
    }

    // Persist
    await base44.asServiceRole.entities.UserStats.update(stats.id, updated);

    return Response.json({
      stats: { ...s, ...updated },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});