import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Community membership lifecycle.
 *
 * Actions:
 *   join    — open/public instant join (or instant join via valid invite_code)
 *   request — request to join a private community (auto-approves if settings.auto_approve)
 *   approve — admin approves a pending request
 *   reject  — admin rejects a pending request (status -> 'rejected')
 *   ban     — admin bans a member (status -> 'banned', deactivated)
 *   leave   — member leaves the community
 *
 * Body: { action, community_id, target_user_id?, reason?, invite_code? }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, community_id, target_user_id, reason, invite_code } = body;
    if (!action || !community_id) {
      return Response.json({ error: 'action and community_id are required' }, { status: 400 });
    }

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);
    if (!community) return Response.json({ error: 'Community not found' }, { status: 404 });

    // Resolve join_mode + invite settings from CommunitySettings.
    const settingsList = await base44.asServiceRole.entities.CommunitySettings.filter({ community_id });
    const settings = (settingsList && settingsList[0]) || null;
    const joinMode = settings?.join_mode ||
      (community.visibility === 'public' ? 'open' : community.visibility === 'private' ? 'request' : 'invite');

    // Validate an invite code against the stored settings.
    const inviteValid = (() => {
      if (!invite_code || !settings?.invite_code) return false;
      if (settings.invite_code !== invite_code) return false;
      if (settings.invite_expires && new Date(settings.invite_expires) < new Date()) return false;
      if (settings.invite_max_uses > 0 && (settings.invite_uses || 0) >= settings.invite_max_uses) return false;
      return true;
    })();

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
      join_reason: reason || '',
      joined_date: new Date().toISOString(),
      is_active: status === 'active' || status === 'pending',
    });

    const grantActiveMembership = async () => {
      if (member) {
        await base44.asServiceRole.entities.CommunityMember.update(member.id, {
          status: 'active', is_active: true, role: 'member',
          join_reason: reason || member.join_reason || '',
          joined_date: new Date().toISOString()
        });
      } else {
        await base44.asServiceRole.entities.CommunityMember.create(membershipPayload('active'));
      }
      await base44.asServiceRole.entities.CommunityRole.create({
        user_id: user.id, user_email: user.email, community_id, community_name: community.name,
        role: 'member', assigned_by: user.id, assigned_by_email: user.email, is_active: true,
      }).catch(() => {});
      await base44.asServiceRole.entities.Community.update(community.id, {
        member_count: (community.member_count || 0) + 1
      });
    };

    const consumeInvite = async () => {
      if (inviteValid && settings?.id) {
        await base44.asServiceRole.entities.CommunitySettings.update(settings.id, {
          invite_uses: (settings.invite_uses || 0) + 1
        }).catch(() => {});
      }
    };

    // --- join (open/public, or instant via invite code) ---
    if (action === 'join') {
      if (joinMode !== 'open' && !inviteValid) {
        return Response.json({ error: 'This community requires approval or an invitation to join' }, { status: 403 });
      }
      if (member && member.is_active && member.status === 'active') {
        return Response.json({ error: 'You are already a member' }, { status: 409 });
      }
      await grantActiveMembership();
      await consumeInvite();
      return Response.json({ success: true, status: 'active' });
    }

    // --- request (private) ---
    if (action === 'request') {
      if (joinMode === 'invite' && !inviteValid) {
        return Response.json({ error: 'This community is invite-only' }, { status: 403 });
      }
      if (member && member.is_active && (member.status === 'active' || member.status === 'pending')) {
        return Response.json({ error: 'You already have a membership or pending request' }, { status: 409 });
      }
      // Invite code grants instant access regardless of mode.
      if (inviteValid) {
        await grantActiveMembership();
        await consumeInvite();
        return Response.json({ success: true, status: 'active' });
      }
      // Auto-approve bypasses the pending queue.
      if (settings?.auto_approve) {
        await grantActiveMembership();
        return Response.json({ success: true, status: 'active' });
      }
      if (member) {
        await base44.asServiceRole.entities.CommunityMember.update(member.id, {
          status: 'pending', is_active: true, role: 'member', join_reason: reason || ''
        });
      } else {
        await base44.asServiceRole.entities.CommunityMember.create(membershipPayload('pending'));
      }
      try {
        const staff = await base44.asServiceRole.entities.CommunityMember.filter({ community_id, is_active: true });
        const admins = (staff || []).filter(m => m.role === 'community_owner' || m.role === 'community_admin');
        for (const a of admins) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: a.user_email,
            subject: `New join request for ${community.name}`,
            body: `${user.full_name || user.email} has requested to join ${community.name}.${reason ? `\n\nReason: ${reason}` : ''}\n\nReview pending requests in your community admin panel.`,
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
        await base44.asServiceRole.entities.Community.update(community.id, {
          member_count: Math.max(0, (community.member_count || 1) - 1)
        });
      }
      return Response.json({ success: true });
    }

    // --- admin actions (approve / reject / ban) ---
    if (action === 'approve' || action === 'reject' || action === 'ban') {
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

      const wasActive = target.status === 'active';

      if (action === 'approve') {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, {
          status: 'active', is_active: true, role: 'member'
        });
        const targetUser = await base44.asServiceRole.entities.User.get(target_user_id).catch(() => null);
        await base44.asServiceRole.entities.CommunityRole.create({
          user_id: target_user_id,
          user_email: targetUser?.email || target.user_email || '',
          community_id, community_name: community.name,
          role: 'member', assigned_by: user.id, assigned_by_email: user.email, is_active: true,
        }).catch(() => {});
        if (!wasActive) {
          await base44.asServiceRole.entities.Community.update(community.id, {
            member_count: (community.member_count || 0) + 1
          });
        }
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: targetUser?.email || target.user_email,
            subject: `Welcome to ${community.name}`,
            body: `Your membership request for ${community.name} has been approved. You can now access the community.`,
          }).catch(() => {});
        } catch {}
      } else if (action === 'reject') {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, {
          status: 'rejected', is_active: false
        });
        if (wasActive) {
          await base44.asServiceRole.entities.Community.update(community.id, {
            member_count: Math.max(0, (community.member_count || 1) - 1)
          });
        }
      } else if (action === 'ban') {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, {
          status: 'banned', is_active: false
        });
        try {
          const roles = await base44.asServiceRole.entities.CommunityRole.filter({ user_id: target_user_id, community_id });
          await Promise.all((roles || []).map(r => base44.asServiceRole.entities.CommunityRole.update(r.id, { is_active: false })));
        } catch {}
        if (wasActive) {
          await base44.asServiceRole.entities.Community.update(community.id, {
            member_count: Math.max(0, (community.member_count || 1) - 1)
          });
        }
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});