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

    // Community-scoped audit log. Written via service role (bypasses RLS) for
    // every admin action in this function. Visible only to community admins
    // through getCommunityAdminStats — never exposed to other communities.
    const logAudit = async (action, targetId, targetName, reasonText) => {
      try {
        await base44.asServiceRole.entities.CommunityAuditLog.create({
          community_id,
          community_name: community.name,
          admin_id: user.id,
          admin_name: user.full_name || user.email,
          action,
          target_user_id: targetId || '',
          target_user_name: targetName || '',
          reason: reasonText || '',
        });
      } catch (e) {
        console.error('[manageCommunityMembership][audit]', e.message);
      }
    };

    // --- join (open/public, or instant via invite code) ---
    // Public communities are always joinable by authenticated users unless
    // explicitly locked (join_mode === 'closed'). This keeps the backend
    // gate in sync with the directory card, which offers "Join Community"
    // for every visibility='public' community regardless of join_mode —
    // the previous gate (joinMode !== 'open') caused a 403 whenever a
    // public community's settings carried a non-open join_mode.
    if (action === 'join') {
      const isClosed = joinMode === 'closed';
      const instantAllowed = joinMode === 'open' || community.visibility === 'public' || inviteValid;
      console.log('[manageCommunityMembership][join]', {
        user_id: user.id, community_id, visibility: community.visibility,
        join_mode: joinMode, has_member: !!member, member_status: member?.status ?? null,
        invite_valid: inviteValid, is_closed: isClosed, instant_allowed: instantAllowed,
      });
      // Idempotent FIRST: an existing active membership always succeeds,
      // never a 409/403 — even if the community was later closed or locked.
      // Banned users are NOT "active members" and stay blocked below.
      if (member && member.is_active && member.status === 'active') {
        return Response.json({ success: true, status: 'active', already_member: true });
      }
      if (isClosed && !inviteValid) {
        console.warn('[manageCommunityMembership][join] rejected: community closed');
        return Response.json({ error: 'This community is closed to new members', code: 'closed' }, { status: 403 });
      }
      if (!instantAllowed) {
        console.warn('[manageCommunityMembership][join] rejected: approval/invite required');
        return Response.json({ error: 'This community requires approval or an invitation to join', code: 'approval_required' }, { status: 403 });
      }
      // Banned users cannot rejoin on their own.
      if (member && member.status === 'banned') {
        console.warn('[manageCommunityMembership][join] rejected: banned user', user.id);
        return Response.json({ error: 'You are banned from this community', code: 'banned' }, { status: 403 });
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
      await logAudit(action, target_user_id, target.user_name, reason);
      return Response.json({ success: true });
    }

    // --- set_role (community admin/owner assigns a role to a member) ---
    // Guarded: caller must be a community_owner/admin or platform admin. The
    // community_owner role is protected (transfer is a separate concern), and
    // only the owner (or platform admin) may assign the community_admin role.
    // This is the ONLY path that changes a member's role — direct client
    // CommunityMember.update is blocked by RLS.
    if (action === 'set_role') {
      const role = String(body.role || '').trim();
      const VALID_ROLES = ['community_admin', 'net_control', 'moderator', 'trusted_member', 'member', 'guest'];
      if (!target_user_id || !role) {
        return Response.json({ error: 'target_user_id and role are required' }, { status: 400 });
      }
      if (!VALID_ROLES.includes(role)) {
        return Response.json({ error: 'Invalid role' }, { status: 400 });
      }

      const isCallerAdmin = member && (member.role === 'community_owner' || member.role === 'community_admin');
      let platformAdmin = false;
      try {
        const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
        platformAdmin = (pr || []).some(r => r.role === 'platform_owner' || r.role === 'platform_admin');
      } catch {}
      if (!isCallerAdmin && !platformAdmin) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      const targetMembers = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
      const target = (targetMembers && targetMembers[0]) || null;
      if (!target) return Response.json({ error: 'Membership not found' }, { status: 404 });

      // Protect the community_owner role — it cannot be reassigned here.
      if (target.role === 'community_owner') {
        return Response.json({ error: 'Cannot modify the community owner role' }, { status: 403 });
      }
      // Only the community owner (or platform admin) may grant community_admin.
      const isCallerOwner = member && member.role === 'community_owner';
      if (role === 'community_admin' && !isCallerOwner && !platformAdmin) {
        return Response.json({ error: 'Only the community owner can assign the admin role' }, { status: 403 });
      }

      await base44.asServiceRole.entities.CommunityMember.update(target.id, { role });
      // Keep the CommunityRole mirror in sync.
      try {
        const roles = await base44.asServiceRole.entities.CommunityRole.filter({ user_id: target_user_id, community_id });
        await Promise.all((roles || []).map(r => base44.asServiceRole.entities.CommunityRole.update(r.id, { role, is_active: true })));
      } catch {}
      await logAudit('set_role:' + role, target_user_id, target.user_name, reason);
      return Response.json({ success: true, role });
    }

    // --- suspend / unsuspend / mute / unmute / kick / unban ---
    // Community admin/owner moderation actions. The community_owner role is
    // protected — it can never be moderated here. All actions are scoped to
    // THIS community's membership and logged to the community audit log.
    if (['suspend', 'unsuspend', 'mute', 'unmute', 'kick', 'unban'].includes(action)) {
      if (!target_user_id) return Response.json({ error: 'target_user_id is required' }, { status: 400 });

      const MOD_ROLES_LOCAL = ['community_owner', 'community_admin', 'moderator'];
      const RANK_LOCAL = { guest: 0, member: 1, trusted_member: 2, net_control: 3, moderator: 4, community_admin: 5, community_owner: 6 };
      const isMod = member && MOD_ROLES_LOCAL.includes(member.role);
      let platformAdmin = false;
      try {
        const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
        platformAdmin = (pr || []).some(r => r.role === 'platform_owner' || r.role === 'platform_admin');
      } catch {}
      if (!isMod && !platformAdmin) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      const targetMembers = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
      const target = (targetMembers && targetMembers[0]) || null;
      if (!target) return Response.json({ error: 'Membership not found' }, { status: 404 });

      // Privilege escalation: a moderator cannot act on equal/higher roles.
      // Platform admins override. The community owner is always immune.
      const targetRank = RANK_LOCAL[target.role] ?? 1;
      const callerRank = RANK_LOCAL[member?.role] ?? 0;
      if (target.role === 'community_owner' || (targetRank >= callerRank && !platformAdmin)) {
        return Response.json({ error: 'Cannot moderate a member with equal or higher role' }, { status: 403 });
      }

      if (action === 'suspend') {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { status: 'suspended', is_active: false });
      } else if (action === 'unsuspend') {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { status: 'active', is_active: true });
      } else if (action === 'mute') {
        const hours = body.mute_duration_hours ? Number(body.mute_duration_hours) : 0;
        const mutedUntil = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : '';
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { muted: true, muted_until: mutedUntil });
      } else if (action === 'unmute') {
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { muted: false, muted_until: '' });
      } else if (action === 'kick') {
        const wasActive = target.status === 'active';
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { status: 'left', is_active: false });
        try {
          const roles = await base44.asServiceRole.entities.CommunityRole.filter({ user_id: target_user_id, community_id });
          await Promise.all((roles || []).map(r => base44.asServiceRole.entities.CommunityRole.update(r.id, { is_active: false })));
        } catch {}
        if (wasActive) {
          await base44.asServiceRole.entities.Community.update(community.id, {
            member_count: Math.max(0, (community.member_count || 1) - 1)
          });
        }
      } else if (action === 'unban') {
        // Unbanning releases the member; they may re-request to join.
        await base44.asServiceRole.entities.CommunityMember.update(target.id, { status: 'left', is_active: false });
      }

      await logAudit(action, target_user_id, target.user_name, reason);
      return Response.json({ success: true, action });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});