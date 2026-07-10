import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns all communities a user belongs to, with their role in each.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id,
      is_active: true
    });

    if (!memberships || memberships.length === 0) {
      return Response.json({ communities: [], count: 0 });
    }

    // Fetch community details for each membership
    const communities = [];
    for (const m of memberships) {
      let community = null;
      try {
        community = await base44.asServiceRole.entities.Community.get(m.community_id);
      } catch {
        continue; // community may have been deleted
      }
      if (!community || community.status === 'archived') continue;

      communities.push({
        id: community.id,
        name: community.name,
        slug: community.slug,
        callsign: community.callsign,
        description: community.description,
        logo_url: community.logo_url,
        banner_url: community.banner_url,
        primary_color: community.primary_color,
        accent_color: community.accent_color,
        visibility: community.visibility,
        status: community.status,
        member_count: community.member_count,
        role: m.role,
        status_in_community: m.status,
        joined_date: m.joined_date
      });
    }

    return Response.json({ communities, count: communities.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});