import React, { useState } from "react";
import { Radio, ChevronDown } from "lucide-react";

// RadioScopeCommunitySelector — top-of-page switcher for the active community.
// Switching instantly re-scopes all RadioScope data (members, repeaters, nets,
// alerts, stats) via the community-keyed query. No restart required.
export default function RadioScopeCommunitySelector({ communities, active, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold max-w-[180px] active:scale-95 transition"
      >
        <Radio className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{active?.name || "Select community"}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-50 w-64 rounded-xl bg-card border border-cyan-500/20 shadow-2xl overflow-hidden max-h-72 overflow-y-auto scrollbar-hide fade-in">
            {communities.length === 0 && (
              <div className="p-4 text-xs text-muted-foreground text-center">No communities joined</div>
            )}
            {communities.map((c) => (
              <button
                key={c.id}
                onClick={() => { onChange(c); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-cyan-500/10 transition-colors ${c.id === active?.id ? "bg-cyan-500/15" : ""}`}
              >
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-[11px] font-bold text-cyan-300 shrink-0">
                    {(c.name || "?").charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium text-xs ${c.id === active?.id ? "text-cyan-300" : "text-foreground"}`}>{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.location || "No location set"}</p>
                </div>
                {c.id === active?.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)] shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}