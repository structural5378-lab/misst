import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Resolves a forum post author's profile (User + UserStats + presence) with
// graceful per-field fallbacks (e.g. User.get may be RLS-restricted for some
// callers). Cached/deduped by React Query per author_id.
export function useAuthorProfile(authorId) {
  return useQuery({
    queryKey: ["author-profile", authorId],
    queryFn: async () => {
      if (!authorId) return null;
      const [userRes, statsRes, presenceRes] = await Promise.allSettled([
        base44.entities.User.get(authorId),
        base44.entities.UserStats.filter({ user_id: authorId }),
        base44.entities.UserPresence.filter({ user_id: authorId }),
      ]);
      const user = userRes.status === "fulfilled" ? userRes.value : null;
      const stats =
        statsRes.status === "fulfilled" && statsRes.value && statsRes.value[0] ? statsRes.value[0] : {};
      const presence =
        presenceRes.status === "fulfilled" && presenceRes.value && presenceRes.value[0] ? presenceRes.value[0] : null;
      return { user, stats, online: presence?.status === "online" };
    },
    enabled: !!authorId,
    staleTime: 60000,
  });
}