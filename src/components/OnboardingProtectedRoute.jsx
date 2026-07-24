import { useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useUserCommunities } from "@/hooks/useUserCommunities";

/**
 * OnboardingProtectedRoute — guards the full-screen onboarding + community
 * creation flows. Requires authentication. Lets through users with no
 * community (so they can complete onboarding). Redirects users who already
 * belong to a community away from the onboarding screen back to the app.
 */
export default function OnboardingProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const { data: communities, isLoading: commLoading } = useUserCommunities();
  const location = useLocation();

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

  if (authError?.type === "user_not_registered") return <Navigate to="/login" replace />;
  if (authError || !isAuthenticated) return <Navigate to="/login" replace />;

  const hasCommunity = (communities || []).length > 0;
  if (hasCommunity && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}