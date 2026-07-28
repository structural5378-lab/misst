import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { legacyRoleFromSlug, safeParseArr } from '../../shared/communityRbac.ts';
import { resolveCommunityAuth } from '../../shared/communityAuth.ts';

// manageCommunityRoleAssignment — assign / remove / set_primary / list custom
// roles on a community member. Admin gated with hierarchy enforcement: a
// caller cannot assign or remove a role whose rank is equal to or higher than
// their own highest role (unless community owner or platform super-admin). The
// community_owner role can only be assigned by the current owner. After every
// change, CommunityMember.role (legacy enum) is re-synced to the member's
// highest SYSTEM custom role for back-compat with existing moderation checks.
// Every action is audit-logged (category 'roles').

const ADMIN_ROLES = ['community_owner', 'community_admin', 'moderator'];
const LEGACY_RANK: Record<string, number> = {
  guest: 0, member: 1, trusted_member: 2, net_control: 3, moderator: 4, community_admin: 5, community_owner: 6,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const community_id = String(body.community_id || '');
    const target_user_id = String(body.target_user_id || '');
    if (!action || !community_id) return Response.json({ error: 'action and community_id are required' }, { status: 400 });

    const { membership, isOwner, isPlatformAdmin, platformMod, ok } = await resolveCommunityAuth(base44, user, community_id, { requireAdmin: false });
    if (!ok) {
      return Response.json({ error: 'Access denied: moderator role required' }, { status: 403 });
    }

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);

    const logAudit = async (auditAction: string, roleName: string, targetName: string) => {
      try {
        await base44.asServiceRole.entities.CommunityAuditLog.create({
          community_id, community_name: community?.name || '',
          admin_id: user.id, admin_name: user.full_name || user.email,
          action: auditAction, action_category: 'roles',
          target_user_id, target_user_name: targetName || '',
          new_state: roleName,
        });
      } catch (e) { console.error('[manageCommunityRoleAssignment][audit]', e.message); }
    };

    // Determine the caller's highest role position (lower number = higher rank).
    const callerAssignments = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: user.id }, 'role_position', 50).catch(() => []);
    let callerPos = 999;
    (callerAssignments || []).forEach((a: any) => { if (a.role_position < callerPos) callerPos = a.role_position; });
    if (!callerAssignments?.length && membership) callerPos = (LEGACY_RANK[membership.role] ?? 1) * 10;
    // Owner has ultimate authority; platform admin overrides.
    const canTouchAny = isOwner || isPlatformAdmin || platformMod;

    const roles = await base44.asServiceRole.entities.CommunityRoleDefinition.filter({ community_id }, 'position', 200).catch(() => []);
    const roleById: Record<string, any> = {};
    (roles || []).forEach((r: any) => { roleById[r.id] = r; });

    // --- list ---
    if (action === 'list') {
      if (!target_user_id) return Response.json({ error: 'target_user_id is required' }, { status: 400 });
      const a = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: target_user_id }, 'role_position', 50).catch(() => []);
      return Response.json({ assignments: a || [] });
    }

    if (!target_user_id) return Response.json({ error: 'target_user_id is required' }, { status: 400 });

    const targetMembers = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
    const target = (targetMembers && targetMembers[0]) || null;
    if (!target) return Response.json({ error: 'Membership not found' }, { status: 404 });

    const checkHierarchy = (role: any) => {
      if (canTouchAny) return null;
      if (role.slug === 'owner') return 'Only the community owner can assign the Owner role';
      if ((role.position || 999) <= callerPos) return 'Cannot manage a role with equal or higher rank than your own';
      return null;
    };

    const reSyncLegacyAndPrimary = async (assigns: any[]) => {
      // Highest system custom role → legacy enum; highest role overall → primary.
      if (!assigns.length) return;
      const sorted = [...assigns].sort((a, b) => (a.role_position || 999) - (b.role_position || 999));
      const highest = sorted[0];
      const systemAssigns = sorted.filter((a) => roleById[a.role_id]?.is_system);
      const legacySlug = systemAssigns.length ? systemAssigns[0].role_slug : null;
      const legacyRole = legacySlug ? legacyRoleFromSlug(legacySlug) : null;
      if (legacyRole && target.role !== legacyRole) {
        // community_owner is protected — never auto-set here except by owner flow.
        if (legacyRole !== 'community_owner') {
          await base44.asServiceRole.entities.CommunityMember.update(target.id, { role: legacyRole }).catch(() => {});
        }
      }
      // Set primary on the highest assignment.
      const updates = sorted.map((a, idx) => ({ id: a.id, is_primary: idx === 0 }));
      try { await base44.asServiceRole.entities.CommunityMemberRole.bulkUpdate(updates); } catch {}
    };

    // --- assign ---
    if (action === 'assign') {
      const role = roleById[body.role_id];
      if (!role) return Response.json({ error: 'Role not found' }, { status: 404 });
      const err = checkHierarchy(role);
      if (err) return Response.json({ error: err }, { status: 403 });
      const existing = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: target_user_id, role_id: role.id }).catch(() => []);
      if (existing && existing[0]) return Response.json({ success: true, already: true });
      const assign = await base44.asServiceRole.entities.CommunityMemberRole.create({
        community_id, user_id: target_user_id, user_name: target.user_name || '',
        role_id: role.id, role_slug: role.slug, role_name: role.name, role_color: role.color, role_icon: role.icon,
        role_position: role.position, is_primary: false, assigned_by: user.id, assigned_by_email: user.email, assigned_at: new Date().toISOString(),
      });
      const all = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: target_user_id }, 'role_position', 50).catch(() => []);
      await reSyncLegacyAndPrimary(all || []);
      await logAudit('role_assigned', role.name, target.user_name || '');
      return Response.json({ success: true });
    }

    // --- remove ---
    if (action === 'remove') {
      const role = roleById[body.role_id];
      if (role) {
        const err = checkHierarchy(role);
        if (err) return Response.json({ error: err }, { status: 403 });
      }
      const existing = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: target_user_id, role_id: body.role_id }).catch(() => []);
      if (existing && existing[0]) {
        await base44.asServiceRole.entities.CommunityMemberRole.delete(existing[0].id);
      }
      const all = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: target_user_id }, 'role_position', 50).catch(() => []);
      await reSyncLegacyAndPrimary(all || []);
      await logAudit('role_removed', role?.name || body.role_id, target.user_name || '');
      return Response.json({ success: true });
    }

    // --- set_primary ---
    if (action === 'set_primary') {
      const all = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: target_user_id }, 'role_position', 50).catch(() => []);
      const role = roleById[body.role_id];
      if (role) {
        const err = checkHierarchy(role);
        if (err) return Response.json({ error: err }, { status: 403 });
      }
      // Primary = move this role's position to the front by giving it the lowest position.
      // Simpler: set is_primary flags via reSync after reordering by selected role first.
      const sel = (all || []).find((a: any) => a.role_id === body.role_id);
      const rest = (all || []).filter((a: any) => a.role_id !== body.role_id).sort((a, b) => (a.role_position || 999) - (b.role_position || 999));
      const ordered = sel ? [sel, ...rest] : rest;
      await reSyncLegacyAndPrimary(ordered);
      await logAudit('role_primary_set', role?.name || '', target.user_name || '');
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});