import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * useCommunityContent — the membership-validated read path for ALL
 * community-scoped content. Delegates to the listCommunityContent backend
 * function, which verifies the caller is an active member (or platform
 * admin) and forces the community_id filter server-side. Never reads the
 * underlying entity directly from the client.
 *
 * @param communityId  active community id (required)
 * @param entity       one of: Event, Repeater, GatheringPhoto, ForumThread,
 *                     ChatMessage, ChatV2Room, ChatV2RoomMessage, Alert,
 *                     MarketplaceItem, Net
 * @param opts         { sort, limit, extra, refetchInterval }
 */
export function useCommunityContent(communityId, entity, opts = {}) {
  return useQuery({
    queryKey: [
      "community-content",
      communityId,
      entity,
      opts.sort,
      opts.limit,
      JSON.stringify(opts.extra || {}),
    ],
    queryFn: async () =>
      (await base44.functions.invoke("listCommunityContent", {
        community_id: communityId,
        entity,
        sort: opts.sort || "-created_date",
        limit: opts.limit || 50,
        extra: opts.extra,
      })).data,
    enabled: !!communityId,
    staleTime: 15000,
    refetchInterval: opts.refetchInterval ?? 30000,
    retry: false,
  });
}

export default useCommunityContent;