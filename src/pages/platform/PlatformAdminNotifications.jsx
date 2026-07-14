import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Radio, Mail, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PlatformAdminNotifications() {
  const [pushForm, setPushForm] = useState({ title: "", message: "", type: "info" });
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", body: "" });
  const [emergencyForm, setEmergencyForm] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(null);
  const [success, setSuccess] = useState(null);

  const sendPush = async () => {
    setSending("push");
    try {
      await base44.entities.Alert.create({
        title: pushForm.title,
        message: pushForm.message,
        type: pushForm.type,
        community_id: "platform",
        community_name: "MIST Platform",
      });
      setSuccess("push");
      setPushForm({ title: "", message: "", type: "info" });
    } catch (e) { console.error(e); }
    finally { setSending(null); setTimeout(() => setSuccess(null), 3000); }
  };

  const sendEmail = async () => {
    setSending("email");
    try {
      await base44.integrations.Core.SendEmail({
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
      });
      setSuccess("email");
      setEmailForm({ to: "", subject: "", body: "" });
    } catch (e) { console.error(e); }
    finally { setSending(null); setTimeout(() => setSuccess(null), 3000); }
  };

  const sendEmergency = async () => {
    setSending("emergency");
    try {
      await base44.entities.Alert.create({
        title: emergencyForm.title,
        message: emergencyForm.message,
        type: "emergency",
        community_id: "platform",
        community_name: "MIST Platform",
      });
      await base44.functions.invoke("sendAlertNotification", {
        title: emergencyForm.title,
        message: emergencyForm.message,
        type: "emergency",
      });
      setSuccess("emergency");
      setEmergencyForm({ title: "", message: "" });
    } catch (e) { console.error(e); }
    finally { setSending(null); setTimeout(() => setSuccess(null), 3000); }
  };

  return (
    <AdminSection title="Notifications" description="Send push notifications, emails, and emergency broadcasts">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Push Notification */}
        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><Radio className="w-4 h-4 text-primary" />Push Notification</h3>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={pushForm.title} onChange={e => setPushForm(f => ({ ...f, title: e.target.value }))} placeholder="Alert title" className="h-9 bg-background mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Message</Label><Textarea value={pushForm.message} onChange={e => setPushForm(f => ({ ...f, message: e.target.value }))} placeholder="Alert message" className="bg-background mt-1 min-h-[80px]" /></div>
            <div><Label className="text-xs text-muted-foreground">Type</Label>
              <select value={pushForm.type} onChange={e => setPushForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                <option value="info">Info</option><option value="warning">Warning</option><option value="emergency">Emergency</option><option value="system">System</option>
              </select>
            </div>
            <Button onClick={sendPush} disabled={sending === "push" || !pushForm.title} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {sending === "push" ? <Loader2 className="w-4 h-4 animate-spin" /> : success === "push" ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4 mr-1" />}
              {sending === "push" ? "Sending..." : success === "push" ? "Sent!" : "Send Push"}
            </Button>
          </div>
        </div>

        {/* Email */}
        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><Mail className="w-4 h-4 text-accent" />Email Notification</h3>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">To</Label><Input value={emailForm.to} onChange={e => setEmailForm(f => ({ ...f, to: e.target.value }))} placeholder="user@example.com" className="h-9 bg-background mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Subject</Label><Input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject" className="h-9 bg-background mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Body</Label><Textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} placeholder="Email content" className="bg-background mt-1 min-h-[80px]" /></div>
            <Button onClick={sendEmail} disabled={sending === "email" || !emailForm.to} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {sending === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : success === "email" ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4 mr-1" />}
              {sending === "email" ? "Sending..." : success === "email" ? "Sent!" : "Send Email"}
            </Button>
          </div>
        </div>

        {/* Emergency Broadcast */}
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4" />Emergency Broadcast</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={emergencyForm.title} onChange={e => setEmergencyForm(f => ({ ...f, title: e.target.value }))} placeholder="EMERGENCY: ..." className="h-9 bg-background mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Message</Label><Input value={emergencyForm.message} onChange={e => setEmergencyForm(f => ({ ...f, message: e.target.value }))} placeholder="Emergency details" className="h-9 bg-background mt-1" /></div>
          </div>
          <Button onClick={sendEmergency} disabled={sending === "emergency" || !emergencyForm.title} className="w-full mt-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            {sending === "emergency" ? <Loader2 className="w-4 h-4 animate-spin" /> : success === "emergency" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
            {sending === "emergency" ? "Broadcasting..." : success === "emergency" ? "Broadcast Sent!" : "Broadcast Emergency Alert"}
          </Button>
        </div>
      </div>
    </AdminSection>
  );
}