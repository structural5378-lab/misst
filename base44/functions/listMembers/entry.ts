import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// listMembers — the sole member-directory service for MIST.
//
// Reads ONLY from the application's native User entity. There is no MyBB
// fallback, no forum SQL, no session lookup, and no mapping of legacy
// forum accounts. A user that exists in MyBB but not in the new database
// is invisible here by design — the member system is now fully decoupled
// from the forum adapter and prepared for its eventual removal.
//
// Search fields (case-insensitive substring):
//   - display_name / full_name   (Display Name)
//   - username / mybb_username   (Username — mybb_username kept as a
//                                 read-only alias for migrated handles)
//   - callsign                   (GMRS Call Sign)
//   - email                      (admin callers only)
//
// Privacy: suspended, banned, and deactivated accounts are never returned.
// Pagination: page/pageSize over the full user set, sorted by last_active.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').toLowerCase().trim();
    const page = Math.max(1, parseInt(body.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(body.pageSize, 10) || 20));
    const isAdmin = user.role === 'admin';
    const includeEmail = !!body.includeEmail && isAdmin;

    // Single source of truth: the native User entity. We list the full set
    // (sorted by last_activity) so multi-field OR search + stable pagination
    // work without a second round-trip. The platform list call is capped, so
    // we page through it in batches until exhausted, then filter in memory.
    const all = [];
    let skip = 0;
    const batch = 500;
    // Guard against unbounded loops on pathological datasets.
    for (let i = 0; i < 20; i++) {
      const chunk = await base44.asServiceRole.entities.User.list('-last_active', batch, skip);
      if (!chunk || chunk.length === 0) break;
      all.push(...chunk);
      if (chunk.length < batch) break;
      skip += batch;
    }

    // Privacy filter — never expose suspended/banned/deactivated accounts.
    let visible = all.filter((u) =>
      !u.is_platform_suspended &&
      !u.is_banned &&
      u.account_status !== 'deactivated'
    );

    // Multi-field search (email gated to admins).
    if (query) {
      visible = visible.filter((u) => {
        const haystack = [
          u.display_name, u.full_name, u.username, u.mybb_username, u.callsign,
          includeEmail ? u.email : null,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    const total = visible.length;
    const start = (page - 1) * pageSize;
    const slice = visible.slice(start, start + pageSize);
    const hasMore = start + pageSize < total;

    const members = slice.map((u) => {
      const displayName = u.display_name || u.full_name || u.username || u.mybb_username || 'MIST Member';
      const username = u.username || u.mybb_username || '';
      const callsign = u.callsign || '';
      const licenseStatus = u.license_status || (callsign ? 'LICENSED' : 'UNLICENSED');
      return {
        id: u.id,
        display_name: displayName,
        username,
        callsign,
        license_status: licenseStatus,
        avatar_url: u.avatar_url || null,
        role: u.role || 'user',
        last_active: u.last_active || null,
        location: u.location || '',
        bio: u.bio || '',
        email: includeEmail ? (u.email || null) : null,
        is_verified: !!u.is_verified,
      };
    });

    return Response.json({ members, page, pageSize, total, hasMore });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});