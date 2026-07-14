import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Super Admin user management — list users and perform privileged actions.
// Only callers with an active platform_owner or platform_admin PlatformRole may use this.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const callerRoles = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
    const isPlatformAdmin = (callerRoles || []).some(r => r.role === 'platform_owner' || r.role === 'platform_admin');
    if (!isPlatformAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { action, target_user_id, fields } = body;

    if (action === 'list') {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
      return Response.json({ success: true, users });
    }

    if (!target_user_id) return Response.json({ error: 'target_user_id is required' }, { status: 400 });

    let update = {};
    switch (action) {
      case 'set_role':
        update = { role: fields?.role === 'admin' ? 'admin' : 'user' };
        break;
      case 'suspend':
        update = { is_platform_suspended: true };
        break;
      case 'unsuspend':
        update = { is_platform_suspended: false };
        break;
      case 'ban':
        update = { is_banned: true };
        break;
      case 'unban':
        update = { is_banned: false };
        break;
      case 'mute':
        update = { is_muted: true };
        break;
      case 'unmute':
        update = { is_muted: false };
        break;
      case 'verify':
        update = { is_verified: true };
        break;
      case 'unverify':
        update = { is_verified: false };
        break;
      case 'reset_reputation':
        update = { reputation: 0 };
        break;
      case 'reset_badges':
        update = { badges: 0 };
        await base44.asServiceRole.entities.UserAchievement.deleteMany({ user_id: target_user_id });
        break;
      case 'reset_avatar':
        update = { avatar_url: '' };
        break;
      case 'update_profile':
        update = {
          callsign: fields?.callsign,
          location: fields?.location,
          bio: fields?.bio,
          mybb_username: fields?.mybb_username
        };
        Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
        break;
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.User.update(target_user_id, update);
    return Response.json({ success: true, user: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});