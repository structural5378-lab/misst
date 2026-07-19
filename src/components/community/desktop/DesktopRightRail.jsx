import { useState, useEffect } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { StatsWidget, OnlineWidget, TrendingWidget, PinnedWidget } from "./RightWidgets";

const WIDGET_ORDER = ["stats", "online", "trending", "pinned"];
const STORAGE_KEY = "mist-desktop-widget-collapsed";

function useCollapsedWidgets() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  });
  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));
  }, [collapsed]);
  return { collapsed, toggle };
}

export default function DesktopRightRail() {
  const [hidden, setHidden] = useState(() => localStorage.getItem("mist-desktop-rail-hidden") === "true");
  const { collapsed, toggle } = useCollapsedWidgets();

  useEffect(() => { localStorage.setItem("mist-desktop-rail-hidden", String(hidden)); }, [hidden]);

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        aria-label="Show right panel"
        title="Show right panel"
        className="shrink-0 w-10 h-full border-l border-border bg-card/40 flex items-center justify-center text-muted-foreground hover:text-primary"
      >
        <PanelRightOpen className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="shrink-0 w-72 h-full border-l border-border bg-card/30 flex flex-col">
      <div className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Widgets</span>
        <button
          onClick={() => setHidden(true)}
          aria-label="Hide right panel"
          title="Hide right panel"
          className="p-1 rounded text-muted-foreground hover:text-primary"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <StatsWidget collapsed={collapsed.has("stats")} onToggle={() => toggle("stats")} />
        <OnlineWidget collapsed={collapsed.has("online")} onToggle={() => toggle("online")} />
        <TrendingWidget collapsed={collapsed.has("trending")} onToggle={() => toggle("trending")} />
        <PinnedWidget collapsed={collapsed.has("pinned")} onToggle={() => toggle("pinned")} />
      </div>
    </aside>
  );
}