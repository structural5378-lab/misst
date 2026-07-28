import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Radio, ChevronRight, Plus } from "lucide-react";
import CreateNetDialog from "@/components/netcontrol/CreateNetDialog";

// McvNetPicker — shown when Mission Control V2 is opened with no net selected
// and no active session to auto-open. Lists nets (active flagged LIVE) and a
// Create Net button. Choosing a net navigates to its command center.
export default function McvNetPicker() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data: nets = [] } = useQuery({ queryKey: ["nets"], queryFn: () => base44.entities.Net.list("-created_date", 200) });
  const { data: sessions = [] } = useQuery({ queryKey: ["net-sessions-all"], queryFn: () => base44.entities.NetSession.list("-started_at", 50) });
  const activeIds = new Set((sessions || []).filter((s) => s.status === "active" || s.status === "paused").map((s) => s.net_id));
  const open = (nets || []).filter((n) => n.status !== "archived");

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"><Radio className="w-5 h-5 text-white" /></div>
        <div>
          <h1 className="text-lg font-bold">Mission Control</h1>
          <p className="text-xs text-muted-foreground">Select a net to open the command center</p>
        </div>
      </div>
      <button onClick={() => setShowCreate(true)} className="w-full mb-3 py-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 text-sm font-bold flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> Create New Net</button>
      <div className="space-y-2">
        {open.map((n) => (
          <button key={n.id} onClick={() => navigate(`/nets/${n.id}/control`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 text-left">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Radio className="w-4 h-4 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{n.name}</p>
              <p className="text-xs text-muted-foreground truncate">{n.schedule} {n.time} · {n.frequency ? `${n.frequency} MHz` : ""}</p>
            </div>
            {activeIds.has(n.id) && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">LIVE</span>}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
        {open.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No nets available. Create one to begin.</p>}
      </div>
      {showCreate && <CreateNetDialog open={showCreate} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["nets"] }); }} />}
    </div>
  );
}