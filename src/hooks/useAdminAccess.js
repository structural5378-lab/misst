import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const ROLE_LEVELS = {
  platform_owner: 3,
  platform_admin: 2,
  platform_support: 1,
};

/**
 * Shared hook for admin access checking across the app.
 * Now reads from the centralized RBAC resolver (single source of truth) while
 * preserving the legacy return shape (isAdmin, roles, maxRoleLevel) so existing
 * consumers keep working. Also exposes the granular `permissions` array and the
 * raw RBAC role slugs.
 */
export function useAdminAccess() {
  const { data } = useQuery({
    queryKey: ['rbac-access'],
    queryFn: async () => {
      const res = await base44.functions.invoke('resolveRbac', {});
      return res.data;
    },
    staleTime: 30000,
  });

  const legacy = data?.legacy_platform_roles || [];
  const roles = data?.roles || [];
  const permissions = data?.permissions || [];
  const isAdmin = !!data?.is_admin;
  const maxRoleLevel = Math.max(...legacy.map(r => ROLE_LEVELS[r] || 0), 0);

  return { isAdmin, roles, permissions, legacyRoles: legacy, maxRoleLevel };
}