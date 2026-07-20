import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

/**
 * useMistUser — the single MIST identity contract.
 *
 * MIST native auth (Base44) is the ONLY identity provider. This hook is a
 * presentation layer over `useAuth` (the canonical session), the centralized
 * RBAC resolver, and the user's stats record. There is no parallel MyBB
 * session — MyBB is now a backend discussion engine only.
 *
 * A `mybbUser` object is still returned as a READ-ONLY, DERIVED view of the
 * MIST identity so legacy consumers that read `mybbUser.uid / username / ...`
 * keep working during the final migration sweep. It carries no password and
 * holds no independent state — it is the MIST user, reshaped.
 */
export function useMistUser() {
  const { user, logout: authLogout, checkUserAuth, isLoadingAuth } = useAuth();
  const { isAdmin, roles } = useAdminAccess();

  const { data: stats = {} } = useQuery({
    queryKey: ["mist-user-stats", user?.id],
    queryFn: async () => {
      const list = await base44.entities.UserStats.filter({ user_id: user.id });
      return list?.[0] || {};
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const loading = isLoadingAuth;

  const refresh = useCallback(async () => {
    try { return await checkUserAuth(); } catch { return null; }
  }, [checkUserAuth]);

  const mistUser = useMemo(() => {
    const u = user || {};
    return {
      id: u.id || null,
      email: u.email || "",
      username: u.mybb_username || u.username || u.full_name || "",
      displayName: u.display_name || u.full_name || u.username || u.mybb_username || "MIST Member",
      callsign: u.callsign || u.mybb_username || "",
      avatarUrl: u.avatar_url || u.avatar || null,
      bannerUrl: u.banner_url || null,
      bio: u.bio || "",
      location: u.location || "",
      role: u.role === "admin" ? "admin" : (u.role || "member"),
      reputation: stats.reputation ?? u.reputation ?? 0,
      postCount: stats.forum_posts ?? u.post_count ?? 0,
      threadCount: u.thread_count ?? 0,
      memberSince: u.created_date || null,
      lastActive: u.last_active || null,
      mybbUid: u.mybb_uid || null,
      mybbUsername: u.mybb_username || null,
      isAuthenticated: !!u,
      isMigrated: !!u && (!!u.username || !!u.callsign || !!u.mybb_username),
    };
  }, [user, stats]);

  const mybbUser = useMemo(() => {
    if (!user) return null;
    const canEdit = isAdmin || (roles || []).some((r) => /mod|admin|owner/i.test(r));
    return {
      uid: user.mybb_uid || user.id,
      username: user.mybb_username || user.username || user.full_name || "",
      password: null,
      role: user.role === "admin" ? "admin" : canEdit ? "moderator" : "member",
      location: user.location || "",
      avatar: user.avatar_url || user.avatar || null,
      reputation: stats.reputation ?? user.reputation ?? 0,
      postcount: stats.forum_posts ?? user.post_count ?? 0,
      threadcount: user.thread_count ?? 0,
      canEdit,
    };
  }, [user, isAdmin, roles, stats]);

  const updateProfile = useCallback(async (patch) => {
    await base44.auth.updateMe(patch);
    await checkUserAuth();
    return user;
  }, [checkUserAuth, user]);

  // Legacy no-op: MyBB no longer owns a session. Refreshing the MIST identity
  // is the closest equivalent for callers that previously used login() to
  // update local session state (e.g. after an avatar upload).
  const login = useCallback(async () => { await checkUserAuth(); }, [checkUserAuth]);

  const signOut = useCallback(() => {
    try { authLogout(true); } catch { window.location.href = "/login"; }
  }, [authLogout]);

  return { user, mistUser, loading, refresh, updateProfile, signOut, mybbUser, login };
}

export default useMistUser;