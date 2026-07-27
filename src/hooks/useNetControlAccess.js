import { useAdminAccess } from "./useAdminAccess";
import { useMistUser } from "./useMistUser";

// useNetControlAccess — determines whether the current user may access the
// Net Control dashboard and perform operator actions. Granted via the admin
// Roles panel by assigning a role whose permissions include "nets.manage".
// Platform admins and legacy moderators always have control.
export function useNetControlAccess() {
  const { isAdmin, permissions } = useAdminAccess();
  const { mybbUser } = useMistUser();
  const canControl =
    !!isAdmin ||
    (permissions || []).includes("nets.manage") ||
    (permissions || []).includes("nets.start") ||
    (permissions || []).includes("*") ||
    mybbUser?.role === "moderator";
  return { canControl, isAdmin, permissions };
}