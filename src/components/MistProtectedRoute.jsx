import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import AppLayout from "@/components/layout/AppLayout";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

/**
 * MistProtectedRoute — the unified MIST authentication middleware.
 *
 * MIST native auth is the ONLY authentication provider. Users authenticate once
 * (email/password or Google) and that single session/token/identity governs
 * the entire platform. The separate MyBB login is retired; legacy MyBB data is
 * reached through the MIST identity during migration.
 */
export default function MistProtectedRoute({ unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const { data: communities, isLoading: commLoading } = useUserCommunities();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) checkUserAuth();
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked || commLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (authError?.type === "user_not_registered") return <UserNotRegisteredError />;
  if (authError || !isAuthenticated) {
    return unauthenticatedElement || <Navigate to="/login" replace />;
  }

  // Mandatory community onboarding: users with no community are sent to onboarding.
  if (!communities || communities.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}