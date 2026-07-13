export const COLLECTIONS = {
  net_master: { name: "Net Master", icon: "Radio", description: "Check into nets and build your participation record" },
  net_control: { name: "Net Control", icon: "Headphones", description: "Host and command net sessions" },
  travel: { name: "Travel & Exploration", icon: "Compass", description: "Visit repeaters and roam the airwaves" },
  license: { name: "License Collection", icon: "BadgeCheck", description: "Verify your radio credentials" },
  emergency: { name: "Emergency Service", icon: "ShieldAlert", description: "Serve your community in times of need" },
  club: { name: "Club Collection", icon: "Users", description: "Build and contribute to your club" },
  forum: { name: "Forum Collection", icon: "MessageSquare", description: "Share knowledge and help fellow operators" },
  special: { name: "Special Achievements", icon: "Sparkles", description: "Unique accomplishments and rare feats" },
  secret: { name: "Secret Achievements", icon: "Eye", description: "Hidden until unlocked" },
  seasonal: { name: "Seasonal Events", icon: "Calendar", description: "Limited-time achievements" },
};

export const COLLECTIONS_ORDER = ['net_master', 'net_control', 'travel', 'license', 'emergency', 'club', 'forum', 'special', 'seasonal', 'secret'];

export const ACHIEVEMENTS = [
  // NET MASTER
  { id: "net_first", name: "First Contact", description: "Check into your first net", collection: "net_master", rarity: "common", icon: "Radio", xp: 50, criteria: { stat: "net_checkins", op: ">=", val: 1 }, flavor: "Every operator remembers their first check-in. Welcome to the airwaves!" },
  { id: "net_10", name: "Getting Connected", description: "Check into 10 nets", collection: "net_master", rarity: "common", icon: "Radio", xp: 100, criteria: { stat: "net_checkins", op: ">=", val: 10 }, flavor: "You're getting the hang of this! 10 nets checked in." },
  { id: "net_50", name: "Regular Operator", description: "Check into 50 nets", collection: "net_master", rarity: "rare", icon: "Radio", xp: 250, criteria: { stat: "net_checkins", op: ">=", val: 50 }, flavor: "50 nets and counting. You're a regular voice on the air." },
  { id: "net_100", name: "Centurion", description: "Check into 100 nets", collection: "net_master", rarity: "epic", icon: "Radio", xp: 500, criteria: { stat: "net_checkins", op: ">=", val: 100 }, flavor: "100 check-ins! You've reached Centurion status." },
  { id: "net_500", name: "Airwave Veteran", description: "Check into 500 nets", collection: "net_master", rarity: "legendary", icon: "Radio", xp: 2500, criteria: { stat: "net_checkins", op: ">=", val: 500 }, flavor: "500 nets. Your voice is known across the entire network." },
  { id: "net_1000", name: "Net Legend", description: "Check into 1,000 nets", collection: "net_master", rarity: "mythic", icon: "Crown", xp: 10000, criteria: { stat: "net_checkins", op: ">=", val: 1000 }, flavor: "1,000 check-ins. You are a true Net Legend — few will ever reach this milestone." },

  // NET CONTROL
  { id: "control_first", name: "Taking the Reins", description: "Host your first net as Net Control", collection: "net_control", rarity: "common", icon: "Headphones", xp: 100, criteria: { stat: "net_control_sessions", op: ">=", val: 1 }, flavor: "You took the reins and ran your first net. The frequency is yours." },
  { id: "control_25", name: "Seasoned Controller", description: "Host 25 nets", collection: "net_control", rarity: "rare", icon: "Headphones", xp: 500, criteria: { stat: "net_control_sessions", op: ">=", val: 25 }, flavor: "25 nets hosted. You're a seasoned controller." },
  { id: "control_100", name: "Master Controller", description: "Host 100 nets", collection: "net_control", rarity: "epic", icon: "Mic", xp: 2000, criteria: { stat: "net_control_sessions", op: ">=", val: 100 }, flavor: "100 nets under your command. You are a Master Controller." },
  { id: "control_500", name: "Frequency Commander", description: "Host 500 nets", collection: "net_control", rarity: "legendary", icon: "RadioTower", xp: 10000, criteria: { stat: "net_control_sessions", op: ">=", val: 500 }, flavor: "500 nets commanded. You are a Frequency Commander." },
  { id: "control_legendary", name: "Legendary Net Control", description: "Host 1,000 nets", collection: "net_control", rarity: "mythic", icon: "Crown", xp: 25000, criteria: { stat: "net_control_sessions", op: ">=", val: 1000 }, flavor: "1,000 nets. You are the Legendary Net Control — the voice that guides the community." },

  // TRAVEL
  { id: "travel_first", name: "First Repeater", description: "Visit your first repeater", collection: "travel", rarity: "common", icon: "MapPin", xp: 50, criteria: { stat: "repeaters_visited", op: ">=", val: 1 }, flavor: "Your first repeater visit. The journey begins!" },
  { id: "travel_10", name: "Repeater Hopper", description: "Visit 10 repeaters", collection: "travel", rarity: "common", icon: "MapPin", xp: 150, criteria: { stat: "repeaters_visited", op: ">=", val: 10 }, flavor: "10 repeaters visited. You're hopping across the network." },
  { id: "travel_50", name: "Repeater Explorer", description: "Visit 50 repeaters", collection: "travel", rarity: "rare", icon: "Navigation", xp: 500, criteria: { stat: "repeaters_visited", op: ">=", val: 50 }, flavor: "50 repeaters! You've explored far and wide." },
  { id: "travel_100", name: "Centurion Traveler", description: "Visit 100 repeaters", collection: "travel", rarity: "epic", icon: "Compass", xp: 1500, criteria: { stat: "repeaters_visited", op: ">=", val: 100 }, flavor: "100 repeaters visited. You are a Centurion Traveler." },
  { id: "travel_florida", name: "Sunshine State Operator", description: "Visit every Florida GMRS region", collection: "travel", rarity: "legendary", icon: "Sun", xp: 3000, criteria: { stat: "florida_regions", op: ">=", val: 1 }, flavor: "You've operated from every region of the Sunshine State." },
  { id: "travel_multistate", name: "Multi-State Operator", description: "Operate in 3 or more states", collection: "travel", rarity: "rare", icon: "MapPin", xp: 300, criteria: { stat: "states_operated", op: ">=", val: 3 }, flavor: "Crossing state lines on the air. You're a Multi-State Operator." },
  { id: "travel_crosscountry", name: "Cross Country Operator", description: "Operate in 20 or more states", collection: "travel", rarity: "legendary", icon: "Plane", xp: 5000, criteria: { stat: "states_operated", op: ">=", val: 20 }, flavor: "Coast to coast! You've operated across the entire nation." },
  { id: "travel_roadwarrior", name: "Road Warrior", description: "Travel 10,000+ miles for radio", collection: "travel", rarity: "epic", icon: "Car", xp: 2000, criteria: { stat: "miles_traveled", op: ">=", val: 10000 }, flavor: "10,000 miles traveled. You are a true Road Warrior." },

  // LICENSE
  { id: "license_gmrs", name: "Verified GMRS", description: "Verify your GMRS license", collection: "license", rarity: "rare", icon: "BadgeCheck", xp: 200, criteria: { stat: "gmrs_verified", op: "==", val: 1 }, flavor: "Your GMRS license is verified. You're officially on the air." },
  { id: "license_tech", name: "Technician Class", description: "Earn your Technician ham license", collection: "license", rarity: "common", icon: "Award", xp: 150, criteria: { stat: "ham_license_class", op: "==", val: "technician" }, flavor: "Technician Class licensed. Your ham journey begins!" },
  { id: "license_general", name: "General Class", description: "Earn your General ham license", collection: "license", rarity: "rare", icon: "Award", xp: 300, criteria: { stat: "ham_license_class", op: "==", val: "general" }, flavor: "General Class! You've unlocked HF privileges." },
  { id: "license_extra", name: "Amateur Extra", description: "Earn your Amateur Extra license", collection: "license", rarity: "epic", icon: "GraduationCap", xp: 500, criteria: { stat: "ham_license_class", op: "==", val: "amateur_extra" }, flavor: "Amateur Extra! The highest class of amateur radio license." },

  // EMERGENCY
  { id: "em_stormspotter", name: "Storm Spotter", description: "Participate in emergency weather operations", collection: "emergency", rarity: "rare", icon: "CloudRain", xp: 300, criteria: { stat: "emergency_activations", op: ">=", val: 1 }, flavor: "You've served as a Storm Spotter. When seconds count, you're there." },
  { id: "em_volunteer", name: "Emergency Volunteer", description: "Complete 50+ volunteer hours", collection: "emergency", rarity: "epic", icon: "LifeBuoy", xp: 1000, criteria: { stat: "volunteer_hours", op: ">=", val: 50 }, flavor: "50 hours of volunteer service. You are an Emergency Volunteer." },
  { id: "em_disaster", name: "Disaster Response", description: "Participate in 5+ emergency activations", collection: "emergency", rarity: "legendary", icon: "ShieldAlert", xp: 3000, criteria: { stat: "emergency_activations", op: ">=", val: 5 }, flavor: "5 emergency activations. You are a Disaster Response veteran." },
  { id: "em_sar", name: "Search & Rescue Support", description: "Support a search and rescue operation", collection: "emergency", rarity: "legendary", icon: "Binoculars", xp: 3000, criteria: { stat: "sar_support", op: ">=", val: 1 }, flavor: "You supported a search and rescue mission. Lives may depend on your signal." },
  { id: "em_community", name: "Community Service", description: "Complete 10+ volunteer hours", collection: "emergency", rarity: "common", icon: "Heart", xp: 100, criteria: { stat: "volunteer_hours", op: ">=", val: 10 }, flavor: "10 hours of community service. Thank you for giving back." },

  // CLUB
  { id: "club_founder", name: "Founder", description: "Found a MIST community", collection: "club", rarity: "founder", icon: "Crown", xp: 5000, criteria: { stat: "is_founder", op: "==", val: 1 }, flavor: "You founded a community. Your legacy is forever." },
  { id: "club_president", name: "Club President", description: "Serve as club president", collection: "club", rarity: "legendary", icon: "Star", xp: 2000, criteria: { stat: "club_role", op: "==", val: "president" }, flavor: "Club President. You lead the community with vision." },
  { id: "club_officer", name: "Club Officer", description: "Serve as a club officer", collection: "club", rarity: "epic", icon: "Shield", xp: 1000, criteria: { stat: "club_role", op: "in", val: ["president", "vice_president", "secretary", "treasurer", "officer"] }, flavor: "Club Officer. You keep the community running." },
  { id: "club_volunteer", name: "Club Volunteer", description: "Volunteer for your club", collection: "club", rarity: "common", icon: "Heart", xp: 100, criteria: { stat: "volunteer_hours", op: ">=", val: 1 }, flavor: "You volunteered for your club. Every hour counts." },
  { id: "club_recruiter", name: "Club Recruiter", description: "Recruit 10+ members", collection: "club", rarity: "rare", icon: "UserPlus", xp: 500, criteria: { stat: "friends", op: ">=", val: 10 }, flavor: "10 members recruited. You're growing the community." },
  { id: "club_contributor", name: "Top Contributor", description: "Earn 100+ reputation", collection: "club", rarity: "epic", icon: "Trophy", xp: 1500, criteria: { stat: "reputation", op: ">=", val: 100 }, flavor: "100+ reputation. You are a Top Contributor." },

  // FORUM
  { id: "forum_helpful", name: "Helpful Member", description: "Make 10+ forum posts", collection: "forum", rarity: "common", icon: "MessageSquare", xp: 100, criteria: { stat: "forum_posts", op: ">=", val: 10 }, flavor: "10 posts and counting. You're a Helpful Member." },
  { id: "forum_mentor", name: "Mentor", description: "Give 25+ helpful answers", collection: "forum", rarity: "rare", icon: "Lightbulb", xp: 500, criteria: { stat: "helpful_answers", op: ">=", val: 25 }, flavor: "25 helpful answers. You're a Mentor to new operators." },
  { id: "forum_solver", name: "Problem Solver", description: "Give 100+ helpful answers", collection: "forum", rarity: "epic", icon: "Lightbulb", xp: 1500, criteria: { stat: "helpful_answers", op: ">=", val: 100 }, flavor: "100 helpful answers. You are a Problem Solver." },
  { id: "forum_author", name: "Knowledge Base Author", description: "Make 500+ forum posts", collection: "forum", rarity: "legendary", icon: "BookOpen", xp: 5000, criteria: { stat: "forum_posts", op: ">=", val: 500 }, flavor: "500 posts. You've built a knowledge base for the community." },

  // SPECIAL
  { id: "special_nightowl", name: "Night Owl", description: "Check into a net after midnight", collection: "special", rarity: "rare", icon: "Moon", xp: 200, criteria: { stat: "night_owl", op: ">=", val: 1 }, flavor: "Burning the midnight oil on the air. Hoot hoot!" },
  { id: "special_earlybird", name: "Early Bird", description: "Check into a net before 6 AM", collection: "special", rarity: "rare", icon: "Sunrise", xp: 200, criteria: { stat: "early_bird", op: ">=", val: 1 }, flavor: "The early bird gets the frequency!" },
  { id: "special_explorer", name: "Explorer", description: "Visit 25+ repeaters", collection: "special", rarity: "epic", icon: "Compass", xp: 750, criteria: { stat: "repeaters_visited", op: ">=", val: 25 }, flavor: "25 repeaters explored. You've gone where others haven't." },
  { id: "special_mountain", name: "Mountain Top", description: "Operate from a mountain summit", collection: "special", rarity: "legendary", icon: "Mountain", xp: 2000, criteria: { stat: "mountain_top", op: ">=", val: 1 }, flavor: "You operated from a mountain top. The view — and the signal — are spectacular." },
  { id: "special_island", name: "Island Operator", description: "Operate from an island", collection: "special", rarity: "epic", icon: "Anchor", xp: 1500, criteria: { stat: "island_op", op: ">=", val: 1 }, flavor: "Island operation! Salt air and strong signals." },
  { id: "special_portable", name: "Portable Operator", description: "Complete 10+ portable operations", collection: "special", rarity: "common", icon: "Backpack", xp: 150, criteria: { stat: "portable_ops", op: ">=", val: 10 }, flavor: "10 portable operations. You take your radio everywhere." },
  { id: "special_mobile", name: "Mobile Operator", description: "Complete 50+ mobile operations", collection: "special", rarity: "common", icon: "Car", xp: 200, criteria: { stat: "mobile_ops", op: ">=", val: 50 }, flavor: "50 mobile operations. You're always on the move." },
  { id: "special_fieldday", name: "Field Day Operator", description: "Participate in a Field Day event", collection: "special", rarity: "rare", icon: "Tent", xp: 300, criteria: { stat: "field_day_count", op: ">=", val: 1 }, flavor: "Field Day! You set up and operated in the field." },
  { id: "special_parks", name: "Parks Activation", description: "Activate a park on the air", collection: "special", rarity: "epic", icon: "Trees", xp: 1000, criteria: { stat: "parks_activated", op: ">=", val: 1 }, flavor: "Parks on the Air! You activated a park." },
  { id: "special_longest", name: "Longest Contact", description: "Make a contact over 100+ miles", collection: "special", rarity: "legendary", icon: "Waves", xp: 2000, criteria: { stat: "longest_contact", op: ">=", val: 100 }, flavor: "100+ mile contact! You've stretched the airwaves." },
  { id: "special_dx", name: "DX Achievement", description: "Operate in 30+ states", collection: "special", rarity: "mythic", icon: "Globe", xp: 15000, criteria: { stat: "states_operated", op: ">=", val: 30 }, flavor: "30 states! You are a DX Achievement holder." },

  // SECRET
  { id: "secret_first", name: "The First Transmission", description: "???", collection: "secret", rarity: "mythic", icon: "Zap", xp: 1000, criteria: { stat: "first_message", op: ">=", val: 1 }, flavor: "Your very first message on MIST. It all started here.", secret: true },
  { id: "secret_nightwatch", name: "Night Watch", description: "???", collection: "secret", rarity: "legendary", icon: "Moon", xp: 500, criteria: { stat: "online_3am", op: ">=", val: 1 }, flavor: "You were online at 3 AM. The night watch is yours.", secret: true },
  { id: "secret_wanderer", name: "The Wanderer", description: "???", collection: "secret", rarity: "legendary", icon: "Footprints", xp: 1000, criteria: { stat: "states_week", op: ">=", val: 5 }, flavor: "5 states in one week. You are The Wanderer.", secret: true },
  { id: "secret_goldenvoice", name: "Golden Voice", description: "???", collection: "secret", rarity: "mythic", icon: "Mic", xp: 5000, criteria: { stat: "perfect_signal_count", op: ">=", val: 100 }, flavor: "100 check-ins with perfect signal reports. You have a Golden Voice.", secret: true },

  // SEASONAL
  { id: "seasonal_fieldday2026", name: "Field Day 2026", description: "Participate in Field Day 2026", collection: "seasonal", rarity: "seasonal", icon: "Tent", xp: 1000, criteria: { stat: "field_day_2026", op: ">=", val: 1 }, flavor: "You participated in Field Day 2026. A limited edition badge.", seasonal: true, event: "Field Day 2026" },
  { id: "seasonal_winter", name: "Winter Field Day", description: "Participate in Winter Field Day", collection: "seasonal", rarity: "seasonal", icon: "Snowflake", xp: 1000, criteria: { stat: "winter_field_day", op: ">=", val: 1 }, flavor: "You braved the cold for Winter Field Day.", seasonal: true, event: "Winter Field Day" },
  { id: "seasonal_hurricane", name: "Hurricane Season Ready", description: "Complete hurricane preparedness", collection: "seasonal", rarity: "seasonal", icon: "CloudRain", xp: 500, criteria: { stat: "hurricane_prep", op: ">=", val: 1 }, flavor: "You're ready for hurricane season. Stay safe out there.", seasonal: true, event: "Hurricane Season" },
  { id: "seasonal_holiday", name: "Holiday Cheer", description: "Check in during a holiday event", collection: "seasonal", rarity: "seasonal", icon: "Gift", xp: 300, criteria: { stat: "holiday_checkin", op: ">=", val: 1 }, flavor: "Holiday check-in! Season's greetings from the airwaves.", seasonal: true, event: "Holiday Events" },
  { id: "seasonal_anniversary", name: "MIST Anniversary", description: "Celebrate a MIST anniversary", collection: "seasonal", rarity: "seasonal", icon: "Sparkles", xp: 2000, criteria: { stat: "anniversary_event", op: ">=", val: 1 }, flavor: "You celebrated a MIST anniversary. Thank you for being part of the journey.", seasonal: true, event: "MIST Anniversary" },
  { id: "seasonal_competition", name: "Club Competition Champion", description: "Win a club competition", collection: "seasonal", rarity: "seasonal", icon: "Trophy", xp: 3000, criteria: { stat: "competition_wins", op: ">=", val: 1 }, flavor: "You won a club competition! Champion of the airwaves.", seasonal: true, event: "Club Competitions" },
];

export const STATS_CONFIG = [
  { key: "net_checkins", label: "Net Check-ins", icon: "Radio" },
  { key: "net_control_sessions", label: "Net Control", icon: "Headphones" },
  { key: "repeaters_visited", label: "Repeaters Visited", icon: "MapPin" },
  { key: "states_operated", label: "States Operated", icon: "Compass" },
  { key: "counties_visited", label: "Counties Visited", icon: "MapPin" },
  { key: "miles_traveled", label: "Miles Traveled", icon: "Car" },
  { key: "hours_on_nets", label: "Hours on Nets", icon: "Clock" },
  { key: "forum_posts", label: "Forum Posts", icon: "MessageSquare" },
  { key: "helpful_answers", label: "Helpful Answers", icon: "Lightbulb" },
  { key: "photos_uploaded", label: "Photos Uploaded", icon: "Camera" },
  { key: "events_attended", label: "Events Attended", icon: "Calendar" },
  { key: "volunteer_hours", label: "Volunteer Hours", icon: "Heart" },
  { key: "emergency_activations", label: "Emergency Activations", icon: "ShieldAlert" },
  { key: "club_events_hosted", label: "Club Events Hosted", icon: "Trophy" },
  { key: "repeaters_managed", label: "Repeaters Managed", icon: "RadioTower" },
  { key: "friends", label: "Friends", icon: "Users" },
  { key: "reputation", label: "Reputation", icon: "Star" },
  { key: "years_active", label: "Years Active", icon: "Clock" },
];

export const getAchievementsByCollection = () => {
  const grouped = {};
  for (const ach of ACHIEVEMENTS) {
    if (!grouped[ach.collection]) grouped[ach.collection] = [];
    grouped[ach.collection].push(ach);
  }
  return grouped;
};

export const getAchievementById = (id) => ACHIEVEMENTS.find(a => a.id === id);

export const getAchievementProgress = (achievement, stats) => {
  if (!achievement?.criteria || !stats) return { current: 0, target: 1, pct: 0 };
  const current = stats[achievement.criteria.stat] || 0;
  const target = achievement.criteria.val;
  return { current, target, pct: Math.min(100, Math.round((current / target) * 100)) };
};