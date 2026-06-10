import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const q = (body.query || "").toLowerCase().trim();

    if (!q) return Response.json({ users: [] });

    // Use service role to list users (bypasses admin restriction)
    const all = await base44.asServiceRole.entities.User.list();

    const results = all
      .filter((u) => u.id !== user.id)
      .filter((u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.callsign?.toLowerCase().includes(q) ||
        u.mybb_username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
      .map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        callsign: u.callsign,
        mybb_username: u.mybb_username,
      }));

    return Response.json({ users: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});