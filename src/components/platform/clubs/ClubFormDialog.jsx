import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const EMPTY = { name: "", description: "", category: "", community_id: "", community_name: "", owner_name: "", status: "active", is_public: true, member_count: 0, logo_url: "" };

export default function ClubFormDialog({ open, onOpenChange, club, communities = [], onSave }) {
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setErr(""); setF(club ? { ...EMPTY, ...club } : EMPTY); } }, [open, club]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name?.trim()) return setErr("Club name is required.");
    setSaving(true);
    try {
      await onSave({ ...f, community_name: communities.find((c) => c.id === f.community_id)?.name || f.community_name || "", member_count: Number(f.member_count) || 0 });
    } catch (e) { setErr(e?.message || "Save failed."); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader><DialogTitle>{club ? "Edit Club" : "Create Club"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2"><Label>Name *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} /></div>
          <div><Label>Category</Label><Input value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="GMRS / Ham / Social" /></div>
          <div><Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["active", "pending", "suspended"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Community</Label>
            <Select value={f.community_id} onValueChange={(v) => set("community_id", v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent><SelectItem value={null}>None</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Owner Name</Label><Input value={f.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></div>
          <div><Label>Logo URL</Label><Input value={f.logo_url} onChange={(e) => set("logo_url", e.target.value)} /></div>
          <div className="flex items-center gap-2 pt-7"><Switch checked={f.is_public} onCheckedChange={(v) => set("is_public", v)} /><Label className="text-xs">Public club</Label></div>
        </div>
        {err && <p className="text-sm text-destructive -mt-1">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : club ? "Save Changes" : "Create Club"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}