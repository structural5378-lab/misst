import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AdminSection from "@/components/platform/AdminSection";
import { Server, RefreshCw, Activity, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const INVENTORY = ['Community', 'CommunityMember', 'User', 'Repeater', 'Net', 'ForumThread', 'ChatMessage', 'Event', 'MarketplaceItem', 'Report', 'PlatformAuditLog', 'FeatureFlag'];

export default function PlatformAdminSystem() {
  const { data: inventory = {}, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-backup-inventory"],
    queryFn: async () => (await base44.functions.invoke("adminBackup", { action: "inventory" }))?.data?.inventory || {},
    staleTime: 60000,
  });
  const { data: env } = useQuery({
    queryKey: ["app-environment"],
    queryFn: async () => (await base44.functions.invoke("getAppEnvironment"))?.data || {},
    staleTime: 60000,
  });

  const total = Object.values(inventory).reduce((a, b) => a + (b || 0), 0);
  const isProd = env?.environment === "production" || env?.is_production;

  return (
    <AdminSection
      title="System"
      description="Platform health, data inventory, and runtime environment."
      action={<Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>}
    >
      {/* Health cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-border bg-card p-3"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground"><Activity className="w-3.5 h-3.5" /> Status</div><p className="text-lg font-bold mt-1 text-emerald-400">Operational</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground"><Database className="w-3.5 h-3.5" /> Total Records</div><p className="text-2xl font-bold mt-1">{isLoading ? "…" : total}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground"><Server className="w-3.5 h-3.5" /> Environment</div><p className={`text-lg font-bold mt-1 ${isProd ? "text-emerald-400" : "text-amber-400"}`}>{env?.environment ? env.environment.toUpperCase() : "—"}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground"><Zap className="w-3.5 h-3.5" /> Database</div><p className="text-lg font-bold mt-1">{env?.database || (isProd ? "Production" : "Test")}</p></div>
      </div>

      {/* Entity inventory */}
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Entity Inventory</h3>
      {isError ? (
        <div className="text-center py-8 rounded-2xl border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Couldn't load inventory.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {INVENTORY.map((e) => (
            <div key={e} className="rounded-2xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground truncate">{e}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{isLoading ? "…" : (inventory[e] ?? 0)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 rounded-2xl border border-border bg-card text-xs text-muted-foreground">
        <p>Runtime: Base44 BaaS · Region: auto · Build: Vite + React. Maintenance mode is managed via the <span className="text-primary font-medium">Feature Flags</span> module. Backups are managed via the <span className="text-primary font-medium">Backup &amp; Restore</span> module.</p>
      </div>
    </AdminSection>
  );
}