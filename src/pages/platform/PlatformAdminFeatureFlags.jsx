import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Flag } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_FLAGS = [
  { key: "forum", label: "Forum", description: "Community discussion forums", category: "Content", is_enabled: true },
  { key: "chat", label: "Live Chat", description: "Real-time chat messaging", category: "Content", is_enabled: true },
  { key: "messages", label: "Direct Messages", description: "Private messaging between users", category: "Content", is_enabled: true },
  { key: "marketplace", label: "Marketplace", description: "Buy and sell radio gear", category: "Content", is_enabled: true },
  { key: "radioscope", label: "RadioScope", description: "Tactical GMRS mapping system", category: "Platform", is_enabled: true },
  { key: "distance_tracking", label: "Distance Tracking", description: "Track operator miles traveled", category: "Platform", is_enabled: true },
  { key: "emergency_mode", label: "Emergency Mode", description: "Emergency broadcast system", category: "System", is_enabled: true },
  { key: "achievements", label: "Achievements", description: "Gamified achievement system", category: "Gamification", is_enabled: true },
  { key: "badges", label: "Badges", description: "Operator badge collection", category: "Gamification", is_enabled: true },
  { key: "themes", label: "Themes", description: "Custom theme engine", category: "Personalization", is_enabled: true },
  { key: "developer_mode", label: "Developer Mode", description: "Advanced developer tools", category: "System", is_enabled: false },
  { key: "beta_features", label: "Beta Features", description: "Experimental features", category: "System", is_enabled: false },
];

export default function PlatformAdminFeatureFlags() {
  const [showCreate, setShowCreate] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", label: "", description: "", category: "General" });
  const queryClient = useQueryClient();

  const { data: flags = [] } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => await base44.entities.FeatureFlag.list("-created_date", 200),
  });

  const toggle = async (flag) => {
    await base44.entities.FeatureFlag.update(flag.id, { is_enabled: !flag.is_enabled });
    queryClient.invalidateQueries(["feature-flags"]);
  };

  const createFlag = async () => {
    if (!newFlag.key || !newFlag.label) return;
    await base44.entities.FeatureFlag.create({ ...newFlag, is_enabled: true });
    queryClient.invalidateQueries(["feature-flags"]);
    setShowCreate(false);
    setNewFlag({ key: "", label: "", description: "", category: "General" });
  };

  const categories = [...new Set([...DEFAULT_FLAGS.map(f => f.category), ...flags.map(f => f.category)])];

  return (
    <AdminSection
      title="Feature Flags"
      description="Enable or disable platform features instantly"
      action={
        <Button onClick={() => setShowCreate(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Create Flag
        </Button>
      }
    >
      {categories.map(cat => {
        const catFlags = flags.filter(f => f.category === cat);
        const catDefaults = DEFAULT_FLAGS.filter(f => f.category === cat && !flags.some(fg => fg.key === f.key));
        const allFlags = [...catFlags, ...catDefaults.map(d => ({ ...d, id: `default_${d.key}`, isDefault: true }))];
        if (allFlags.length === 0) return null;
        return (
          <div key={cat} className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">{cat}</h3>
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {allFlags.map(flag => (
                  <div key={flag.id || flag.key} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Flag className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{flag.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{flag.description || flag.key}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => !flag.isDefault && toggle(flag)}
                      disabled={flag.isDefault}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${flag.is_enabled ? "bg-emerald-500" : "bg-muted"} ${flag.isDefault ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${flag.is_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Create Feature Flag</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><Label className="text-xs text-muted-foreground">Key</Label><Input value={newFlag.key} onChange={e => setNewFlag(f => ({ ...f, key: e.target.value }))} placeholder="e.g. live_cams" className="h-9 bg-background mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Label</Label><Input value={newFlag.label} onChange={e => setNewFlag(f => ({ ...f, label: e.target.value }))} placeholder="Live Cams" className="h-9 bg-background mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Description</Label><Input value={newFlag.description} onChange={e => setNewFlag(f => ({ ...f, description: e.target.value }))} placeholder="What this feature does" className="h-9 bg-background mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Category</Label><Input value={newFlag.category} onChange={e => setNewFlag(f => ({ ...f, category: e.target.value }))} placeholder="General" className="h-9 bg-background mt-1" /></div>
              <Button onClick={createFlag} className="w-full bg-violet-600 hover:bg-violet-700 text-white">Create Flag</Button>
            </div>
          </div>
        </div>
      )}
    </AdminSection>
  );
}