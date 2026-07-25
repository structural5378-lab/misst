import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Trash2, Ban, Crown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_BADGE = {
  community_owner: "bg-amber-500/15 text-amber-400",
  community_admin: "bg-primary/15 text-primary",
  moderator: "bg-info/15 text-info",
  trusted_member: "bg-success/15 text-success",
  member: "bg-muted text-muted-foreground",
  guest: "bg-muted text-muted-foreground",
};
const STATUS_BADGE = {
  active: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  banned: "bg-destructive/15 text-destructive",
  left: "bg-muted text-muted-foreground",
  rejected: "bg-muted text-muted-foreground",
  suspended: "bg-warning/15 text-warning",
};

export default function CommunityMembersTab({ community, members, onChanged, moderatorsOnly }) {
  const [q, setQ] = useState("");
  const [transfer, setTransfer] = useState(null);
  const [transferPick, setTransferPick] = useState("");
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    let l = members;
    if (moderatorsOnly) {
      l = l.filter((m) => m.role === "moderator" || m.role === "community_admin" || m.role === "community_owner");
    }
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((m) =>
        String(m.user_name || "").toLowerCase().includes(s) ||
        String(m.user_email || "").toLowerCase().includes(s) ||
        String(m.user_callsign || "").toLowerCase().includes(s));
    }
    return l;
  }, [members, q, moderatorsOnly]);

  const act = async (action, m) => {
    setBusy(true);
    try {
      await base44.functions.invoke("adminManageCommunity", { action, community_id: community.id, target_user_id: m.user_id });
      onChanged();
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Failed");
    }
    setBusy(false);
  };

  const doTransfer = async () => {
    if (!transferPick) return;
    setBusy(true);
    try {
      await base44.functions.invoke("adminManageCommunity", { action: "transfer_ownership", community_id: community.id, target_user_id: transferPick });
      onChanged();
      setTransfer(null);
      setTransferPick("");
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Failed");
    }
    setBusy(false);
  };

  const eligible = members.filter((m) => m.status === "active");

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members…" className="pl-8 h-9" />
        </div>
        <span className="text-xs text-muted-foreground">{list.length} {moderatorsOnly ? "moderators" : "members"}</span>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Member</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Joined</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {m.user_avatar
                      ? <img src={m.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">{(m.user_name || "?").charAt(0)}</div>}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{m.user_name || "—"}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{m.user_email}{m.user_callsign ? ` · ${m.user_callsign}` : ""}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role] || ROLE_BADGE.member}`}>{m.role || "member"}</span></td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[m.status] || STATUS_BADGE.active}`}>{m.status || "active"}</span></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{m.joined_date ? new Date(m.joined_date).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {(m.role === "moderator" || m.role === "community_admin")
                      ? <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={busy} onClick={() => act("demote_moderator", m)}><ArrowDownCircle className="w-3.5 h-3.5" />Demote</Button>
                      : <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={busy} onClick={() => act("promote_moderator", m)}><ArrowUpCircle className="w-3.5 h-3.5" />Promote</Button>}
                    {m.status === "banned"
                      ? <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-success" disabled={busy} onClick={() => act("unban_member", m)}>Unban</Button>
                      : <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" disabled={busy} onClick={() => act("ban_member", m)}><Ban className="w-3.5 h-3.5" />Ban</Button>}
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={busy} onClick={() => act("remove_member", m)}><Trash2 className="w-3.5 h-3.5" />Remove</Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-amber-400" disabled={busy} onClick={() => { setTransfer(m); setTransferPick(m.user_id); }}><Crown className="w-3.5 h-3.5" />Owner</Button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-sm">No members found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!transfer} onOpenChange={(o) => !o && setTransfer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" />Transfer Ownership</DialogTitle>
            <DialogDescription>Transfer ownership of <b>{community.name}</b> to another member. The current owner will be demoted to admin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={transferPick} onValueChange={setTransferPick}>
              <SelectTrigger><SelectValue placeholder="Select new owner" /></SelectTrigger>
              <SelectContent>
                {eligible.map((m) => <SelectItem key={m.id} value={m.user_id}>{m.user_name || m.user_email}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This action is irreversible. The new owner will gain full control of the community.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransfer(null)}>Cancel</Button>
            <Button onClick={doTransfer} disabled={busy || !transferPick} className="bg-amber-500 hover:bg-amber-600 text-white">Transfer Ownership</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}