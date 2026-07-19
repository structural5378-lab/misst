import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requirePermission } from '../../shared/rbac.ts';

// Returns platform-wide statistics for the Super Admin dashboard.
// Enforced through the centralized RBAC engine: requires the admin.access permission.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ok } = await requirePermission(base44, user, 'admin.access', 'getAdminStats');
    if (!ok) return Response.json({ error: 'Forbidden: admin.access required' }, { status: 403 });

    const [users, repeaters, nets, alerts, achievements, messages, posts, onlinePresence] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 500),
      base44.asServiceRole.entities.Repeater.list('-created_date', 500),
      base44.asServiceRole.entities.Net.list('-created_date', 500),
      base44.asServiceRole.entities.Alert.list('-created_date', 500),
      base44.asServiceRole.entities.UserAchievement.list('-created_date', 500),
      base44.asServiceRole.entities.ChatMessage.list('-created_date', 500),
      base44.asServiceRole.entities.ForumPost.list('-created_date', 500),
      base44.asServiceRole.entities.ChatPresence.filter({ status: 'online' }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const newUsersToday = (users || []).filter(u => u.created_date?.startsWith(today)).length;
    const messagesToday = (messages || []).filter(m => m.created_date?.startsWith(today)).length;
    const reportsPending = (alerts || []).filter(a => (a.type === 'warning' || a.type === 'emergency') && !a.is_read).length;

    return Response.json({
      success: true,
      stats: {
        totalUsers: (users || []).length,
        onlineUsers: (onlinePresence || []).length,
        newUsersToday,
        repeaters: (repeaters || []).length,
        activeNets: (nets || []).length,
        forumPosts: (posts || []).length,
        messagesSentToday: messagesToday,
        reportsPending,
        badgesEarned: (achievements || []).length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});