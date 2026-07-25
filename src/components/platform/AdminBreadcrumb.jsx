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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-foreground transition-colors">MISST</Link>
        <ChevronRight className="w-3 h-3" />
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-foreground font-medium">Administration</span>
      </div>
    );
  }

  const label = labelMap[path];
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
      <Link to="/" className="hover:text-foreground transition-colors">MISST</Link>
      <ChevronRight className="w-3 h-3" />
      <Link to="/platform/admin" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Shield className="w-3.5 h-3.5 text-primary" />
        Administration
      </Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground font-medium">{label || "Section"}</span>
    </div>
  );
}