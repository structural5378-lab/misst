import { useEffect, useState } from "react";
import { useUserCommunities } from "@/hooks/useUserCommunities";

/**
 * useActiveCommunity — resolves the user's currently selected community.
 *
 * Source of truth matches the CommunitySelector: the `selected_community_id`
 * value in localStorage, falling back to the first community the user
 * belongs to. Returns null when the user has no communities yet.
 *
 * This is the "active community" context for main-app (non /c/:slug) pages
 * that must be community-scoped (e.g. the Members directory). It listens for
 * `storage` events so switching communities elsewhere updates consumers.
 */
export function useActiveCommunity() {
  const { data: communities = [], isLoading } = useUserCommunities();
  const [selectedId, setSelectedId] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("selected_community_id") : null
  );

  useEffect(() => {
    const sync = () => setSelectedId(localStorage.getItem("selected_community_id"));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const community =
    communities.find((c) => c.id === selectedId) || communities[0] || null;

  return { community, communities, isLoading };
}

export default useActiveCommunity;