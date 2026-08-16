import { mist } from '@/api/mist';
import { useMemo, useCallback } from "react";
import { useMistUser } from "./useMistUser";

/**
 * Read/write a JSON-serialized preferences field on the MIST user entity.
 * Used by Account Center sections that store structured settings (notifications,
 * privacy, radio profile, security). Returns [value, save] where save persists
 * the full new value via mist.auth.updateMe.
 */
export function useParsedField(field, defaultValue) {
  const { user, updateProfile } = useMistUser();
  const value = useMemo(() => {
    try {
      const v = JSON.parse(user?.[field] || "null");
      return v == null ? defaultValue : v;
    } catch {
      return defaultValue;
    }
  }, [user, field, defaultValue]);
  const save = useCallback(
    async (next) => {
      await updateProfile({ [field]: JSON.stringify(next) });
    },
    [field, updateProfile]
  );
  return [value, save];
}

export const WHO_OPTIONS = ["Everyone", "Members Only", "Friends", "Nobody"];

// Per-category channel defaults: { push, inapp, sound, vibrate }. A category is
// disabled only when both push and inapp are false. Mirrors the server default.
export const DEFAULT_NOTIFS = {
  forum_replies: { push: true, inapp: true, sound: true, vibrate: true },
  mentions: { push: true, inapp: true, sound: true, vibrate: true },
  messages: { push: true, inapp: true, sound: true, vibrate: true },
  friend_requests: { push: true, inapp: true, sound: true, vibrate: true },
  events: { push: true, inapp: true, sound: true, vibrate: true },
  repeaters: { push: false, inapp: false, sound: true, vibrate: true },
  news: { push: true, inapp: true, sound: true, vibrate: true },
  announcements: { push: true, inapp: true, sound: true, vibrate: true },
  emergency_alerts: { push: true, inapp: true, sound: true, vibrate: true },
  community_chat: { push: true, inapp: true, sound: true, vibrate: true },
  system: { push: false, inapp: true, sound: false, vibrate: false },
  push: true,
  email: true,
  sms: false,
};

export const DEFAULT_PRIVACY = {
  message_me: "Everyone", follow_me: "Everyone", view_profile: "Everyone",
  view_equipment: "Members Only", see_online: "Everyone", view_location: "Friends",
  search_index: true,
};

export const DEFAULT_RADIO = {
  callsign: "", fcc_verified: false, equipment: [], favorite_repeaters: [],
  home_repeater: "", fleet: [], antennas: [], emergency_contacts: [], club_memberships: [],
};

export const DEFAULT_SECURITY = {
  two_factor: false, recovery_codes: [], recovery_seen: false,
};