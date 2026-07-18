import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Shield } from "lucide-react";
import { adminNavSections } from "@/lib/adminNav";

const labelMap = {};
adminNavSections.forEach((s) => s.items.forEach((i) => { labelMap[i.path] = i.label; }));

export default function AdminBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  if (path === "/platform/admin") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-foreground font-medium">Dashboard</span>
      </div>
    );
  }

  const label = labelMap[path];
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/platform/admin" className="hover:text-foreground">Dashboard</Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground font-medium">{label || "Section"}</span>
    </div>
  );
}