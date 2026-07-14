import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Assigns a platform role to a user. Only platform_owner can call this.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller is platform_owner
    const callerRoles = await base44.asServiceRole.entities.PlatformRole.filter({
      user_id: user.id,
      role: 'platform_owner',
      is_active: true
    });

    if (!callerRoles || callerRoles.length === 0) {
      return Response.json({ error: 'Forbidden — only platform owners can assign platform roles' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, role_id, target_user_id, target_user_email, role } = body;

    if (action === 'revoke') {
      if (!role_id) return Response.json({ error: 'role_id is required' }, { status: 400 });
      const revoked = await base44.asServiceRole.entities.PlatformRole.update(role_id, { is_active: false });
      return Response.json({ success: true, role: revoked });
    }

    if (!target_user_id || !role) {
      return Response.json({ error: 'target_user_id and role are required' }, { status: 400 });
    }

    const validRoles = ['platform_owner', 'platform_admin', 'platform_support'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    // Check if target already has this role
    const existing = await base44.asServiceRole.entities.PlatformRole.filter({
      user_id: target_user_id,
      role: role,
      is_active: true
    });

    if (existing && existing.length > 0) {
      return Response.json({ error: 'User already has this role', existing: existing[0] }, { status: 409 });
    }

    const newRole = await base44.asServiceRole.entities.PlatformRole.create({
      user_id: target_user_id,
      user_email: target_user_email || '',
      role: role,
      assigned_by: user.id,
      assigned_by_email: user.email,
      is_active: true
    });

    return Response.json({ success: true, role: newRole });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});