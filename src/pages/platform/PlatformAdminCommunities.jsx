import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Building, Users, Eye, EyeOff, Globe } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";

export default function PlatformAdminCommunities() {
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities"],
    queryFn: async () => await base44.entities.Community.list("-created_date", 200),
  });

  return (
    <AdminSection title="Communities" description={`${communities.length} communities on the platform`}>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {communities.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.slug} · {c.plan || "free"} plan</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{c.member_count || 0}</span>
                {c.visibility === "public" ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{c.status || "active"}</span>
              </div>
            </div>
          ))}
          {communities.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No communities yet</div>}
        </div>
      </div>
    </AdminSection>
  );
}