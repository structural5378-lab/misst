import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Play, Pencil, Trash2, FileText, Loader2 } from "lucide-react";

// UpcomingNetCard — operator card for a scheduled net (not currently live).
// Actions: Start Net, Edit, Delete, View Logs. All mutating actions go through
// the guarded manageNet function.
export default function UpcomingNetCard({ net, onChanged, onEdit }) {
  const [busy, setBusy] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const run = async (action, extra = {}) => {
    setBusy(action);
    try {
      await base44.functions.invoke("manageNet", { action, id: net.id, ...extra });
      onChanged?.();
    } catch (e) { console.error(e); }
    setBusy("");
  };

  return (
    <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{net.name}</h3>
          <p className="text-xs text-muted-foreground">{net.day_of_week || "—"} · {net.time || "—"} · {net.frequency ? `${net.frequency} MHz` : "—"}</p>
          {net.primary_net_control && <p className="text-[11px] text-violet-300/70 mt-0.5">Net Control: {net.primary_net_control}</p>}
          {net.status === "disabled" && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium">Disabled</span>}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => run("start")}
            disabled={!!busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold active:scale-95 disabled:opacity-50"
          >
            {busy === "start" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Start Net
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px]">
        <button onClick={onEdit} className="flex items-center gap-1 text-violet-300 hover:text-violet-200"><Pencil className="w-3 h-3" /> Edit</button>
        <Link to={`/nets/${net.id}/control`} className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200"><FileText className="w-3 h-3" /> View Logs</Link>
        {!confirmDel ? (
          <button onClick={() => setConfirmDel(true)} className="flex items-center gap-1 text-rose-400 hover:text-rose-300 ml-auto"><Trash2 className="w-3 h-3" /> Delete</button>
        ) : (
          <span className="ml-auto flex items-center gap-1">
            <button onClick={() => run("delete")} disabled={!!busy} className="text-rose-400 font-semibold">{busy === "delete" ? "…" : "Confirm"}</button>
            <button onClick={() => setConfirmDel(false)} className="text-muted-foreground">Cancel</button>
          </span>
        )}
      </div>
    </div>
  );
}