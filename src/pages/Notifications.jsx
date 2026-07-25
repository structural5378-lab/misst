import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CheckCheck, Inbox, ArrowLeft, Trash2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NOTIF_FILTERS, NOTIF_TYPE_META } from "@/lib/notificationTypes";
import { timeAgo } from "@/lib/forumUtils";

export default function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const { list, unreadCount, loading, markRead, markAllRead, remove } = useNotifications();

  const filtered = useMemo(
    () => (filter === "all" ? list : list.filter((n) => n.type === filter)),
    [list, filter]
  );

  const open = (n) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-primary p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {NOTIF_FILTERS.map(({ id, label, icon: Icon }) => {
            const count =
              id === "all" ? unreadCount : list.filter((n) => n.type === id && !n.read).length;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  filter === id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground border border-border/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {count > 0 && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1 rounded-full">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">You're all caught up</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((n) => {
              const M = NOTIF_TYPE_META[n.type] || NOTIF_FILTERS[0];
              const Icon = M.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 fade-in ${!n.read ? "bg-primary/[0.04]" : ""}`}
                >
                  <button onClick={() => open(n)} className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => open(n)} className="text-left w-full">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {n.sender_name ? `from ${n.sender_name} · ` : ""}
                        {n.created_date ? timeAgo(n.created_date) : ""}
                      </p>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {!n.read && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        title="Mark read"
                        className="p-1.5 text-muted-foreground hover:text-primary"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => remove.mutate(n.id)}
                      title="Delete"
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}