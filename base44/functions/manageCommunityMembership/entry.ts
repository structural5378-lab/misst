import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Community membership lifecycle: join (open), request (private), approve,
 * reject, leave. Enforces per-community join_mode. Admin actions (approve,
 * reject) require community_owner/community_admin or platform admin.
 *
 * @param {Request} req - JSON body: { action, community_id, target_user_id? }
 *   action: 'join' | 'request' | 'approve' | 'reject' | 'leave'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, community_id, target_user_id } = body;
    if (!action || !community_id) {
      return Response.json({ error: 'action and community_id are required' }, { status: 400 });
    }

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);
    if (!community) return Response.json({ error: 'Community not found' }, { status: 404 });

    // Resolve join_mode from settings, falling back to visibility-derived defaults.
    const settingsList = await base44.asServiceRole.entities.CommunitySettings.filter({ community_id });
    const settings = (settingsList && settingsList[0]) || null;
    const joinMode = settings?.join_mode ||
      (community.visibility === 'public' ? 'open' : community.visibility === 'private' ? 'request' : 'invite');

    const existing = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: user.id, community_id });
    const member = (existing && existing[0]) || null;

    const membershipPayload = (status) => ({
      user_id: user.id,
      user_name: user.full_name || user.email,
      user_email: user.email,
      user_callsign: user.callsign || '',
      user_avatar: user.avatar_url || '',
      community_id,
      community_name: community.name,
      community_slug: community.slug,
      role: 'member',
      status,
      joined_date: new Date().toISOString(),
      is_active: true,
    });

    // --- join (open/public) ---
    if (action === 'join') {
      if (joinMode !== 'open') {
        return Response.json({ error: 'This community requires approval or an invitation to join' }, { status: 403 });
      }
      if (member && member.is_active && member.status === 'active') {
        return Response.json({ error: 'You are already a member' }, { status: 409 });
      }
      if (member) {
        await base44.asServiceRole.entities.CommunityMember.update(member.id, { status: 'active', is_active: true, role: 'member', joined_date: new Date().toISOString() });
      } else {
        await base44.asServiceRole.entities.CommunityMember.create(membershipPayload('active'));
      }
      await base44.asServiceRole.entities.CommunityRole.create({
        user_id: user.id, user_email: user.email, community_id, community_name: community.name,
        role: 'member', assigned_by: user.id, assigned_by_email: user.email, is_active: true,
      }).catch(() => {});
      await base44.asServiceRole.entities.Community.update(community.id, { member_count: (community.member_count || 0) + 1 });
      return Response.json({ success: true, status: 'active' });
    }

    // --- request (private) ---
    if (action === 'request') {
      if (joinMode !== 'request') {
        return Response.json({ error: joinMode === 'invite' ? 'This community is invite-only' : 'This community does not accept join requests' }, { status: 403 });
      }
      if (member && member.is_active) {
        return Response.json({ error: 'You already have a membership or pending request' }, { status: 409 });
      }
      if (member) {
        await base44.asServiceRole.entities.CommunityMember.update(member.id, { status: 'pending', is_active: true, role: 'member' });
      } else {
        await base44.asServiceRole.entities.CommunityMember.create(membershipPayload('pending'));
      }
      // Notify community admins/owners of the pending request.
      try {
        const staff = await base44.asServiceRole.entities.CommunityMember.filter({
          community_id, is_active: true
        });
        const admins = (staff || []).filter(m => m.role === 'community_owner' || m.role === 'community_admin');
        for (const a of admins) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: a.user_email,
            subject: `New join request for ${community.name}`,
            body: `${user.full_name || user.email} has requested to join ${community.name}. Review pending requests in your community admin panel.`,
          }).catch(() => {});
        }
      } catch {}
      return Response.json({ success: true, status: 'pending' });
    }

    // --- leave ---
    if (action === 'leave') {
      if (!member) return Response.json({ error: 'Not a member' }, { status: 404 });
      await base44.asServiceRole.entities.CommunityMember.update(member.id, { status: 'left', is_active: false });
      try {
        const roles = await base44.asServiceRole.entities.CommunityRole.filter({ user_id: user.id, community_id });
        await Promise.all((roles || []).map(r => base44.asServiceRole.entities.CommunityRole.update(r.id, { is_active: false })));
      } catch {}
      if (member.status === 'active') {
        await base44.asServiceRole.entities.Community.update(community.id, { member_count: Math.max(0, (community.member_count || 1) - 1) });
      }
      return Response.json({ success: true });
    }

    // --- admin actions (approve / reject) ---
    if (action === 'approve' || action === 'reject') {
      if (!target_user_id) return Response.json({ error: 'target_user_id is required' }, { status: 400 });

      const isAdmin = member && (member.role === 'community_owner' || member.role === 'community_admin');
      let platformAdmin = false;
      try {
        const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
        platformAdmin = (pr || []).some(r => r.role === 'platform_owner' || r.role === 'platform_admin');
      } catch {}
      if (!isAdmin && !platformAdmin) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      const targetMembers = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
      const target = (targetMembers && targetMembers[0]) || null;
      if (!target) return Response.json({ error: 'Membership request not found' }, { status: 404 });

      if (action === 'approve') {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { status: 'active', is_active: true, role: 'member' });
        const targetUser = await base44.asServiceRole.entities.User.get(target_user_id).catch(() => null);
        await base44.asServiceRole.entities.CommunityRole.create({
          user_id: target_user_id,
          user_email: targetUser?.email || target.user_email || '',
          community_id, community_name: community.name,
          role: 'member', assigned_by: user.id, assigned_by_email: user.email, is_active: true,
        }).catch(() => {});
        await base44.asServiceRole.entities.Community.update(community.id, { member_count: (community.member_count || 0) + 1 });
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: targetUser?.email || target.user_email,
            subject: `Welcome to ${community.name}`,
            body: `Your membership request for ${community.name} has been approved. You can now access the community.`,
          }).catch(() => {});
        } catch {}
      } else {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { status: 'left', is_active: false });
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});