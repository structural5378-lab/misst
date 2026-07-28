import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveCommunityAccess } from '../../shared/communityAccess.ts';

// getCommunityRadioScopeData — the single, secure, community-scoped data source
// for RadioScope. Returns ONLY data belonging to the requested community, and
// only after verifying the caller is an active member (or platform admin).
//
// SECURITY / ISOLATION (mandatory):
//   1. community_id is REQUIRED. An unscooped request is rejected + logged.
//   2. Caller must be an ACTIVE member of that community, OR a platform admin.
//      Otherwise 403 — no data leaves the community boundary. This cannot be
//      bypassed by tampering with client variables, IDs, or payloads; the
//      membership check is server-side on every call.
//   3. Members are sourced ONLY from CommunityMember rows for community_id.
//      Presence (location) is fetched via a scoped $in on the exact member
//      presence keys — ChatPresence is NEVER listed globally.
//   4. Repeaters, NetSessions, and Alerts are all filtered by community_id.
//   5. Lightning "weather alerts" are counted within a radius of the
//      community's geographic center only (lightning is a geographic weather
//      feed, not private community data — but the count is community-scoped).
//
// Returns: { community, members, repeaters, nets, alerts, stats }
//   members[] carry: role, status, last_active, sharing_location, lat/lon +
//   GPS metadata, and a `live` flag (within TTL). RadioScope renders only
//   members of the active community — never members of other communities.

const LOCATION_TTL_MS = 60 * 1000;

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.pow(Math.sin(dLon / 2), 2);
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();

    if (!community_id) {
      console.error('[getCommunityRadioScopeData] REJECTED: missing community_id (unscooped query blocked)');
      return Response.json({ error: 'A community_id is required' }, { status: 400 });
    }

    // Server-side membership enforcement — the privacy boundary.
    const access = await resolveCommunityAccess(base44, user, community_id);
    if (!access.isMember && !access.isPlatformAdmin) {
      console.error(`[getCommunityRadioScopeData] REJECTED: user ${user.id} is not a member of community ${community_id}`);
      return Response.json(
        { error: 'Access Denied: you are not a member of this community' },
        { status: 403 }
      );
    }

    // Community object (default map center + display).
    let community = null;
    try {
      community = await base44.asServiceRole.entities.Community.get(community_id);
    } catch (e) {
      console.error('[getCommunityRadioScopeData] community fetch failed:', e.message);
    }

    // Members of THIS community only.
    const memberRows = await base44.asServiceRole.entities.CommunityMember
      .filter({ community_id, is_active: true, status: 'active' }, '-joined_date', 1000)
      .then((r) => r || []);
    const memberUserIds = memberRows.map((m) => m.user_id).filter(Boolean);

    // Enrich with User records to resolve the presence key (mybb_uid || id),
    // matching updateUserLocation's keying logic.
    const userById = new Map();
    const CHUNK = 500;
    for (let i = 0; i < memberUserIds.length; i += CHUNK) {
      const slice = memberUserIds.slice(i, i + CHUNK);
      if (!slice.length) continue;
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: { $in: slice } });
        (users || []).forEach((u) => userById.set(u.id, u));
      } catch (e) {
        console.error('[getCommunityRadioScopeData] user enrichment failed:', e.message);
      }
    }

    // Presence keys: mybb_uid || user.id (matches updateUserLocation).
    const keyByUserId = new Map();
    const presenceKeys = [];
    memberRows.forEach((m) => {
      const u = userById.get(m.user_id) || {};
      const key = String(u.mybb_uid || m.user_id || '');
      keyByUserId.set(m.user_id, key);
      if (key) presenceKeys.push(key);
    });

    // Scoped presence read — $in on the exact member keys only (never global).
    const presenceByKey = new Map();
    for (let i = 0; i < presenceKeys.length; i += CHUNK) {
      const slice = presenceKeys.slice(i, i + CHUNK);
      if (!slice.length) continue;
      try {
        const chunk = await base44.asServiceRole.entities.ChatPresence.filter({ user_uid: { $in: slice } });
        (chunk || []).forEach((p) => presenceByKey.set(p.user_uid, p));
      } catch (e) {
        console.error('[getCommunityRadioScopeData] presence fetch failed:', e.message);
      }
    }

    const now = Date.now();
    const isLive = (p) => {
      if (!p || !p.sharing_location) return false;
      if (p.latitude == null || p.longitude == null) return false;
      if (p.latitude === 0 && p.longitude === 0) return false;
      if (!p.location_updated_at) return false;
      const t = new Date(p.location_updated_at).getTime();
      if (isNaN(t)) return false;
      return now - t < LOCATION_TTL_MS;
    };

    let online = 0;
    let sharingLocation = 0;
    const members = memberRows.map((m) => {
      const u = userById.get(m.user_id) || {};
      const key = keyByUserId.get(m.user_id);
      const p = presenceByKey.get(key) || null;
      const live = isLive(p);
      const status = p?.status && p.status !== 'offline' ? p.status : 'offline';
      if (p && p.status && p.status !== 'offline') online++;
      if (live) sharingLocation++;
      return {
        id: m.id,
        user_id: m.user_id,
        user_uid: key,
        user_name: m.user_name || u.full_name || 'Member',
        user_avatar: m.user_avatar || u.avatar_url || null,
        user_callsign: m.user_callsign || u.callsign || '',
        role: m.role || 'member',
        status,
        last_active: p?.last_active || null,
        sharing_location: !!p?.sharing_location,
        latitude: p?.latitude ?? null,
        longitude: p?.longitude ?? null,
        gps_accuracy: p?.gps_accuracy ?? null,
        gps_speed: p?.gps_speed ?? null,
        gps_heading: p?.gps_heading ?? null,
        location_source: p?.location_source || null,
        location_updated_at: p?.location_updated_at || null,
        location_expires_at: p?.location_expires_at || null,
        current_repeater_id: p?.current_repeater_id || null,
        live,
      };
    });

    // Repeaters for THIS community only.
    const repeaters = await base44.asServiceRole.entities.Repeater
      .filter({ community_id }, '-created_date', 500)
      .then((r) => r || []);
    const activeRepeaters = repeaters.filter((r) => !r.status || r.status === 'online').length;

    // Live nets for THIS community only.
    const netSessions = await base44.asServiceRole.entities.NetSession
      .filter({ community_id }, '-started_at', 50)
      .then((r) => r || []);
    const liveNets = netSessions.filter((s) => s.status === 'active' || s.status === 'paused');

    // Community alerts (emergency + warning).
    const alerts = await base44.asServiceRole.entities.Alert
      .filter({ community_id }, '-created_date', 50)
      .then((r) => r || []);
    const emergencyAlerts = alerts.filter((a) => a.type === 'emergency');

    // Weather alerts: lightning strikes within 50mi of the community center.
    let weatherAlertCount = 0;
    if (community?.location_lat != null && community?.location_lon != null) {
      try {
        const recent = await base44.asServiceRole.entities.LightningStrike.list('-strike_time', 200);
        (recent || []).forEach((s) => {
          if (s.latitude == null || s.longitude == null) return;
          if (haversineMiles(community.location_lat, community.location_lon, s.latitude, s.longitude) <= 50) {
            weatherAlertCount++;
          }
        });
      } catch (e) {
        console.error('[getCommunityRadioScopeData] lightning fetch failed:', e.message);
      }
    }

    return Response.json({
      community,
      members,
      repeaters,
      nets: liveNets,
      alerts,
      stats: {
        total_members: memberRows.length,
        online,
        sharing_location: sharingLocation,
        active_repeaters: activeRepeaters,
        live_nets: liveNets.length,
        emergency_alerts: emergencyAlerts.length,
        weather_alerts: weatherAlertCount,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}