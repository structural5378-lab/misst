import React from "react";
import McvSignalIcon from "./McvSignalIcon";
import { statusConfig } from "@/components/mission/helpers";

// McvStationsTable — Active Stations table (center column bottom): callsign,
// last TX, signal, status, location, type, battery.
const HEADERS = ["Callsign", "Last TX", "Signal", "Status", "Location", "Type", "Battery"];

export default function McvStationsTable({ checkins }) {
  return (
    <div className="rounded-xl bg-[#15191e] border border-white/[0.06] overflow-hidden h-full min-h-0 flex flex-col">
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.03] text-muted-foreground">
            <tr>{HEADERS.map((h) => <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {checkins.length === 0 ? (
              <tr><td colSpan={HEADERS.length} className="text-center text-muted-foreground py-4">No active stations.</td></tr>
            ) : checkins.map((c) => {
              const sc = statusConfig(c.status);
              return (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-2.5 py-2 font-semibold whitespace-nowrap">{c.callsign}</td>
                  <td className="px-2.5 py-2 text-muted-foreground whitespace-nowrap">{c.checked_in_at ? new Date(c.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="px-2.5 py-2"><McvSignalIcon report={c.signal_report} /></td>
                  <td className="px-2.5 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  <td className="px-2.5 py-2 text-muted-foreground truncate max-w-[120px]">{c.location || "—"}</td>
                  <td className="px-2.5 py-2 text-muted-foreground capitalize whitespace-nowrap">{c.status === "mobile" ? "Mobile" : c.status === "base" ? "Base" : "—"}</td>
                  <td className="px-2.5 py-2 text-muted-foreground">—</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}