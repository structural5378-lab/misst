import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Shield, ChevronLeft } from "lucide-react";
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
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authChecked) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-foreground text-lg font-bold">Access Denied</p>
        <p className="text-muted-foreground text-sm mt-2 text-center max-w-xs">
          You do not have platform admin access. If you believe this is an error, contact a platform administrator.
        </p>
        <a href="/" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Return to App
        </a>
      </div>
    );
  }

  return <Outlet />;
}