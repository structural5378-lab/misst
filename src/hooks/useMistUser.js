import { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

/**
 * useMistUser — the unified MIST identity contract.
 *
 * MIST native auth (Base44) is the single source of truth for identity. The
 * legacy MyBB session is used ONLY as a read-only fallback during migration
 * for fields not yet stored on the native user. Every module should consume
 * `mistUser` instead of reading `mybbUser` or calling `base44.auth.me()`
 * directly, so identity has one owner.
 *
 * The built-in User entity + `base44.auth.updateMe` is the canonical user
 * table — no parallel profile table is introduced.
 */
export function useMistUser() {
  const { mybbUser, login, logout: mybbLogout } = useMyBBAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mistUser = useMemo(() => {
    const nativeAvatar = user?.avatar_url || user?.avatar || null;
    const mybbAvatar = mybbUser?.avatar || null;
    return {
      id: user?.id || mybbUser?.uid || null,
      email: user?.email || "",
      // Identity
      username: user?.username || mybbUser?.username || "",
      displayName:
        user?.display_name ||
        user?.full_name ||
        user?.username ||
        mybbUser?.username ||
        "MIST Member",
      callsign: user?.callsign || mybbUser?.username || "",
      // Visual
      avatarUrl: nativeAvatar || mybbAvatar || null,
      bannerUrl: user?.banner_url || null,
      bio: user?.bio || "",
      location: user?.location || "",
      // Role & stats (MyBB fallback during migration; RBAC unification is a later phase)
      role: mybbUser?.role || user?.role || "member",
      reputation: user?.reputation ?? mybbUser?.reputation ?? 0,
      postCount: user?.post_count ?? mybbUser?.postcount ?? 0,
      threadCount: user?.thread_count ?? mybbUser?.threadcount ?? 0,
      // Metadata
      memberSince: user?.created_date || null,
      lastActive: user?.last_active || null,
      // Migration linkage
      mybbUid: user?.mybb_uid || mybbUser?.uid || null,
      mybbUsername: user?.mybb_username || mybbUser?.username || null,
      // Source flags
      isAuthenticated: !!user,
      isMigrated: !!user && (!!user.username || !!user.callsign),
    };
  }, [user, mybbUser]);

  const updateProfile = useCallback(async (patch) => {
    const updated = await base44.auth.updateMe(patch);
    const next = updated || (await base44.auth.me());
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    mybbLogout();
    try {
      base44.auth.logout(`${window.location.origin}/login`);
    } catch {
      window.location.href = "/login";
    }
  }, [mybbLogout]);

  return { user, mistUser, loading, refresh, updateProfile, signOut, mybbUser, login };
}

export default useMistUser;