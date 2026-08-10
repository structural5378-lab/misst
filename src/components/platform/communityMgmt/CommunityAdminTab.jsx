import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mist } from '@/api/mist';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PauseCircle, PlayCircle, Archive, Copy, Download, Trash2, Loader2, ShieldAlert } from "lucide-react";

function ActionCard({ title, description, children, tone }) {
  const toneCls = { danger: "border-destructive/30 bg-destructive/5", warn: "border-warning/30 bg-warning/5", neutral: "border-border bg-card" }[tone] || "border-border bg-card";
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}

export default function CommunityAdminTab({ community, audit, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const run = async (action) => {
    setBusy(true);
    try {
      await mist.functions.invoke("adminManageCommunity", { action, community_id: community.id });
      onChanged();
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Failed");
    }
    setBusy(false);
  };

  const backup = async () => {
    setBusy(true);
    try {
      const res = await mist.functions.invoke("adminManageCommunity", { action: "backup", community_id: community.id });
      const blob = new Blob([JSON.stringify(res.data?.snapshot || {}, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${community.slug}-backup.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Backup failed");
    }
    setBusy(false);
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await mist.functions.invoke("adminManageCommunity", { action: "delete", community_id: community.id });
      navigate("/platform/admin/communities");
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Delete failed");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-3">
        <ActionCard title="Suspend Community" description="Temporarily disable the community. Members cannot access it." tone="warn">
          {community.status === "suspended"
            ? <Button size="sm" variant="outline" disabled={busy} onClick={() => run("reactivate")}><PlayCircle className="w-4 h-4" />Reactivate</Button>
            : <Button size="sm" variant="outline" className="text-warning" disabled={busy} onClick={() => run("suspend")}><PauseCircle className="w-4 h-4" />Suspend</Button>}
        </ActionCard>
        <ActionCard title="Archive Community" description="Mark as archived (read-only, hidden from active lists)." tone="neutral">
          {community.status === "archived"
            ? <Button size="sm" variant="outline" disabled={busy} onClick={() => run("reactivate")}><PlayCircle className="w-4 h-4" />Unarchive</Button>
            : <Button size="sm" variant="outline" disabled={busy} onClick={() => run("archive")}><Archive className="w-4 h-4" />Archive</Button>}
        </ActionCard>
        <ActionCard title="Clone Community" description="Create a copy with a new slug. You become the owner of the clone." tone="neutral">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run("clone")}><Copy className="w-4 h-4" />Clone</Button>
        </ActionCard>
        <ActionCard title="Backup Community" description="Download a JSON snapshot of the community, settings, and members." tone="neutral">
          <Button size="sm" variant="outline" disabled={busy} onClick={backup}><Download className="w-4 h-4" />Backup</Button>
        </ActionCard>
      </div>

      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-2"><ShieldAlert className="w-4 h-4 text-destructive" /><h4 className="text-sm font-semibold text-destructive">Delete Community</h4></div>
        <p className="text-xs text-muted-foreground mb-3">Permanently deletes the community and all associated members, settings, and roles. This cannot be undone.</p>
        <Button size="sm" variant="destructive" disabled={busy} onClick={() => setDelOpen(true)}><Trash2 className="w-4 h-4" />Delete Community</Button>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Admin Actions</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(audit || []).length === 0 && <p className="text-xs text-muted-foreground">No actions logged.</p>}
          {(audit || []).slice(0, 12).map((l) => (
            <div key={l.id} className="flex items-center justify-between text-xs border-b border-border last:border-0 py-1.5">
              <span className="font-medium text-foreground">{l.action}</span>
              <span className="text-muted-foreground">{l.admin_email || "—"} · {l.created_date ? new Date(l.created_date).toLocaleString() : ""}</span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={delOpen} onOpenChange={(o) => { setDelOpen(o); if (!o) setConfirmName(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Community</DialogTitle>
            <DialogDescription>This is permanent and cannot be undone. All members, settings, roles, and content associations will be removed.</DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm text-muted-foreground">Type the community name <b className="text-foreground">{community.name}</b> to confirm:</p>
            <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={community.name} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy || confirmName !== community.name} onClick={doDelete}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}