import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Flag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const { data } = useQuery({
    queryKey: ["admin-bell-stats"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAdminStats", {});
      return res.data?.stats || {};
    },
    refetchInterval: 30000,
  });

  const pendingReports = data?.reportsPending ?? 0;
  const alerts = data?.activeAlerts ?? 0;
  const total = pendingReports + alerts;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{total > 99 ? "99+" : total}</span>
        )}
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 w-72 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs font-semibold text-foreground">Admin Alerts</div>
          <button onClick={() => { setOpen(false); navigate("/platform/admin/reports"); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left">
            <Flag className="w-4 h-4 text-rose-400" />
            <div className="flex-1"><div className="text-sm text-foreground">Pending Reports</div><div className="text-xs text-muted-foreground">{pendingReports} awaiting review</div></div>
            {pendingReports > 0 && <span className="text-rose-400 text-xs font-bold">{pendingReports}</span>}
          </button>
          <button onClick={() => { setOpen(false); navigate("/platform/admin"); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left border-t border-border">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div className="flex-1"><div className="text-sm text-foreground">Active Alerts</div><div className="text-xs text-muted-foreground">{alerts} community alerts live</div></div>
            {alerts > 0 && <span className="text-amber-400 text-xs font-bold">{alerts}</span>}
          </button>
        </div>
      )}
    </div>
  );
}