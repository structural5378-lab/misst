import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * migrateRoles — one-shot, idempotent consolidation of the legacy
 * PlatformRole + CommunityRole tables into the canonical UserRole model.
 *
 *  PlatformRole (platform_owner / platform_admin / platform_support)
 *    -> UserRole { scope: "platform", role_slug: owner|administrator|platform_support }
 *  CommunityRole (community_owner / community_admin / moderator / trusted_member / member / guest)
 *    -> UserRole { scope: "community", community_id, role_slug: <enum> }
 *
 * Existing UserRole records are never duplicated — each (scope, user_id,
 * role_slug, community_id) tuple is created at most once. Safe to re-run.
 */
const PLATFORM_MAP = {
  platform_owner: { slug: "owner", name: "Owner" },
  platform_admin: { slug: "administrator", name: "Administrator" },
  platform_support: { slug: "platform_support", name: "Platform Support" },
};
const COMMUNITY_MAP = {
  community_owner: { slug: "community_owner", name: "Community Owner" },
  community_admin: { slug: "community_admin", name: "Community Admin" },
  moderator: { slug: "moderator", name: "Moderator" },
  trusted_member: { slug: "trusted_member", name: "Trusted Member" },
  member: { slug: "member", name: "Member" },
  guest: { slug: "guest", name: "Guest" },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const [roles, plat, comm, existing] = await Promise.all([
      base44.asServiceRole.entities.Role.list('-priority', 500),
      base44.asServiceRole.entities.PlatformRole.filter({ is_active: true }),
      base44.asServiceRole.entities.CommunityRole.filter({ is_active: true }),
      base44.asServiceRole.entities.UserRole.list('-created_date', 1000),
    ]);

    const slugToId = {};
    for (const r of roles || []) slugToId[r.slug] = r.id;

    const keyOf = (ur) => `${ur.scope || 'platform'}:${ur.user_id}:${ur.role_slug}:${ur.community_id || ''}`;
    const seen = new Set((existing || []).map(keyOf));

    const toCreate = [];
    let skipped = 0;

    for (const p of plat || []) {
      const m = PLATFORM_MAP[p.role];
      if (!m) { skipped++; continue; }
      const key = `platform:${p.user_id}:${m.slug}:`;
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);
      toCreate.push({
        user_id: p.user_id,
        user_email: p.user_email || "",
        scope: "platform",
        role_id: slugToId[m.slug] || null,
        role_name: m.name,
        role_slug: m.slug,
        assigned_by: p.assigned_by || "",
        assigned_by_email: p.assigned_by_email || "",
        assigned_at: new Date().toISOString(),
        is_active: true,
      });
    }

    for (const c of comm || []) {
      const m = COMMUNITY_MAP[c.role];
      if (!m) { skipped++; continue; }
      const key = `community:${c.user_id}:${m.slug}:${c.community_id || ''}`;
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);
      toCreate.push({
        user_id: c.user_id,
        user_email: c.user_email || "",
        scope: "community",
        community_id: c.community_id || "",
        role_id: slugToId[m.slug] || null,
        role_name: m.name,
        role_slug: m.slug,
        assigned_by: c.assigned_by || "",
        assigned_by_email: c.assigned_by_email || "",
        assigned_at: new Date().toISOString(),
        is_active: true,
      });
    }

    let created = 0;
    if (toCreate.length) {
      for (let i = 0; i < toCreate.length; i += 100) {
        const chunk = toCreate.slice(i, i + 100);
        await base44.asServiceRole.entities.UserRole.bulkCreate(chunk);
        created += chunk.length;
      }
    }

    return Response.json({
      success: true,
      created,
      skipped,
      source_platform: (plat || []).length,
      source_community: (comm || []).length,
      existing_user_roles: (existing || []).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});