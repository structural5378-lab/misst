import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Compact achievement criteria — mirrors src/lib/achievementsData.js + syncUserStats
const CRITERIA = [
  { id: "net_first", s: "net_checkins", o: ">=", v: 1, xp: 50, n: "First Contact", r: "common", c: "net_master" },
  { id: "net_10", s: "net_checkins", o: ">=", v: 10, xp: 100, n: "Getting Connected", r: "common", c: "net_master" },
  { id: "net_50", s: "net_checkins", o: ">=", v: 50, xp: 250, n: "Regular Operator", r: "rare", c: "net_master" },
  { id: "net_100", s: "net_checkins", o: ">=", v: 100, xp: 500, n: "Centurion", r: "epic", c: "net_master" },
  { id: "net_500", s: "net_checkins", o: ">=", v: 500, xp: 2500, n: "Airwave Veteran", r: "legendary", c: "net_master" },
  { id: "net_1000", s: "net_checkins", o: ">=", v: 1000, xp: 10000, n: "Net Legend", r: "mythic", c: "net_master" },
  { id: "control_first", s: "net_control_sessions", o: ">=", v: 1, xp: 100, n: "Taking the Reins", r: "common", c: "net_control" },
  { id: "control_25", s: "net_control_sessions", o: ">=", v: 25, xp: 500, n: "Seasoned Controller", r: "rare", c: "net_control" },
  { id: "control_100", s: "net_control_sessions", o: ">=", v: 100, xp: 2000, n: "Master Controller", r: "epic", c: "net_control" },
  { id: "control_500", s: "net_control_sessions", o: ">=", v: 500, xp: 10000, n: "Frequency Commander", r: "legendary", c: "net_control" },
  { id: "control_legendary", s: "net_control_sessions", o: ">=", v: 1000, xp: 25000, n: "Legendary Net Control", r: "mythic", c: "net_control" },
  { id: "travel_first", s: "repeaters_visited", o: ">=", v: 1, xp: 50, n: "First Repeater", r: "common", c: "travel" },
  { id: "travel_10", s: "repeaters_visited", o: ">=", v: 10, xp: 150, n: "Repeater Hopper", r: "common", c: "travel" },
  { id: "travel_50", s: "repeaters_visited", o: ">=", v: 50, xp: 500, n: "Repeater Explorer", r: "rare", c: "travel" },
  { id: "travel_100", s: "repeaters_visited", o: ">=", v: 100, xp: 1500, n: "Centurion Traveler", r: "epic", c: "travel" },
  { id: "travel_florida", s: "florida_regions", o: ">=", v: 1, xp: 3000, n: "Sunshine State Operator", r: "legendary", c: "travel" },
  { id: "travel_multistate", s: "states_operated", o: ">=", v: 3, xp: 300, n: "Multi-State Operator", r: "rare", c: "travel" },
  { id: "travel_crosscountry", s: "states_operated", o: ">=", v: 20, xp: 5000, n: "Cross Country Operator", r: "legendary", c: "travel" },
  { id: "travel_roadwarrior", s: "miles_traveled", o: ">=", v: 10000, xp: 2000, n: "Road Warrior", r: "epic", c: "travel" },
  { id: "license_gmrs", s: "gmrs_verified", o: "==", v: 1, xp: 200, n: "Verified GMRS", r: "rare", c: "license" },
  { id: "license_tech", s: "ham_license_class", o: "==", v: "technician", xp: 150, n: "Technician Class", r: "common", c: "license" },
  { id: "license_general", s: "ham_license_class", o: "==", v: "general", xp: 300, n: "General Class", r: "rare", c: "license" },
  { id: "license_extra", s: "ham_license_class", o: "==", v: "amateur_extra", xp: 500, n: "Amateur Extra", r: "epic", c: "license" },
  { id: "em_stormspotter", s: "emergency_activations", o: ">=", v: 1, xp: 300, n: "Storm Spotter", r: "rare", c: "emergency" },
  { id: "em_volunteer", s: "volunteer_hours", o: ">=", v: 50, xp: 1000, n: "Emergency Volunteer", r: "epic", c: "emergency" },
  { id: "em_disaster", s: "emergency_activations", o: ">=", v: 5, xp: 3000, n: "Disaster Response", r: "legendary", c: "emergency" },
  { id: "em_sar", s: "sar_support", o: ">=", v: 1, xp: 3000, n: "Search & Rescue Support", r: "legendary", c: "emergency" },
  { id: "em_community", s: "volunteer_hours", o: ">=", v: 10, xp: 100, n: "Community Service", r: "common", c: "emergency" },
  { id: "club_founder", s: "is_founder", o: "==", v: 1, xp: 5000, n: "Founder", r: "founder", c: "club" },
  { id: "club_president", s: "club_role", o: "==", v: "president", xp: 2000, n: "Club President", r: "legendary", c: "club" },
  { id: "club_officer", s: "club_role", o: "in", v: ["president","vice_president","secretary","treasurer","officer"], xp: 1000, n: "Club Officer", r: "epic", c: "club" },
  { id: "club_volunteer", s: "volunteer_hours", o: ">=", v: 1, xp: 100, n: "Club Volunteer", r: "common", c: "club" },
  { id: "club_recruiter", s: "friends", o: ">=", v: 10, xp: 500, n: "Club Recruiter", r: "rare", c: "club" },
  { id: "club_contributor", s: "reputation", o: ">=", v: 100, xp: 1500, n: "Top Contributor", r: "epic", c: "club" },
  { id: "forum_helpful", s: "forum_posts", o: ">=", v: 10, xp: 100, n: "Helpful Member", r: "common", c: "forum" },
  { id: "forum_mentor", s: "helpful_answers", o: ">=", v: 25, xp: 500, n: "Mentor", r: "rare", c: "forum" },
  { id: "forum_solver", s: "helpful_answers", o: ">=", v: 100, xp: 1500, n: "Problem Solver", r: "epic", c: "forum" },
  { id: "forum_author", s: "forum_posts", o: ">=", v: 500, xp: 5000, n: "Knowledge Base Author", r: "legendary", c: "forum" },
  { id: "special_nightowl", s: "night_owl", o: ">=", v: 1, xp: 200, n: "Night Owl", r: "rare", c: "special" },
  { id: "special_earlybird", s: "early_bird", o: ">=", v: 1, xp: 200, n: "Early Bird", r: "rare", c: "special" },
  { id: "special_explorer", s: "repeaters_visited", o: ">=", v: 25, xp: 750, n: "Explorer", r: "epic", c: "special" },
  { id: "special_mountain", s: "mountain_top", o: ">=", v: 1, xp: 2000, n: "Mountain Top", r: "legendary", c: "special" },
  { id: "special_island", s: "island_op", o: ">=", v: 1, xp: 1500, n: "Island Operator", r: "epic", c: "special" },
  { id: "special_portable", s: "portable_ops", o: ">=", v: 10, xp: 150, n: "Portable Operator", r: "common", c: "special" },
  { id: "special_mobile", s: "mobile_ops", o: ">=", v: 50, xp: 200, n: "Mobile Operator", r: "common", c: "special" },
  { id: "special_fieldday", s: "field_day_count", o: ">=", v: 1, xp: 300, n: "Field Day Operator", r: "rare", c: "special" },
  { id: "special_parks", s: "parks_activated", o: ">=", v: 1, xp: 1000, n: "Parks Activation", r: "epic", c: "special" },
  { id: "special_longest", s: "longest_contact", o: ">=", v: 100, xp: 2000, n: "Longest Contact", r: "legendary", c: "special" },
  { id: "special_dx", s: "states_operated", o: ">=", v: 30, xp: 15000, n: "DX Achievement", r: "mythic", c: "special" },
  { id: "secret_first", s: "first_message", o: ">=", v: 1, xp: 1000, n: "The First Transmission", r: "mythic", c: "secret" },
  { id: "secret_nightwatch", s: "online_3am", o: ">=", v: 1, xp: 500, n: "Night Watch", r: "legendary", c: "secret" },
  { id: "secret_wanderer", s: "states_week", o: ">=", v: 5, xp: 1000, n: "The Wanderer", r: "legendary", c: "secret" },
  { id: "secret_goldenvoice", s: "perfect_signal_count", o: ">=", v: 100, xp: 5000, n: "Golden Voice", r: "mythic", c: "secret" },
  { id: "seasonal_fieldday2026", s: "field_day_2026", o: ">=", v: 1, xp: 1000, n: "Field Day 2026", r: "seasonal", c: "seasonal" },
  { id: "seasonal_winter", s: "winter_field_day", o: ">=", v: 1, xp: 1000, n: "Winter Field Day", r: "seasonal", c: "seasonal" },
  { id: "seasonal_hurricane", s: "hurricane_prep", o: ">=", v: 1, xp: 500, n: "Hurricane Season Ready", r: "seasonal", c: "seasonal" },
  { id: "seasonal_holiday", s: "holiday_checkin", o: ">=", v: 1, xp: 300, n: "Holiday Cheer", r: "seasonal", c: "seasonal" },
  { id: "seasonal_anniversary", s: "anniversary_event", o: ">=", v: 1, xp: 2000, n: "MIST Anniversary", r: "seasonal", c: "seasonal" },
  { id: "seasonal_competition", s: "competition_wins", o: ">=", v: 1, xp: 3000, n: "Club Competition Champion", r: "seasonal", c: "seasonal" },
];

const RARITY_SCORES: Record<string, number> = {
  common: 10, rare: 25, epic: 50, legendary: 100, mythic: 250,
  founder: 500, seasonal: 75, club_exclusive: 75, national_event: 150, developer: 300,
};

function checkCriteria(c: any, stats: any): boolean {
  const val = stats[c.s] || 0;
  if (c.o === ">=") return val >= c.v;
  if (c.o === "==") return val === c.v;
  if (c.o === "in") return c.v.includes(val);
  return false;
}

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
}

// Same XP formula as syncUserStats so both functions stay consistent.
function computeXp(s: any): number {
  return (
    (s.net_checkins || 0) * 50 +
    (s.net_control_sessions || 0) * 100 +
    (s.forum_posts || 0) * 10 +
    (s.photos_uploaded || 0) * 15 +
    (s.volunteer_hours || 0) * 25 +
    (s.events_attended || 0) * 75 +
    (s.repeaters_visited || 0) * 30 +
    (s.states_operated || 0) * 100 +
    Math.floor((s.miles_traveled || 0) / 10)
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userId: string = body.user_id;
    const userName: string = body.user_name || '';
    const action: string = body.action;
    if (!userId || !action) return Response.json({ error: 'user_id and action required' }, { status: 400 });

    // Get or create UserStats for the target user
    let statsList = await base44.asServiceRole.entities.UserStats.filter({ user_id: userId });
    let stats: any = statsList[0];
    if (!stats) {
      stats = await base44.asServiceRole.entities.UserStats.create({
        user_id: userId,
        user_name: userName,
      });
    }
    const s = stats || {};
    const updated: any = {};

    // Apply action -> counter increments
    if (action === 'check_in' || action === 'visitor') {
      updated.net_checkins = (s.net_checkins || 0) + 1;
    } else if (action === 'host_net' || action === 'run_net') {
      updated.net_control_sessions = (s.net_control_sessions || 0) + 1;
    } else if (action === 'emergency') {
      updated.emergency_activations = (s.emergency_activations || 0) + 1;
      updated.net_checkins = (s.net_checkins || 0) + 1;
    } else if (action === 'priority') {
      updated.reputation = (s.reputation || 0) + 1;
      updated.net_checkins = (s.net_checkins || 0) + 1;
    } else {
      return Response.json({ error: 'unknown action: ' + action }, { status: 400 });
    }

    const allStats = { ...s, ...updated };
    const oldXp = s.xp || 0;
    const newXp = computeXp(allStats);
    updated.xp = newXp;
    updated.level = calcLevel(newXp);

    // Check achievements
    const existing = await base44.asServiceRole.entities.UserAchievement.filter({ user_id: userId });
    const existingIds = new Set(existing.map((a: any) => a.achievement_id));
    const newlyUnlocked: any[] = [];
    for (const c of CRITERIA) {
      if (existingIds.has(c.id)) continue;
      if (checkCriteria(c, allStats)) {
        await base44.asServiceRole.entities.UserAchievement.create({
          user_id: userId,
          user_name: userName || s.user_name || '',
          achievement_id: c.id,
          achievement_name: c.n,
          rarity: c.r,
          collection: c.c,
          unlocked_date: new Date().toISOString(),
        });
        newlyUnlocked.push({ id: c.id, name: c.n, rarity: c.r, collection: c.c, xp: c.xp });
      }
    }

    const allAch = [...existing, ...newlyUnlocked];
    updated.achievement_score = allAch.reduce((sum: number, a: any) => sum + (RARITY_SCORES[a.rarity] || 10), 0);
    updated.achievements_count = allAch.length;

    await base44.asServiceRole.entities.UserStats.update(stats.id, updated);

    return Response.json({
      xpAwarded: Math.max(0, newXp - oldXp),
      newlyUnlocked,
      stats: { ...allStats, ...updated },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});