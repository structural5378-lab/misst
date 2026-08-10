import React, { useState } from "react";

import { mist } from '@/api/mist';
import { useQuery } from "@tanstack/react-query";
import { Send, Copy, Eye, EyeOff, Loader2, CheckCircle, XCircle, Radio } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import NotificationAdminTabs from "@/components/platform/NotificationAdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { NOTIF_FILTERS } from "@/lib/notificationTypes";

const TARGETS = [
  { id: "self", label: "Yourself" },
  { id: "user", label: "Selected User" },
  { id: "community", label: "Entire Community" },
  { id: "all", label: "All Users (Broadcast)" },
];

export default function PlatformAdminNotificationTest() {
  const { toast } = useToast();
  const [form, setForm] = useState({ target: "self", target_user_id: "", target_community_id: "", type: "system", title: "", message: "", link: "/notifications", priority: "normal", sound: true, icon: "" });
  const [showPreview, setShowPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const { data: users = [] } = useQuery({ queryKey: ["admin-users-test"], queryFn: () => mist.entities.User.list("-created_date", 200) });
  const { data: communities = [] } = useQuery({ queryKey: ["admin-communities-test"], queryFn: () => mist.entities.Community.list("-created_date", 200) });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const meta = NOTIF_FILTERS.find((f) => f.id === form.type) || {};
  const Icon = meta.icon || Radio;

  const send = async (broadcast = false) => {
    if (!form.title) return toast({ title: "Title required", variant: "destructive" });
    setSending(true);
    setResult(null);
    try {
      const res = await mist.functions.invoke("adminNotifications", { action: "send", ...form });
      setResult(res?.data || { error: "No response" });
      toast({ title: res?.data?.ok ? "Sent" : "Failed", description: `Created ${res?.data?.created ?? 0} notification(s)`, duration: 2500 });
    } catch (e) {
      setResult({ error: String(e?.message || e) });
      toast({ title: "Send error", description: String(e?.message || e), variant: "destructive" });
    } finally { setSending(false); }
  };

  const duplicate = () => {
    const last = sessionStorage.getItem("last_notif_test");
    if (!last) return toast({ title: "No previous test" });
    try { setForm(JSON.parse(last)); toast({ title: "Loaded previous test" }); } catch { toast({ title: "Could not load", variant: "destructive" }); }
  };
  const saveLast = () => sessionStorage.setItem("last_notif_test", JSON.stringify(form));

  return (
    <AdminSection title="Test Console" description="Send test notifications, broadcasts, and previews">
      <NotificationAdminTabs />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Send To</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {TARGETS.map((t) => (
                <button key={t.id} onClick={() => set("target", t.id)} className={`px-3 py-2 rounded-lg text-xs font-medium border ${form.target === t.id ? "bg-primary/15 text-primary border-primary/30" : "bg-background border-border text-muted-foreground"}`}>{t.label}</button>
              ))}
            </div>
          </div>
          {form.target === "user" && (
            <div>
              <Label className="text-xs text-muted-foreground">User</Label>
              <select value={form.target_user_id} onChange={(e) => set("target_user_id", e.target.value)} className="w-full mt-1 h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                <option value="">Select user…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </div>
          )}
          {form.target === "community" && (
            <div>
              <Label className="text-xs text-muted-foreground">Community</Label>
              <select value={form.target_community_id} onChange={(e) => set("target_community_id", e.target.value)} className="w-full mt-1 h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                <option value="">Select community…</option>
                {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Category</Label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full mt-1 h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                {NOTIF_FILTERS.filter((f) => f.id !== "all").map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div><Label className="text-xs text-muted-foreground">Priority</Label>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="w-full mt-1 h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                <option value="normal">Normal</option><option value="high">High</option><option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Notification title" className="h-9 bg-background mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">Message</Label><Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Notification body" className="bg-background mt-1 min-h-[80px]" /></div>
          <div><Label className="text-xs text-muted-foreground">Deep Link</Label><Input value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/notifications" className="h-9 bg-background mt-1" /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={form.sound} onChange={(e) => set("sound", e.target.checked)} className="accent-primary" /> Sound</label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} className="accent-primary" /> Show Preview</label>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => { saveLast(); send(false); }} disabled={sending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} {sending ? "Sending…" : "Send Test"}
            </Button>
            <Button onClick={() => { saveLast(); send(true); }} disabled={sending} variant="destructive"><Radio className="w-4 h-4 mr-1" /> Broadcast</Button>
            <Button onClick={duplicate} variant="outline"><Copy className="w-4 h-4 mr-1" /> Duplicate Previous</Button>
            <Button onClick={() => setShowPreview((s) => !s)} variant="ghost">{showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />} Preview</Button>
          </div>
        </div>

        {/* Preview + Results */}
        <div className="space-y-4">
          {showPreview && (
            <div className="rounded-xl bg-card border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Preview</h3>
              <div className="rounded-xl border border-border bg-background p-4 max-w-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color || "#8B5CF6"}22`, color: meta.color || "#8B5CF6" }}><Icon className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{form.title || "Notification title"}</span>
                      <span className="text-[10px] text-muted-foreground">now</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{form.message || "Notification body"}</p>
                    {form.link && <p className="text-[10px] text-primary mt-1.5 truncate">→ {form.link}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{meta.label || form.type}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-card border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Results</h3>
            {!result ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Send a test to see delivery results.</div>
            ) : result.error ? (
              <div className="flex items-center gap-2 text-sm text-destructive"><XCircle className="w-4 h-4" /> {result.error}</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="flex items-center justify-center w-5 h-5 rounded-full bg-success/15 text-success">{result.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}</span> Delivery {result.ok ? "Success" : "Failed"}</div>
                <Row label="Created">{result.created ?? 0} notification(s)</Row>
                <Row label="Recipients">{result.recipients ?? 0}</Row>
                <Row label="Status">{result.delivery?.status || "—"}</Row>
                <Row label="FCM Message ID"><code className="text-xs">{result.delivery?.fcm_message_id || "—"}</code></Row>
                <Row label="Token Preview"><code className="text-xs">{result.delivery?.token_preview || "—"}</code></Row>
                <Row label="Last Error">{result.delivery?.last_error || "—"}</Row>
                <Row label="Timestamp">{new Date().toLocaleString()}</Row>
                <Row label="Platform Results">{(() => { try { return JSON.parse(result.delivery?.platforms || "[]").join(", ") || "web"; } catch { return "web"; } })()}</Row>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}

function Row({ label, children }) {
  return <div className="flex justify-between gap-3 py-0.5"><span className="text-muted-foreground">{label}</span><span className="text-right">{children}</span></div>;
}