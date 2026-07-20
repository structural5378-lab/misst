import { useMemo, useCallback } from "react";
import { useMistUser } from "./useMistUser";

/**
 * Read/write a JSON-serialized preferences field on the MIST user entity.
 * Used by Account Center sections that store structured settings (notifications,
 * privacy, radio profile, security). Returns [value, save] where save persists
 * the full new value via base44.auth.updateMe.
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

export const DEFAULT_NOTIFS = {
  forum_replies: true, mentions: true, messages: true, friend_requests: true,
  events: true, repeaters: false, news: true, announcements: true,
  achievements: true, badges: true, push: true, email: true, sms: false,
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