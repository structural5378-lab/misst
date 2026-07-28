import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// updateCommunitySettings — community-scoped settings editor.
//
// SECURITY: Only the community owner/admin (or a platform admin) may update
// settings. Permission is verified server-side against the caller's
// CommunityMember role — never trusted from the client. Every change is
// written to CommunityAuditLog. Community admins can only touch their own
// community; no global/platform settings are exposed here.

const ADMIN_ROLES = ['community_owner', 'community_admin'];

// Fields that live on the Community entity.
const COMMUNITY_KEYS = [
  'name', 'description', 'logo_url', 'banner_url', 'category', 'visibility',
  'accent_color', 'primary_color', 'timezone', 'location', 'primary_repeater',
  'frequency', 'pl_tone',
];

// Fields that live on the CommunitySettings entity.
const SETTINGS_KEYS = [
  'tags', 'welcome_message', 'community_rules', 'default_rooms',
  'default_member_role', 'net_schedule_defaults', 'website', 'social_links',
  'contact_info', 'join_mode', 'auto_approve', 'features_enabled',
  'quiet_hours_start', 'quiet_hours_end', 'marketplace_public', 'nav_config',
  'dashboard_widgets',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();
    const updates = body.updates || {};
    if (!community_id) return Response.json({ error: 'community_id required' }, { status: 400 });

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);
    if (!community) return Response.json({ error: 'Community not found' }, { status: 404 });

    // Authorization: community admin/owner or platform admin.
    const mine = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id, community_id, is_active: true,
    });
    const membership = (mine && mine[0]) || null;
    const isPlatformAdmin = user.role === 'admin';
    const isCommunityAdmin = !!membership && ADMIN_ROLES.includes(membership.role);
    if (!isPlatformAdmin && !isCommunityAdmin) {
      return Response.json({ error: 'Access denied: community admin role required' }, { status: 403 });
    }

    const communityUpdate = {};
    const settingsUpdate = {};
    const changed = [];
    for (const k of COMMUNITY_KEYS) {
      if (updates[k] !== undefined && updates[k] !== null && String(community[k]) !== String(updates[k])) {
        communityUpdate[k] = updates[k];
        changed.push(k);
      }
    }
    for (const k of SETTINGS_KEYS) {
      if (updates[k] !== undefined) {
        settingsUpdate[k] = updates[k];
        changed.push(k);
      }
    }

    if (Object.keys(communityUpdate).length) {
      await base44.asServiceRole.entities.Community.update(community_id, communityUpdate);
    }

    let settings = null;
    const existing = await base44.asServiceRole.entities.CommunitySettings.filter({ community_id });
    settings = (existing && existing[0]) || null;
    if (Object.keys(settingsUpdate).length) {
      if (settings) {
        await base44.asServiceRole.entities.CommunitySettings.update(settings.id, settingsUpdate);
      } else {
        settingsUpdate.community_id = community_id;
        settings = await base44.asServiceRole.entities.CommunitySettings.create(settingsUpdate);
      }
    }

    // Audit log.
    try {
      await base44.asServiceRole.entities.CommunityAuditLog.create({
        community_id,
        community_name: community.name,
        admin_id: user.id,
        admin_name: user.full_name || user.email,
        action: 'update_settings',
        target_user_id: '',
        target_user_name: '',
        reason: changed.length ? 'Updated: ' + changed.join(', ') : 'Settings updated',
      });
    } catch (e) {
      console.error('[updateCommunitySettings][audit]', e.message);
    }

    const updatedCommunity = await base44.asServiceRole.entities.Community.get(community_id).catch(() => community);
    return Response.json({ success: true, community: updatedCommunity, settings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});