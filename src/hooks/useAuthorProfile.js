import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// useAuthorProfile — community-scoped, membership-validated profile preview.
//
// Routes through the getCommunityProfilePreview backend function, which:
//   1. Verifies the requesting user is an active member of the community.
//   2. Verifies the target author is ALSO a co-member of that community.
//   3. Returns a sanitized public-fields profile + THIS community's recent
//      activity only (never cross-community threads, never email/bio/location).
//
// Returns null when no communityId is provided (callers outside a community
// context get no profile data — no global User.get leak).
export function useAuthorProfile(communityId, authorId) {
  return useQuery({
    queryKey: ["community-profile-preview", communityId, authorId],
    queryFn: async () => {
      if (!communityId || !authorId) return null;
      return (await base44.functions.invoke("getCommunityProfilePreview", {
        community_id: communityId,
        user_id: authorId,
      })).data;
    },
    enabled: !!communityId && !!authorId,
    staleTime: 60000,
    retry: false,
  });
}

export default useAuthorProfile;