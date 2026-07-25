import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const RARITIES = ["common", "rare", "epic", "legendary", "mythic", "founder", "seasonal", "club_exclusive", "national_event", "developer"];
const EMPTY = { user_id: "", user_name: "", achievement_id: "", achievement_name: "", rarity: "common", collection: "" };

export default function AwardBadgeDialog({ open, onOpenChange, users = [], onSave }) {
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setErr(""); setF(EMPTY); } }, [open]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.user_id) return setErr("Select a user.");
    if (!f.achievement_id.trim()) return setErr("Achievement ID is required.");
    setSaving(true);
    try {
      await onSave({ ...f, unlocked_date: new Date().toISOString() });
    } catch (e) { setErr(e?.message || "Failed to award."); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>Award Badge</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div><Label>User *</Label>
            <Select value={f.user_id} onValueChange={(v) => { const u = users.find((x) => x.id === v); set("user_id", v); set("user_name", u?.full_name || u?.email || ""); }}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Achievement ID *</Label><Input value={f.achievement_id} onChange={(e) => set("achievement_id", e.target.value)} placeholder="first_checkin" /></div>
          <div><Label>Achievement Name</Label><Input value={f.achievement_name} onChange={(e) => set("achievement_name", e.target.value)} placeholder="First Check-In" /></div>
          <div><Label>Rarity</Label>
            <Select value={f.rarity} onValueChange={(v) => set("rarity", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RARITIES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Collection</Label><Input value={f.collection} onChange={(e) => set("collection", e.target.value)} placeholder="operations" /></div>
        </div>
        {err && <p className="text-sm text-destructive -mt-1">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Awarding…" : "Award Badge"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}