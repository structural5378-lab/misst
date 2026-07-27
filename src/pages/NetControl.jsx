import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetControlAccess } from "@/hooks/useNetControlAccess";
import { Radio, Plus, Activity, History, CalendarClock, Lock } from "lucide-react";
import UpcomingNetCard from "@/components/netcontrol/UpcomingNetCard";
import ActiveNetCard from "@/components/netcontrol/ActiveNetCard";
import PastNetCard from "@/components/netcontrol/PastNetCard";
import CreateNetDialog from "@/components/netcontrol/CreateNetDialog";

// NetControl — the Mission Control dashboard hub for Net Control operators.
// Three sections: Upcoming nets (Start/Edit/Delete/View Logs), the Active net
// status card (Pause/Resume/End/Log/Check-ins/Broadcast), and Past nets.
// Gated by the nets.manage permission; a floating + opens the Create Net form.
export default function NetControl() {
  const { canControl } = useNetControlAccess();
  const qc = useQueryClient();
  const [tab, setTab] = useState("active");
  const [showCreate, setShowCreate] = useState(false);

  const { data: nets = [] } = useQuery({
    queryKey: ["nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 200),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["net-sessions-all"],
    queryFn: () => base44.entities.NetSession.list("-started_at", 200),
    refetchInterval: 10000,
  });

  if (!canControl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <Lock className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h1 className="text-lg font-bold text-foreground">Net Control Access Required</h1>
        <p className="text-sm text-muted-foreground mt-1">You need the Net Control permission to view this dashboard.</p>
        <Link to="/" className="mt-4 text-sm text-primary">← Back to Home</Link>
      </div>
    );
  }

  const activeSessions = (sessions || []).filter((s) => s.status === "active" || s.status === "paused");
  const activeNetIds = new Set(activeSessions.map((s) => s.net_id));
  const operatorNets = (nets || []).filter((n) => n.status !== "archived");
  const upcoming = operatorNets.filter((n) => !activeNetIds.has(n.id));
  const pastSessions = (sessions || []).filter((s) => s.status === "closed");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["nets"] });
    qc.invalidateQueries({ queryKey: ["net-sessions-all"] });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">🎙 Net Control</h1>
            <p className="text-[11px] text-muted-foreground">Mission Control Dashboard</p>
          </div>
        </div>
        <Link to="/nets" className="text-xs text-violet-300/70 hover:text-violet-200">Public Schedule →</Link>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <div className="flex gap-2 p-1 rounded-2xl bg-card/60 border border-white/[0.06]">
          {[
            { k: "active", label: "Active", Icon: Activity, count: activeSessions.length },
            { k: "upcoming", label: "Upcoming", Icon: CalendarClock, count: upcoming.length },
            { k: "past", label: "Past", Icon: History, count: pastSessions.length },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${tab === t.k ? "bg-violet-500/20 text-violet-200 border border-violet-500/30" : "text-muted-foreground"}`}
            >
              <t.Icon className="w-3.5 h-3.5" /> {t.label}
              {t.count > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px]">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === "active" && (
          <div className="space-y-3">
            {activeSessions.length === 0 ? (
              <Empty icon={Activity} title="No Active Net" sub="Start a net from the Upcoming tab to open the console." />
            ) : (
              activeSessions.map((s) => <ActiveNetCard key={s.id} session={s} net={nets.find((n) => n.id === s.net_id)} onChanged={refresh} />)
            )}
          </div>
        )}

        {tab === "upcoming" && (
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <Empty icon={CalendarClock} title="No Upcoming Nets" sub="Tap the + button to create a net." />
            ) : (
              upcoming.map((n) => <UpcomingNetCard key={n.id} net={n} onChanged={refresh} onEdit={() => setShowCreate({ net: n })} />)
            )}
          </div>
        )}

        {tab === "past" && (
          <div className="space-y-3">
            {pastSessions.length === 0 ? (
              <Empty icon={History} title="No Past Nets" sub="Completed nets will appear here with their logs." />
            ) : (
              pastSessions.map((s) => <PastNetCard key={s.id} session={s} />)
            )}
          </div>
        )}
      </div>

      {/* Floating Create button */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-xl shadow-violet-500/40 flex items-center justify-center active:scale-90 transition"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {showCreate && <CreateNetDialog open={!!showCreate} editing={showCreate?.net || null} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refresh(); }} />}
    </div>
  );
}

function Empty({ icon: Icon, title, sub }) {
  return (
    <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-8 text-center">
      <Icon className="w-10 h-10 text-violet-400/50 mx-auto mb-3" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}