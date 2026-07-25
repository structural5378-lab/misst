import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Read-only audit log retrieval for platform admins. Returns both the
// platform audit log (PlatformAuditLog) and RBAC audit log (RbacAuditLog)
// via the service role so admins see every entry regardless of RLS.

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { source } = body; // 'platform' | 'rbac' | undefined (all)
    const out = { platform: [], rbac: [] };
    if (!source || source === 'platform') {
      out.platform = (await base44.asServiceRole.entities.PlatformAuditLog.list('-created_date', 1000)) || [];
    }
    if (!source || source === 'rbac') {
      out.rbac = (await base44.asServiceRole.entities.RbacAuditLog.list('-created_date', 1000)) || [];
    }
    return Response.json({ success: true, ...out });
  } catch (error) {
    console.error('[adminListAuditLogs] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});