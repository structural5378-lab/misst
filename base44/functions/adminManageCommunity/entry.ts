import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform-wide community management for Global Admins only.
// Gated on PlatformRole (platform_owner / platform_admin). Every mutating
// action is written to PlatformAuditLog for full traceability.

async function isPlatformAdmin(base44, user) {
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

async function logAudit(base44, user, ip, entry) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id,
      admin_email: user.email || '',
      action: entry.action,
      target_type: entry.target_type || '',
      target_id: entry.target_id || '',
      target_name: entry.target_name || '',
      community_id: entry.community_id || '',
      community_name: entry.community_name || '',
      previous_value: entry.previous_value ? JSON.stringify(entry.previous_value) : '',
      new_value: entry.new_value ? JSON.stringify(entry.new_value) : '',
      ip_address: ip || '',
      notes: entry.notes || ''
    });
  } catch { /* audit is best-effort */ }
}

const ENTITY_MAP = {
  ForumThread: 'ForumThread',
  Event: 'Event',
  Repeater: 'Repeater',
  Net: 'Net',
  ForumPost: 'ForumPost',
  MarketplaceItem: 'MarketplaceItem'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await isPlatformAdmin(base44, user);
    if (!admin && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
      || req.headers.get('cf-connecting-ip') || '';
    const body = await req.json().catch(() => ({}));
    const { action, community_id, target_user_id, fields, community_ids } = body;

    // --- list (enriched with member + moderator counts) ---
    if (action === 'list') {
      const communities = await base44.asServiceRole.entities.Community.list('-created_date', 500);
      const members = await base44.asServiceRole.entities.CommunityMember.filter({ is_active: true }, '-created_date', 5000);
      const agg = {};
      for (const m of members || []) {
        if (!agg[m.community_id]) agg[m.community_id] = { members: 0, moderators: 0 };
        agg[m.community_id].members++;
        if (m.role === 'moderator' || m.role === 'community_admin' || m.role === 'community_owner') {
          agg[m.community_id].moderators++;
        }
      }
      const enriched = communities.map((c) => ({
        ...c,
        member_count_real: agg[c.id]?.members ?? c.member_count ?? 0,
        moderator_count: agg[c.id]?.moderators ?? 0
      }));
      return Response.json({ success: true, communities: enriched });
    }

    // --- bulk status / delete ---
    if (['bulk_suspend', 'bulk_activate', 'bulk_archive', 'bulk_delete'].includes(action)) {
      const ids = community_ids || [];
      if (!ids.length) return Response.json({ error: 'community_ids required' }, { status: 400 });
      if (action === 'bulk_delete') {
        for (const id of ids) {
          await base44.asServiceRole.entities.CommunityMember.deleteMany({ community_id: id }).catch(() => {});
          await base44.asServiceRole.entities.CommunitySettings.deleteMany({ community_id: id }).catch(() => {});
          await base44.asServiceRole.entities.CommunityRole.deleteMany({ community_id: id }).catch(() => {});
          await base44.asServiceRole.entities.Community.delete(id).catch(() => {});
        }
        await logAudit(base44, user, ip, { action: 'community_delete', target_type: 'community', target_id: ids.join(','), notes: `Bulk delete ${ids.length} communities` });
        return Response.json({ success: true, deleted: ids.length });
      }
      const statusMap = { bulk_suspend: 'suspended', bulk_activate: 'active', bulk_archive: 'archived' };
      for (const id of ids) await base44.asServiceRole.entities.Community.update(id, { status: statusMap[action] });
      const auditAction = action === 'bulk_suspend' ? 'community_suspend' : action === 'bulk_activate' ? 'community_reactivate' : 'community_archive';
      await logAudit(base44, user, ip, { action: auditAction, target_type: 'community', target_id: ids.join(','), notes: `Bulk ${statusMap[action]} ${ids.length} communities` });
      return Response.json({ success: true, updated: ids.length });
    }

    if (!community_id) return Response.json({ error: 'community_id is required' }, { status: 400 });
    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);
    if (!community) return Response.json({ error: 'Community not found' }, { status: 404 });

    // --- update settings ---
    if (action === 'update') {
      const allowed = ['name', 'description', 'category', 'callsign', 'location', 'logo_url', 'banner_url', 'primary_color', 'accent_color', 'visibility', 'primary_repeater', 'frequency', 'pl_tone', 'is_listed'];
      const update = {};
      for (const k of allowed) if (fields && fields[k] !== undefined) update[k] = fields[k];
      // Numeric columns must never receive an empty string — coerce blanks to null.
      for (const k of ['frequency', 'location_lat', 'location_lon']) {
        if (k in update) {
          if (update[k] === '' || update[k] === null || update[k] === undefined) update[k] = null;
          else { const n = Number(update[k]); update[k] = Number.isNaN(n) ? null : n; }
        }
      }
      const updated = await base44.asServiceRole.entities.Community.update(community_id, update);
      if (fields && fields.join_mode) {
        const s = await base44.asServiceRole.entities.CommunitySettings.filter({ community_id });
        if (s && s[0]) await base44.asServiceRole.entities.CommunitySettings.update(s[0].id, { join_mode: fields.join_mode });
        else await base44.asServiceRole.entities.CommunitySettings.create({ community_id, join_mode: fields.join_mode });
      }
      await logAudit(base44, user, ip, { action: 'community_update', target_type: 'community', target_id: community_id, community_name: community.name, previous_value: community, new_value: update });
      return Response.json({ success: true, community: updated });
    }

    // --- suspend / reactivate / archive ---
    if (action === 'suspend' || action === 'reactivate' || action === 'archive') {
      const map = { suspend: 'suspended', reactivate: 'active', archive: 'archived' };
      const prev = community.status;
      const updated = await base44.asServiceRole.entities.Community.update(community_id, { status: map[action] });
      await logAudit(base44, user, ip, { action: `community_${action}`, target_type: 'community', target_id: community_id, community_name: community.name, previous_value: prev, new_value: map[action] });
      return Response.json({ success: true, community: updated });
    }

    // --- clone ---
    if (action === 'clone') {
      const base = community.name.replace(/\s*\(copy\)$/i, '');
      const slug = `${community.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
      const clone = await base44.asServiceRole.entities.Community.create({
        name: `${base} (Copy)`,
        slug,
        category: community.category,
        description: community.description,
        callsign: community.callsign,
        owner_id: user.id,
        owner_name: user.full_name || user.email,
        visibility: community.visibility,
        status: 'active',
        timezone: community.timezone,
        location: community.location,
        location_lat: community.location_lat,
        location_lon: community.location_lon,
        primary_repeater: community.primary_repeater,
        frequency: community.frequency,
        pl_tone: community.pl_tone,
        primary_color: community.primary_color,
        accent_color: community.accent_color,
        plan: 'free',
        is_listed: false,
        member_count: 0
      });
      await logAudit(base44, user, ip, { action: 'community_clone', target_type: 'community', target_id: clone.id, community_name: clone.name, notes: `Cloned from ${community.name}` });
      return Response.json({ success: true, community: clone });
    }

    // --- backup (JSON snapshot) ---
    if (action === 'backup') {
      const settings = await base44.asServiceRole.entities.CommunitySettings.filter({ community_id });
      const members = await base44.asServiceRole.entities.CommunityMember.filter({ community_id }, '-created_date', 5000);
      const snapshot = { community, settings: (settings && settings[0]) || null, members: members || [], exported_at: new Date().toISOString(), exported_by: user.email };
      await logAudit(base44, user, ip, { action: 'community_backup', target_type: 'community', target_id: community_id, community_name: community.name });
      return Response.json({ success: true, snapshot });
    }

    // --- delete ---
    if (action === 'delete') {
      await base44.asServiceRole.entities.CommunityMember.deleteMany({ community_id }).catch(() => {});
      await base44.asServiceRole.entities.CommunitySettings.deleteMany({ community_id }).catch(() => {});
      await base44.asServiceRole.entities.CommunityRole.deleteMany({ community_id }).catch(() => {});
      await base44.asServiceRole.entities.Community.delete(community_id).catch(() => {});
      await logAudit(base44, user, ip, { action: 'community_delete', target_type: 'community', target_id: community_id, community_name: community.name });
      return Response.json({ success: true });
    }

    // --- transfer ownership ---
    if (action === 'transfer_ownership') {
      if (!target_user_id) return Response.json({ error: 'target_user_id required' }, { status: 400 });
      const tm = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
      const target = (tm && tm[0]) || null;
      if (!target) return Response.json({ error: 'Target is not a member' }, { status: 404 });
      const oldOwner = community.owner_id;
      const ownerMembers = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: oldOwner, community_id });
      if (ownerMembers && ownerMembers[0]) {
        await base44.asServiceRole.entities.CommunityMember.update(ownerMembers[0].id, { role: 'community_admin' });
      }
      await base44.asServiceRole.entities.CommunityMember.update(target.id, { role: 'community_owner' });
      const tUser = await base44.asServiceRole.entities.User.get(target_user_id).catch(() => null);
      const updated = await base44.asServiceRole.entities.Community.update(community_id, {
        owner_id: target_user_id,
        owner_name: tUser?.full_name || target.user_name || tUser?.email || ''
      });
      await logAudit(base44, user, ip, { action: 'ownership_transfer', target_type: 'community', target_id: community_id, community_name: community.name, previous_value: oldOwner, new_value: target_user_id });
      return Response.json({ success: true, community: updated });
    }

    // --- member actions ---
    if (['remove_member', 'ban_member', 'unban_member', 'promote_moderator', 'demote_moderator', 'promote_admin'].includes(action)) {
      if (!target_user_id) return Response.json({ error: 'target_user_id required' }, { status: 400 });
      const tm = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
      const target = (tm && tm[0]) || null;
      if (!target) return Response.json({ error: 'Member not found' }, { status: 404 });
      let patch = {};
      let auditAction = '';
      if (action === 'remove_member') { patch = { status: 'left', is_active: false }; auditAction = 'member_remove'; }
      else if (action === 'ban_member') { patch = { status: 'banned', is_active: false }; auditAction = 'member_ban'; }
      else if (action === 'unban_member') { patch = { status: 'active', is_active: true }; auditAction = 'member_unban'; }
      else if (action === 'promote_moderator') { patch = { role: 'moderator' }; auditAction = 'member_promote'; }
      else if (action === 'demote_moderator') { patch = { role: 'member' }; auditAction = 'member_demote'; }
      else if (action === 'promote_admin') { patch = { role: 'community_admin' }; auditAction = 'member_promote'; }
      const updated = await base44.asServiceRole.entities.CommunityMember.update(target.id, patch);
      if (action === 'remove_member' || action === 'ban_member') {
        if (target.status === 'active') {
          await base44.asServiceRole.entities.Community.update(community_id, { member_count: Math.max(0, (community.member_count || 1) - 1) });
        }
      } else if (action === 'unban_member') {
        await base44.asServiceRole.entities.Community.update(community_id, { member_count: (community.member_count || 0) + 1 });
      }
      await logAudit(base44, user, ip, { action: auditAction, target_type: 'member', target_id: target_user_id, target_name: target.user_name || '', community_id, community_name: community.name, previous_value: { status: target.status, role: target.role }, new_value: patch });
      return Response.json({ success: true, member: updated });
    }

    // --- send announcement ---
    if (action === 'send_announcement') {
      const { title, message } = body;
      if (!title || !message) return Response.json({ error: 'title and message required' }, { status: 400 });
      await base44.asServiceRole.entities.Alert.create({ title, message, type: 'system', community_id, community_name: community.name, is_read: false });
      const members = await base44.asServiceRole.entities.CommunityMember.filter({ community_id, is_active: true, status: 'active' }, '-created_date', 5000);
      for (const m of members || []) {
        if (m.user_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: m.user_email, subject: `[${community.name}] ${title}`, body: message }).catch(() => {});
        }
      }
      await logAudit(base44, user, ip, { action: 'announcement_send', target_type: 'community', target_id: community_id, community_name: community.name, notes: title });
      return Response.json({ success: true, recipients: (members || []).length });
    }

    // --- content actions ---
    if (typeof action === 'string' && action.startsWith('content_')) {
      const { entity_type, entity_id } = body;
      if (!entity_type || !entity_id) return Response.json({ error: 'entity_type and entity_id required' }, { status: 400 });
      const ename = ENTITY_MAP[entity_type];
      if (!ename) return Response.json({ error: 'Unsupported entity type' }, { status: 400 });
      if (['content_pin', 'content_unpin', 'content_lock', 'content_unlock', 'content_feature', 'content_unfeature'].includes(action) && entity_type !== 'ForumThread') {
        return Response.json({ error: 'Pin/lock/feature only supported on threads' }, { status: 400 });
      }
      if (action === 'content_restore' && !['ForumThread', 'ForumPost', 'MarketplaceItem'].includes(entity_type)) {
        return Response.json({ error: 'Restore not supported for this type' }, { status: 400 });
      }
      const E = base44.asServiceRole.entities[ename];
      let result = {};
      if (action === 'content_delete') {
        await E.delete(entity_id).catch(() => {});
        result = { deleted: true };
      } else if (action === 'content_pin' || action === 'content_unpin') {
        await E.update(entity_id, { is_pinned: action === 'content_pin' });
        result = { pinned: action === 'content_pin' };
      } else if (action === 'content_lock' || action === 'content_unlock') {
        await E.update(entity_id, { is_locked: action === 'content_lock' });
        result = { locked: action === 'content_lock' };
      } else if (action === 'content_feature' || action === 'content_unfeature') {
        await E.update(entity_id, { is_featured: action === 'content_feature' });
        result = { featured: action === 'content_feature' };
      } else if (action === 'content_restore') {
        await E.update(entity_id, { is_deleted: false });
        result = { restored: true };
      } else {
        return Response.json({ error: 'Unknown content action' }, { status: 400 });
      }
      await logAudit(base44, user, ip, { action, target_type: 'content', target_id: entity_id, target_name: entity_type, community_id, community_name: community.name });
      return Response.json({ success: true, ...result });
    }

    // --- audit list ---
    if (action === 'audit_list') {
      const logs = await base44.asServiceRole.entities.PlatformAuditLog.filter({ community_id }, '-created_date', 500);
      return Response.json({ success: true, logs: logs || [] });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});