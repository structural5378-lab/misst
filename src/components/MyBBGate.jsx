import React from "react";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Wrap any content that requires a certain role.
 * roles: array of allowed roles e.g. ["admin", "moderator"]
 * If no roles passed, just requires any logged-in mybb user.
 * fallback: what to show when denied (defaults to a notice)
 */
export default function MyBBGate({ roles = [], children, fallback }) {
  const { mybbUser } = useMyBBAuth();
  const navigate = useNavigate();

  if (!mybbUser) {
    return fallback ?? (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <ShieldOff className="w-10 h-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Sign in required</h3>
        <p className="text-xs text-muted-foreground mb-4">Please sign in with your forum account to continue.</p>
        <Button size="sm" onClick={() => navigate("/login")}>Sign In</Button>
      </div>
    );
  }

  if (roles.length > 0 && !roles.includes(mybbUser.role)) {
    return fallback ?? (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <ShieldOff className="w-10 h-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Access restricted</h3>
        <p className="text-xs text-muted-foreground">
          You need <strong>{roles.join(" or ")}</strong> privileges to do this.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}