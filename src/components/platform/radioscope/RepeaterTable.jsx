import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2 } from "lucide-react";

const STATUS_BADGE = {
  online: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  offline: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  busy: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function RepeaterTable({ repeaters, selectedIds, onToggle, onToggleAll, onEdit, onDelete }) {
  const allChecked = repeaters.length > 0 && selectedIds.length === repeaters.length;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr className="text-left">
              <th className="p-3 w-10">
                <Checkbox checked={allChecked} onCheckedChange={(v) => onToggleAll(!!v)} />
              </th>
              <th className="p-3 font-semibold">Callsign</th>
              <th className="p-3 font-semibold">Freq</th>
              <th className="p-3 font-semibold">Band</th>
              <th className="p-3 font-semibold">Location</th>
              <th className="p-3 font-semibold">Community</th>
              <th className="p-3 font-semibold">Coverage</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {repeaters.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                <td className="p-3"><Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={(v) => onToggle(r.id, !!v)} /></td>
                <td className="p-3 font-semibold text-foreground">{r.callsign}</td>
                <td className="p-3 text-muted-foreground">{r.frequency ? `${r.frequency} MHz` : "—"}</td>
                <td className="p-3 text-muted-foreground">{r.band || "—"}</td>
                <td className="p-3 text-muted-foreground truncate max-w-[180px]">{r.location || "—"}</td>
                <td className="p-3 text-muted-foreground truncate max-w-[160px]">{r.community_name || "—"}</td>
                <td className="p-3 text-muted-foreground">{r.coverage_radius ? `${r.coverage_radius} mi` : "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${STATUS_BADGE[r.status] || "bg-muted text-muted-foreground border-border"}`}>{r.status}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(r)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(r)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}