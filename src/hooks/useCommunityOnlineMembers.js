import { useQuery } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { usePollingGate } from "./usePollingGate";

/**
 * useCommunityOnlineMembers — community-scoped online presence.
 *
 * Returns the members of the given community who are currently online
 * (UserPresence INTERSECT active CommunityMember). The backend function
 * validates membership and never returns users from other communities.
 *
 * Returns { online: [...], total }. `online` is empty until a communityId
 * is provided. Polling pauses when the tab is hidden or the user is idle
 * (3 min) and resumes instantly on interaction — saves backend calls
 * without affecting responsiveness.
 */
export function useCommunityOnlineMembers(communityId) {
  const active = usePollingGate();
  return useQuery({
    queryKey: ["community-online", communityId],
    queryFn: async () =>
      (await mist.functions.invoke("getCommunityOnlineMembers", {
        community_id: communityId,
      })).data,
    enabled: !!communityId,
    staleTime: 15000,
    refetchInterval: active ? 30000 : false,
  });
}

export default useCommunityOnlineMembers;