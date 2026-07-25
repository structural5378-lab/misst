import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, RefreshCw, Download, ShieldAlert } from "lucide-react";

const ALL_ENTITIES = ['Community', 'CommunityMember', 'User', 'Repeater', 'Net', 'ForumThread', 'ChatMessage', 'Event', 'MarketplaceItem', 'Report', 'PlatformAuditLog', 'FeatureFlag'];

export default function PlatformAdminBackup() {
  const { toast } = useToast();
  const [selected, setSelected] = useState(new Set(ALL_ENTITIES));
  const [exporting, setExporting] = useState(false);

  const { data: inventory = {}, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-backup-inventory"],
    queryFn: async () => (await base44.functions.invoke("adminBackup", { action: "inventory" }))?.data?.inventory || {},
    staleTime: 60000,
  });

  const toggle = (e) => setSelected((p) => { const n = new Set(p); n.has(e) ? n.delete(e) : n.add(e); return n; });
  const totalRecords = Object.values(inventory).reduce((a, b) => a + (b || 0), 0);

  const doExport = async () => {
    const entities = Array.from(selected);
    if (!entities.length) return toast({ title: "Select at least one entity", variant: "destructive" });
    setExporting(true);
    try {
      const res = await base44.functions.invoke("adminBackup", { action: "snapshot", entities });
      const snap = res.data?.snapshot || {};
      const blob = new Blob([JSON.stringify({ exported_at: res.data?.exported_at, exported_by: res.data?.exported_by, entities, data: snap }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `mist-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup exported", description: `${entities.length} entities` });
    } catch (e) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally { setExporting(false); }
  };

  return (
    <AdminSection
      title="Backup & Restore"
      description="Export platform data snapshots for safekeeping and migration."
      action={<div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
        <Button size="sm" onClick={doExport} disabled={exporting}><Download className="w-4 h-4" /> {exporting ? "Exporting…" : "Export Backup"}</Button>
      </div>}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Entities Tracked</p><p className="text-2xl font-bold mt-1">{ALL_ENTITIES.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Records</p><p className="text-2xl font-bold mt-1">{totalRecords}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Selected</p><p className="text-2xl font-bold mt-1">{selected.size}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Format</p><p className="text-lg font-bold mt-1">JSON</p></div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <DatabaseBackup className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load inventory.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Select entities to include in the backup</span>
            <button className="text-primary" onClick={() => setSelected(selected.size === ALL_ENTITIES.length ? new Set() : new Set(ALL_ENTITIES))}>{selected.size === ALL_ENTITIES.length ? "Clear all" : "Select all"}</button>
          </div>
          <div className="divide-y divide-border">
            {ALL_ENTITIES.map((e) => (
              <label key={e} className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-secondary/30">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(e)} onChange={() => toggle(e)} className="accent-primary w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">{e}</span>
                </span>
                <span className="text-sm text-muted-foreground">{inventory[e] ?? 0} records</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Restore is a destructive operation. Imports are not exposed in the UI to prevent accidental data loss — contact Base44 support to restore from a backup snapshot.</p>
      </div>
    </AdminSection>
  );
}