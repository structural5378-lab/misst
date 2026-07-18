import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const { data } = useQuery({
    queryKey: ["admin-global-search", query],
    queryFn: async () => {
      const users = await base44.entities.User.list(100);
      const repeaters = await base44.entities.Repeater.list(100);
      const q = query.toLowerCase();
      return {
        users: (users || []).filter((u) => (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)).slice(0, 6),
        repeaters: (repeaters || []).filter((r) => (r.name || r.callsign || "").toLowerCase().includes(q)).slice(0, 6),
      };
    },
    enabled: query.length >= 2,
  });

  const results = data || { users: [], repeaters: [] };
  const hasResults = results.users.length || results.repeaters.length;

  return (
    <div className="relative flex-1 max-w-md min-w-0" ref={ref}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search users, repeaters…"
        className="pl-8 h-9 bg-background/60"
      />
      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {!hasResults && <div className="px-3 py-4 text-sm text-muted-foreground text-center">No matches found.</div>}
          {results.users.length > 0 && (
            <div className="p-1.5">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1">Users</div>
              {results.users.map((u) => (
                <button key={u.id} onClick={() => { setOpen(false); navigate("/platform/admin/users"); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left">
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="min-w-0"><div className="text-sm text-foreground truncate">{u.full_name || u.email}</div><div className="text-xs text-muted-foreground truncate">{u.email}</div></div>
                </button>
              ))}
            </div>
          )}
          {results.repeaters.length > 0 && (
            <div className="p-1.5 border-t border-border">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1">Repeaters</div>
              {results.repeaters.map((r) => (
                <button key={r.id} onClick={() => { setOpen(false); navigate("/platform/admin/repeaters"); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div className="text-sm text-foreground truncate">{r.name || r.callsign}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}