import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const TYPES = ["info", "warning", "emergency", "system"];
const EMPTY = { title: "", message: "", type: "system", link: "", community_id: "", community_name: "" };

export default function NewsFormDialog({ open, onOpenChange, communities = [], onSave }) {
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setErr(""); setF(EMPTY); } }, [open]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!f.title?.trim()) return setErr("Title is required.");
    setSaving(true);
    try {
      await onSave({ ...f, community_name: communities.find((c) => c.id === f.community_id)?.name || "" });
    } catch (e) { setErr(e?.message || "Failed to publish."); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader><DialogTitle>Publish Announcement</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2"><Label>Title *</Label><Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Platform maintenance window" /></div>
          <div><Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Audience</Label>
            <Select value={f.community_id} onValueChange={(v) => set("community_id", v)}>
              <SelectTrigger><SelectValue placeholder="All Platform" /></SelectTrigger>
              <SelectContent><SelectItem value={null}>All Platform</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Message</Label><Textarea value={f.message} onChange={(e) => set("message", e.target.value)} rows={4} /></div>
          <div className="col-span-2"><Label>Link (optional)</Label><Input value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" /></div>
        </div>
        {err && <p className="text-sm text-destructive -mt-1">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Publishing…" : "Publish"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}