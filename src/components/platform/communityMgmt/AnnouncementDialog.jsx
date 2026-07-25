import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone } from "lucide-react";

export default function AnnouncementDialog({ open, onOpenChange, community }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  const send = async () => {
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("adminManageCommunity", { action: "send_announcement", community_id: community.id, title, message });
      setSent(res.data?.recipients ?? 0);
      setTitle("");
      setMessage("");
      setTimeout(() => { setSent(null); onOpenChange(false); }, 1500);
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Failed");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" />Send Announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Subject</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement subject" /></div>
          <div><Label>Message</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Message to all active members…" /></div>
          <p className="text-xs text-muted-foreground">Creates a community alert and emails all active members.</p>
          {sent !== null && <p className="text-xs text-success">Sent to {sent} member(s).</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={busy || !title.trim() || !message.trim()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}