import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveCommunityAuth } from '../../shared/communityAuth.ts';

// manageModeratorNote — internal staff-only notes attached to community member
// profiles. Actions: list, create, update, delete. Notes are NEVER exposed to
// regular members (entity RLS blocks direct client reads; only this function,
// gated to community moderators/admins, returns them). Every change is written
// to the community audit log (note_added / note_updated / note_deleted).

const MOD_ROLES = ['community_owner', 'community_admin', 'moderator'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const community_id = String(body.community_id || '');
    if (!action || !community_id) {
      return Response.json({ error: 'action and community_id are required' }, { status: 400 });
    }

    const { membership, ok } = await resolveCommunityAuth(base44, user, community_id, { requireAdmin: false });
    if (!ok) {
      return Response.json({ error: 'Access denied: moderator role required' }, { status: 403 });
    }

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);

    const logAudit = async (auditAction: string, targetName: string, reason: string) => {
      try {
        await base44.asServiceRole.entities.CommunityAuditLog.create({
          community_id, community_name: community?.name || '',
          admin_id: user.id, admin_name: user.full_name || user.email,
          action: auditAction, action_category: 'moderation',
          target_user_id: String(body.target_user_id || ''), target_user_name: targetName || '',
          reason: (reason || '').slice(0, 300),
        });
      } catch (e) {
        console.error('[manageModeratorNote][audit]', e.message);
      }
    };

    if (action === 'list') {
      const target_user_id = String(body.target_user_id || '');
      if (!target_user_id) return Response.json({ error: 'target_user_id required' }, { status: 400 });
      const notes = await base44.asServiceRole.entities.ModeratorNote.filter({ community_id, target_user_id }, '-created_date', 200).catch(() => []);
      return Response.json({ notes: notes || [] });
    }

    if (action === 'create') {
      const target_user_id = String(body.target_user_id || '');
      const content = String(body.content || '').trim();
      if (!target_user_id || !content) return Response.json({ error: 'target_user_id and content are required' }, { status: 400 });
      const targetMembers = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: target_user_id, community_id });
      const target = (targetMembers && targetMembers[0]) || null;
      const note = await base44.asServiceRole.entities.ModeratorNote.create({
        community_id, target_user_id, target_user_name: target?.user_name || '',
        author_id: user.id, author_name: user.full_name || user.email, author_role: membership?.role || '',
        content,
      });
      await logAudit('note_added', target?.user_name || '', content);
      return Response.json({ success: true, note });
    }

    if (action === 'update') {
      const note_id = String(body.note_id || '');
      const content = String(body.content || '').trim();
      if (!note_id || !content) return Response.json({ error: 'note_id and content are required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.ModeratorNote.get(note_id).catch(() => null);
      if (!existing) return Response.json({ error: 'Note not found' }, { status: 404 });
      await base44.asServiceRole.entities.ModeratorNote.update(note_id, {
        content, edited_at: new Date().toISOString(), edited_by: user.id, edited_by_name: user.full_name || user.email,
      });
      await logAudit('note_updated', existing.target_user_name || '', content);
      return Response.json({ success: true });
    }

    if (action === 'delete') {
      const note_id = String(body.note_id || '');
      if (!note_id) return Response.json({ error: 'note_id is required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.ModeratorNote.get(note_id).catch(() => null);
      if (!existing) return Response.json({ error: 'Note not found' }, { status: 404 });
      await base44.asServiceRole.entities.ModeratorNote.delete(note_id);
      await logAudit('note_deleted', existing.target_user_name || '', existing.content || '');
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});