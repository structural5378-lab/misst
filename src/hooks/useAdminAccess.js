import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const ROLE_LEVELS = {
  platform_owner: 3,
  platform_admin: 2,
  platform_support: 1,
};

/**
 * Shared hook for admin access checking across the app.
 * Returns isAdmin (boolean), roles array, and maxRoleLevel (0-3).
 * Role levels: platform_owner=3, platform_admin=2, platform_support=1.
 */
export function useAdminAccess() {
  const { data } = useQuery({
    queryKey: ['admin-access'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPlatformRoles', {});
      return res.data;
    },
    staleTime: 30000,
  });

  const roles = data?.platform_roles || [];
  const isAdmin = roles.length > 0;
  const maxRoleLevel = Math.max(...roles.map(r => ROLE_LEVELS[r.role] || 0), 0);

  return { isAdmin, roles, maxRoleLevel };
}