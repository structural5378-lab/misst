import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useAuth } from "@/lib/AuthContext";
import AppLayout from "@/components/layout/AppLayout";

/**
 * DualProtectedRoute — allows access via EITHER Base44 native auth OR MyBB bridge auth.
 * This enables the dual-auth migration period where both systems coexist.
 * Once all users are migrated to native auth, this will be replaced by ProtectedRoute.
 */
export default function DualProtectedRoute() {
  const { mybbUser } = useMyBBAuth();
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();
  const [mybbChecked, setMybbChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();
    setMybbChecked(true);
  }, [checkUserAuth]);

  if (isLoadingAuth || !authChecked || !mybbChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Allow if either auth system is valid
  if (!mybbUser && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}