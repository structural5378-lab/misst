import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// manageNet — the single server-side gatekeeper for all Net Control actions.
// Every mutating operation on a Net (create/update/delete/archive/disable/
// enable) and every net lifecycle action (start/pause/resume/end/broadcast)
// goes through this function, which verifies the caller holds the
// "nets.manage" permission (or is a platform admin) BEFORE acting. The
// function runs as the service role, so non-admin Net Control operators can
// manage nets even though the Net entity's RLS restricts direct writes to
// admins. Users without the permission cannot perform any action, even by
// invoking this endpoint manually.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Resolve the caller's effective permissions through the RBAC resolver.
    let perms: string[] = [];
    let is_admin = user.role === 'admin';
    try {
      const rbacRes: any = await base44.functions.invoke('resolveRbac', {});
      perms = rbacRes?.data?.permissions || [];
      is_admin = is_admin || !!rbacRes?.data?.is_admin;
    } catch { /* fall back to admin check only */ }

    const canControl = is_admin || perms.includes('nets.manage') || perms.includes('*');
    if (!canControl) return Response.json({ error: 'Forbidden — Net Control permission required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const sr = base44.asServiceRole;

    // ── Schedule management ──────────────────────────────────────────────
    if (action === 'create') {
      const net = await sr.entities.Net.create({
        name: body.name,
        description: body.description || '',
        schedule: body.schedule || '',
        schedule_type: body.schedule_type || 'recurring',
        days: body.days || '[]',
        time: body.time || '',
        timezone: body.timezone || 'America/New_York',
        day_of_week: body.day_of_week || '',
        start_date: body.start_date || '',
        frequency: body.frequency ? +body.frequency : null,
        offset: body.offset || '',
        tone: body.tone || '',
        repeater_callsign: body.repeater_callsign || '',
        net_control: body.net_control || body.primary_net_control || '',
        primary_net_control: body.primary_net_control || '',
        assistant_net_control: body.assistant_net_control || '',
        expected_duration_minutes: body.expected_duration_minutes ? +body.expected_duration_minutes : null,
        auto_start: !!body.auto_start,
        auto_end: !!body.auto_end,
        allow_visitor_checkins: body.allow_visitor_checkins !== false,
        require_callsign: body.require_callsign !== false,
        notes: body.notes || '',
        category: body.category || 'general',
        status: 'active',
        community_id: body.community_id || '',
        community_name: body.community_name || '',
        community_logo: body.community_logo || '',
        created_by: user.id,
        created_by_name: user.full_name || user.email || '',
      });
      return Response.json({ ok: true, net });
    }

    if (action === 'update') {
      if (!body.id) return Response.json({ error: 'id required' }, { status: 400 });
      const patch: any = {};
      for (const k of ['name','description','schedule','schedule_type','days','time','timezone','day_of_week','start_date','offset','tone','repeater_callsign','net_control','primary_net_control','assistant_net_control','notes','category','community_id','community_name','community_logo']) {
        if (body[k] !== undefined) patch[k] = body[k];
      }
      if (body.frequency !== undefined) patch.frequency = body.frequency === '' ? null : +body.frequency;
      if (body.expected_duration_minutes !== undefined) patch.expected_duration_minutes = body.expected_duration_minutes === '' ? null : +body.expected_duration_minutes;
      for (const k of ['auto_start','auto_end','allow_visitor_checkins','require_callsign','is_favorite']) {
        if (body[k] !== undefined) patch[k] = !!body[k];
      }
      const net = await sr.entities.Net.update(body.id, patch);
      return Response.json({ ok: true, net });
    }

    if (action === 'delete') {
      if (!body.id) return Response.json({ error: 'id required' }, { status: 400 });
      await sr.entities.Net.delete(body.id);
      return Response.json({ ok: true });
    }

    if (action === 'archive' || action === 'disable' || action === 'enable') {
      if (!body.id) return Response.json({ error: 'id required' }, { status: 400 });
      const status = action === 'archive' ? 'archived' : action === 'disable' ? 'disabled' : 'active';
      await sr.entities.Net.update(body.id, { status });
      return Response.json({ ok: true, status });
    }

    // ── Net lifecycle ─────────────────────────────────────────────────────
    if (action === 'start') {
      if (!body.id) return Response.json({ error: 'id required' }, { status: 400 });
      const net: any = await sr.entities.Net.get(body.id).catch(() => null);
      if (!net) return Response.json({ error: 'Net not found' }, { status: 404 });
      // prevent duplicate active session
      const existing: any[] = await sr.entities.NetSession.filter({ net_id: body.id, status: 'active' }, '-started_at', 5).catch(() => []);
      if (existing && existing.length) return Response.json({ error: 'Net is already active', session: existing[0] }, { status: 409 });
      const session = await sr.entities.NetSession.create({
        net_id: net.id, net_name: net.name, net_type: net.category || 'general',
        frequency: net.frequency, tone: net.tone || '', repeater_callsign: net.repeater_callsign || '',
        net_control: net.primary_net_control || user.full_name || 'Net Control',
        net_control_uid: user.id, net_control_avatar: '',
        co_host: net.assistant_net_control || '', co_host_uid: '',
        status: 'active', started_at: new Date().toISOString(),
        checkin_count: 0, total_operators: 0, visitors: 0, late_checkins: 0, priority_count: 0, emergency_count: 0, paused_total: 0,
        community_id: net.community_id || '', community_name: net.community_name || '',
      });
      await sr.entities.NetTimeline.create({ session_id: session.id, net_id: net.id, event_type: 'net_started', message: `Net started by ${session.net_control}`, actor_name: session.net_control, actor_id: user.id });
      return Response.json({ ok: true, session });
    }

    if (action === 'pause' || action === 'resume' || action === 'end') {
      if (!body.session_id) return Response.json({ error: 'session_id required' }, { status: 400 });
      const session: any = await sr.entities.NetSession.get(body.session_id).catch(() => null);
      if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });
      if (action === 'pause') {
        await sr.entities.NetSession.update(session.id, { status: 'paused', paused_at: new Date().toISOString() });
        await sr.entities.NetTimeline.create({ session_id: session.id, net_id: session.net_id, event_type: 'net_paused', message: 'Net paused', actor_name: session.net_control, actor_id: user.id });
      } else if (action === 'resume') {
        const add = session.paused_at ? Date.now() - new Date(session.paused_at).getTime() : 0;
        await sr.entities.NetSession.update(session.id, { status: 'active', paused_at: null, paused_total: (session.paused_total || 0) + add });
        await sr.entities.NetTimeline.create({ session_id: session.id, net_id: session.net_id, event_type: 'net_resumed', message: 'Net resumed', actor_name: session.net_control, actor_id: user.id });
      } else {
        const ended_at = new Date().toISOString();
        const logs: any[] = await sr.entities.NetLog.filter({ session_id: session.id }, 'checkin_number', 1000).catch(() => []);
        const approved = logs.filter((l) => l.approved !== false);
        await sr.entities.NetSession.update(session.id, {
          status: 'closed', ended_at, report_generated: true,
          checkin_count: approved.length, total_operators: approved.length,
          visitors: approved.filter((l) => l.status === 'visitor').length,
          late_checkins: approved.filter((l) => l.status === 'late').length,
          priority_count: approved.filter((l) => l.status === 'priority').length,
          emergency_count: approved.filter((l) => l.status === 'emergency').length,
        });
        await sr.entities.NetTimeline.create({ session_id: session.id, net_id: session.net_id, event_type: 'net_closed', message: `Net closed by ${session.net_control}`, actor_name: session.net_control, actor_id: user.id });
      }
      return Response.json({ ok: true });
    }

    if (action === 'broadcast') {
      if (!body.session_id) return Response.json({ error: 'session_id required' }, { status: 400 });
      const msg = String(body.message || '').trim();
      if (!msg) return Response.json({ error: 'message required' }, { status: 400 });
      const session: any = await sr.entities.NetSession.get(body.session_id).catch(() => null);
      if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });
      await sr.entities.NetTimeline.create({ session_id: session.id, net_id: session.net_id, event_type: 'announcement', message: `📢 ${msg}`, actor_name: session.net_control, actor_id: user.id });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}