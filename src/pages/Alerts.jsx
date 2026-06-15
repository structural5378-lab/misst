import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Info, AlertTriangle, Radio, Settings, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { format } from "date-fns";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  emergency: Radio,
  system: Settings,
};

const typeColors = {
  info: "bg-primary/10 text-primary",
  warning: "bg-amber-500/10 text-amber-400",
  emergency: "bg-red-500/10 text-red-400",
  system: "bg-muted text-muted-foreground",
};

export default function Alerts() {
  const { mybbUser } = useMyBBAuth();
  const queryClient = useQueryClient();
  const canEdit = mybbUser?.canEdit;
  const [deletingIds, setDeletingIds] = useState(new Set());

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const all = await base44.entities.Alert.list("-created_date", 50);
      return all.filter(a => !a.title?.startsWith("__"));
    },
    initialData: [],
  });

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    await Promise.all(unread.map(a => base44.entities.Alert.update(a.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    queryClient.invalidateQueries({ queryKey: ["unread-alerts-badge"] });
  };

  const handleDelete = async (id) => {
    if (deletingIds.has(id)) return;
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await base44.entities.Alert.delete(id);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    } catch {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  return (
    <div>
      <PageHeader
        title="Alerts"
        rightAction={
          alerts.some(a => !a.is_read) ? (
            <button onClick={handleMarkAllRead} className="text-xs text-violet-400 hover:text-violet-300 font-medium pr-1">
              Mark all read
            </button>
          ) : null
        }
      />
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No Alerts</h3>
            <p className="text-xs text-muted-foreground mt-1">You're all caught up</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {alerts.map((alert) => {
              const Icon = typeIcons[alert.type] || Info;
              const colorClass = typeColors[alert.type] || typeColors.info;
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50 ${!alert.is_read ? "border-l-2 border-l-primary" : ""}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                    {alert.message && (
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.created_date && format(new Date(alert.created_date), "MMM d 'at' h:mm a")}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(alert.id)}
                      disabled={deletingIds.has(alert.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}