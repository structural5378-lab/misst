import React, { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import McvSignalIcon from "./McvSignalIcon";
import { statusConfig } from "@/components/mission/helpers";

// McvStationsTable — Active Stations. Enhanced for V3: sortable columns
// (click headers), live search filter, density toggle (comfortable/compact/
// ultra), sticky header + sticky first column. `bare` omits the outer card so
// it can sit inside McvPanelChrome. Backward compatible (defaults preserve the
// original single-prop usage).
const COLS = [
  { key: "callsign", label: "Callsign", sortable: true },
  { key: "checked_in_at", label: "Last TX", sortable: true },
  { key: "signal", label: "Signal", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "location", label: "Location", sortable: false },
  { key: "type", label: "Type", sortable: false },
  { key: "battery", label: "Battery", sortable: false },
];

const DENSITY = {
  comfortable: "px-2.5 py-2",
  compact: "px-2 py-1.5",
  ultra: "px-1.5 py-1",
};

export default function McvStationsTable({ checkins, bare, density = "comfortable", query = "" }) {
  const [sortKey, setSortKey] = useState("callsign");
  const [sortDir, setSortDir] = useState("asc");
  const toggleSort = (k) => { if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc")); else { setSortKey(k); setSortDir("asc"); } };

  const rows = useMemo(() => {
    let r = [...checkins];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((c) => (c.callsign || "").toLowerCase().includes(q) || (c.location || "").toLowerCase().includes(q));
    }
    r.sort((a, b) => {
      const av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [checkins, query, sortKey, sortDir]);

  const cell = DENSITY[density] || DENSITY.comfortable;

  const table = (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full text-xs">
        <thead className="bg-white/[0.03] text-muted-foreground sticky top-0 z-10">
          <tr>
            {COLS.map((c) => (
              <th key={c.key} onClick={c.sortable ? () => toggleSort(c.key) : undefined} className={`text-left font-semibold ${cell} whitespace-nowrap ${c.sortable ? "cursor-pointer hover:text-foreground select-none" : ""} ${c.key === "callsign" ? "sticky left-0 z-10 bg-[#1a1f26]" : ""}`}>
                <span className="inline-flex items-center gap-1">{c.label}{c.sortable && (sortKey === c.key ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {rows.length === 0 ? (
            <tr><td colSpan={COLS.length} className="text-center text-muted-foreground py-4">No active stations.</td></tr>
          ) : rows.map((c) => {
            const sc = statusConfig(c.status);
            return (
              <tr key={c.id} className="hover:bg-white/[0.02]">
                <td className={`${cell} font-semibold whitespace-nowrap sticky left-0 z-[1] bg-[#15191e]`}>{c.callsign}</td>
                <td className={`${cell} text-muted-foreground whitespace-nowrap`}>{c.checked_in_at ? new Date(c.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className={cell}><McvSignalIcon report={c.signal_report} /></td>
                <td className={cell}><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                <td className={`${cell} text-muted-foreground truncate max-w-[120px]`}>{c.location || "—"}</td>
                <td className={`${cell} text-muted-foreground capitalize whitespace-nowrap`}>{c.status === "mobile" ? "Mobile" : c.status === "base" ? "Base" : "—"}</td>
                <td className={`${cell} text-muted-foreground`}>—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (bare) return <div className="h-full min-h-0 flex flex-col">{table}</div>;
  return <div className="rounded-xl bg-[#15191e] border border-white/[0.06] overflow-hidden h-full min-h-0 flex flex-col">{table}</div>;
}