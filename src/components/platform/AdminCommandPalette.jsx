import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, Shield, ArrowLeft } from "lucide-react";
import { getAppNavItems, getAllAdminDestinations } from "@/lib/adminNav";
import { useCommunity } from "@/hooks/useCommunity";

export default function AdminCommandPalette({ open, setOpen }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const { community } = useCommunity();
  const slug = community?.slug || null;

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const destinations = useMemo(() => {
    const admin = getAllAdminDestinations().map((d) => ({ ...d, area: "Admin" }));
    const app = getAppNavItems(slug).map((d) => ({ ...d, area: "Application" }));
    const home = [
      { label: "Return to MISST (last page)", path: "__return__", icon: ArrowLeft, area: "Application" },
      { label: "Administration Home", path: "/platform/admin", icon: Shield, area: "Admin" },
    ];
    return [...home, ...admin, ...app];
  }, [slug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) => d.label.toLowerCase().includes(q) || d.path.toLowerCase().includes(q) || (d.group || "").toLowerCase().includes(q));
  }, [query, destinations]);

  useEffect(() => { setActive(0); }, [query]);

  const go = (d) => {
    setOpen(false);
    if (!d) return;
    if (d.path === "__return__") {
      const last = sessionStorage.getItem("mist_last_app_path") || "/";
      navigate(last);
    } else {
      navigate(d.path);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(filtered[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  if (!open) return null;

  let lastArea = null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to any admin or app page…"
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {filtered.length === 0 && <div className="px-3 py-6 text-sm text-muted-foreground text-center">No matches.</div>}
          {filtered.map((d, i) => {
            const showArea = d.area !== lastArea;
            lastArea = d.area;
            return (
              <div key={d.path + i}>
                {showArea && <div className="text-[10px] uppercase font-semibold text-muted-foreground/60 px-3 pt-2 pb-1">{d.area}</div>}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(d)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${i === active ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted"}`}
                >
                  <d.icon className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="flex-1 truncate">{d.label}</span>
                  {d.group && <span className="text-[10px] text-muted-foreground hidden sm:inline">{d.group}</span>}
                  {i === active && <CornerDownLeft className="w-3.5 h-3.5 opacity-50" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}