import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Lists communities discoverable in the onboarding directory (is_listed +
 * active). Optional `q` filters server-side by name, callsign, description,
 * location, and primary repeater.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { q } = body;

    let communities = await base44.asServiceRole.entities.Community.filter(
      { is_listed: true, is_active: true },
      '-member_count',
      100
    );
    communities = communities || [];

    if (q && q.trim()) {
      const ql = q.trim().toLowerCase();
      communities = communities.filter(c =>
        [c.name, c.callsign, c.description, c.location, c.primary_repeater]
          .some(f => (f || '').toLowerCase().includes(ql))
      );
    }

    return Response.json({
      communities: communities.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        callsign: c.callsign,
        description: c.description,
        logo_url: c.logo_url,
        banner_url: c.banner_url,
        visibility: c.visibility,
        member_count: c.member_count,
        location: c.location,
        location_lat: c.location_lat,
        location_lon: c.location_lon,
        primary_repeater: c.primary_repeater,
        frequency: c.frequency,
        pl_tone: c.pl_tone,
        primary_color: c.primary_color,
        accent_color: c.accent_color,
        created_date: c.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});