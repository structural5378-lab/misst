import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCommunity } from "@/contexts/CommunityContext";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Shield, Search, Check, X, Ban, MessageSquare, UserCircle2, Loader2, Users, Clock, UserX, CheckCheck,
} from "lucide-react";

const STATUS_TABS = [
  { key: "pending", label: "Pending", icon: Clock, color: "text-amber-400" },
  { key: "active", label: "Approved", icon: Check, color: "text-emerald-400" },
  { key: "rejected", label: "Rejected", icon: X, color: "text-rose-400" },
  { key: "banned", label: "Banned", icon: UserX, color: "text-slate-400" },
];

const ROLE_LABEL = {
  community_owner: "Owner", community_admin: "Admin", moderator: "Moderator",
  trusted_member: "Trusted", member: "Member", guest: "Guest",
};

export default function CommunityJoinRequests() {
  const { community, settings, hasPermission } = useCommunity();
  const qc = useQueryClient();
  const { toast } = useToast();
  const canManage = hasPermission("community:manage_settings");
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["join-requests", community?.id],
    queryFn: async () => {
      return await base44.entities.CommunityMember.filter(
        { community_id: community.id },
        "-joined_date",
        500
      );
    },
    enabled: !!community?.id && canManage,
  });

  const counts = useMemo(() => {
    const c = { pending: 0, active: 0, rejected: 0, banned: 0 };
    members.forEach((m) => { if (c[m.status] != null) c[m.status]++; });
    return c;
  }, [members]);

  const filtered = useMemo(() => {
    const byStatus = members.filter((m) => m.status === tab);
    if (!query.trim()) return byStatus;
    const q = query.trim().toLowerCase();
    return byStatus.filter((m) =>
      [m.user_name, m.user_email, m.user_callsign, m.join_reason].some((f) => (f || "").toLowerCase().includes(q))
    );
  }, [members, tab, query]);

  if (!canManage) {
    return (
      <div className="p-4 text-center py-12">
        <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">You do not have admin access to this community.</p>
      </div>
    );
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (filtered.every((m) => selected.has(m.id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...filtered.map((m) => m.id)]));
    }
  };

  const act = async (action, userId) => {
    setBusyId(userId);
    try {
      const res = await base44.functions.invoke("manageCommunityMembership", {
        action, community_id: community.id, target_user_id: userId,
      });
      if (res.data?.success) {
        toast({ title: action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Banned" });
        await qc.invalidateQueries({ queryKey: ["join-requests", community.id] });
      } else {
        toast({ title: "Failed", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const bulkAct = async (action) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    let ok = 0;
    for (const id of ids) {
      try {
        const m = members.find((x) => x.id === id);
        const res = await base44.functions.invoke("manageCommunityMembership", {
          action, community_id: community.id, target_user_id: m.user_id,
        });
        if (res.data?.success) ok++;
      } catch {}
    }
    setBulkBusy(false);
    setSelected(new Set());
    await qc.invalidateQueries({ queryKey: ["join-requests", community.id] });
    toast({ title: `${ok} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "banned"}` });
  };

  const toggleAutoApprove = async () => {
    if (!settings?.id) {
      toast({ title: "Settings not loaded", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.CommunitySettings.update(settings.id, { auto_approve: !settings.auto_approve });
      await qc.invalidateQueries({ queryKey: ["community-settings", community.id] });
      toast({ title: `Auto-approve ${!settings.auto_approve ? "enabled" : "disabled"}` });
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Join Requests</h1>
          {counts.pending > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {counts.pending}
            </span>
          )}
        </div>
        <Link to={`/c/${community.slug}/admin`} className="text-xs text-muted-foreground hover:text-foreground">
          Back to Admin
        </Link>
      </div>

      {/* Auto-approve toggle */}
      <section className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Auto-approve requests</h2>
          <p className="text-xs text-muted-foreground mt-0.5">New join requests are approved instantly without admin review.</p>
        </div>
        <button
          onClick={toggleAutoApprove}
          className={`relative w-12 h-7 rounded-full transition-colors ${settings?.auto_approve ? "bg-primary" : "bg-secondary"}`}
        >
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${settings?.auto_approve ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </section>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {STATUS_TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelected(new Set()); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`px-1.5 rounded-full text-[10px] ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>
                {counts[t.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, callsign, or reason…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card/60 border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
      </div>

      {/* Bulk actions */}
      {tab === "pending" && selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 sticky top-0 z-10">
          <span className="text-xs font-semibold text-primary flex-1">{selected.size} selected</span>
          <button onClick={() => bulkAct("approve")} disabled={bulkBusy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25">
            {bulkBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />} Approve
          </button>
          <button onClick={() => bulkAct("reject")} disabled={bulkBusy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-semibold hover:bg-rose-500/25">
            <X className="w-3.5 h-3.5" /> Reject
          </button>
          <button onClick={() => bulkAct("ban")} disabled={bulkBusy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-slate-400 text-xs font-semibold hover:text-rose-400">
            <Ban className="w-3.5 h-3.5" /> Ban
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-card/40 border border-white/[0.06]">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {query ? "No matching requests." : tab === "pending" ? "No pending requests. You're all caught up!" : "Nothing here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tab === "pending" && filtered.length > 0 && (
            <button onClick={toggleAll} className="text-xs text-primary font-medium hover:underline px-1">
              {filtered.every((m) => selected.has(m.id)) ? "Deselect all" : "Select all"}
            </button>
          )}
          {filtered.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md">
              {tab === "pending" && (
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggleSelect(m.id)}
                  className="mt-1 w-4 h-4 rounded accent-primary"
                />
              )}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                {m.user_avatar ? (
                  <img src={m.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary">{(m.user_name || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">{m.user_name}</span>
                  {m.user_callsign && <span className="text-[10px] text-primary">{m.user_callsign}</span>}
                  <span className="text-[10px] text-muted-foreground">{formatDate(m.joined_date)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.user_email}</p>
                {m.join_reason && (
                  <p className="text-xs text-foreground/80 mt-1.5 italic line-clamp-2">"{m.join_reason}"</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Link to="/profile" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                    <UserCircle2 className="w-3.5 h-3.5" /> Profile
                  </Link>
                  <Link to="/messages" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </Link>
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {tab === "pending" && (
                  <>
                    <button onClick={() => act("approve", m.user_id)} disabled={busyId === m.user_id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 disabled:opacity-50">
                      {busyId === m.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button onClick={() => act("reject", m.user_id)} disabled={busyId === m.user_id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 text-[11px] font-semibold hover:bg-rose-500/25 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
                {(tab === "active" || tab === "rejected") && (
                  <button onClick={() => act("ban", m.user_id)} disabled={busyId === m.user_id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-slate-400 text-[11px] font-semibold hover:text-rose-400 disabled:opacity-50">
                    {busyId === m.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Ban
                  </button>
                )}
                {tab === "banned" && (
                  <button onClick={() => act("approve", m.user_id)} disabled={busyId === m.user_id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 disabled:opacity-50">
                    {busyId === m.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Unban
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}