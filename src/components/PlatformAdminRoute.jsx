import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/**
 * PlatformAdminRoute — guards the hidden /platform/admin/* namespace.
 * Only users with a PlatformRole (platform_owner, platform_admin, platform_support) can access.
 * This is completely separate from community routing and community auth.
 */
export default function PlatformAdminRoute() {
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const res = await base44.functions.invoke("getPlatformRoles", {});
      const data = res.data;
      if (data?.error === "Unauthorized" || !data?.user) {
        setAuthChecked(false);
        setHasAccess(false);
      } else {
        setAuthChecked(true);
        const roles = data.platform_roles || [];
        setHasAccess(roles.length > 0);
      }
    } catch (err) {
      setAuthChecked(false);
      setHasAccess(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authChecked) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400 text-lg font-medium">Access Denied</p>
          <p className="text-slate-600 text-sm mt-2">You do not have platform admin access.</p>
          <a href="/" className="text-violet-400 text-sm mt-4 inline-block hover:underline">
            Return to app
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}