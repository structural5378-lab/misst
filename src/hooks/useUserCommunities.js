import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Returns all communities the current user belongs to (with their role),
 * via the getUserCommunities backend function. Used by the onboarding gate
 * and the community switcher.
 */
export function useUserCommunities() {
  return useQuery({
    queryKey: ["user-communities"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getUserCommunities", {});
      return res.data?.communities || [];
    },
    staleTime: 30 * 1000,
  });
}