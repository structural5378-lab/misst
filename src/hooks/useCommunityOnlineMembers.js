import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * useCommunityOnlineMembers — community-scoped online presence.
 *
 * Returns the members of the given community who are currently online
 * (UserPresence INTERSECT active CommunityMember). The backend function
 * validates membership and never returns users from other communities.
 *
 * Returns { online: [...], total }. `online` is empty until a communityId
 * is provided.
 */
export function useCommunityOnlineMembers(communityId) {
  return useQuery({
    queryKey: ["community-online", communityId],
    queryFn: async () =>
      (await base44.functions.invoke("getCommunityOnlineMembers", {
        community_id: communityId,
      })).data,
    enabled: !!communityId,
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export default useCommunityOnlineMembers;