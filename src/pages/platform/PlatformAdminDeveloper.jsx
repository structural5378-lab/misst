import React, { useState } from "react";
import AdminSection from "@/components/platform/AdminSection";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Terminal, Play, Key, Cpu, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const FUNCTIONS = [
  "adminManageCommunity", "adminManageRepeater", "adminManageUser", "adminManageNet", "adminManageClub",
  "adminManageReport", "adminModerateContent", "adminEntityAdmin", "adminBackup", "adminListAuditLogs",
  "assignPlatformRole", "awardNetXp", "bootstrapPlatformOwner", "checkAllNotifications", "checkEventReminders",
  "checkFollowedThreads", "checkLocationShareRequests", "checkNewChatMessages", "checkNewThreads",
  "createCommunityV2", "fetchMyBBForums", "fetchRepeaterBook", "getAdminStats", "getAppEnvironment",
  "getCommunityBySlug", "getPlatformRoles", "getUserCommunities", "getWeatherData", "listCommunities",
  "manageCommunityMembership", "migrateMyBBAccounts", "migratePlatformRoles", "migrateRoles", "mybbAuth",
  "rbacManage", "registerMyBBUser", "resolvePermissions", "resolveRbac", "searchUsers", "sendAlertNotification",
  "sendEventNotification", "sendTestNotification", "ssoIssueToken", "syncUserStats",
];

const SECRETS = ["PUSHALERT_API_KEY", "WEATHER_API_KEY", "MYBB_BOT_PASSWORD", "MIST_BRIDGE_SECRET"];

export default function PlatformAdminDeveloper() {
  const { toast } = useToast();
  const [fn, setFn] = useState(FUNCTIONS[0]);
  const [payload, setPayload] = useState('{\n  "action": "list"\n}');
  const [response, setResponse] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setResponse(null);
    let parsed;
    try { parsed = JSON.parse(payload); } catch (e) { setResponse({ error: "Invalid JSON: " + e.message }); setRunning(false); return; }
    try {
      const res = await base44.functions.invoke(fn, parsed);
      setResponse(res.data ?? res);
      toast({ title: `${fn} executed` });
    } catch (e) {
      setResponse({ error: e.message });
      toast({ title: "Execution failed", description: e.message, variant: "destructive" });
    } finally { setRunning(false); }
  };

  return (
    <AdminSection title="Developer Tools" description="Live API tester, secrets inventory, and runtime introspection.">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* API tester */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3"><Terminal className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Function Tester</h3></div>
          <div className="space-y-3">
            <div><Label>Backend Function</Label>
              <Select value={fn} onValueChange={setFn}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">{FUNCTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Payload (JSON)</Label>
              <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={8} className="mt-1 font-mono text-xs" />
            </div>
            <Button onClick={run} disabled={running} size="sm"><Play className="w-4 h-4" /> {running ? "Running…" : "Run"}</Button>
            {response !== null && (
              <div>
                <Label className="flex items-center gap-1"><Send className="w-3 h-3" /> Response</Label>
                <pre className="mt-1 max-h-64 overflow-auto rounded-xl bg-secondary/40 border border-border p-3 text-[11px] font-mono text-foreground/90 whitespace-pre-wrap break-all">{JSON.stringify(response, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Secrets + runtime */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3"><Key className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Secrets ({SECRETS.length})</h3></div>
            <p className="text-xs text-muted-foreground mb-3">Secret values are never exposed. Only the registered keys are shown.</p>
            <div className="space-y-1.5">
              {SECRETS.map((s) => (
                <div key={s} className="flex items-center justify-between rounded-lg bg-secondary/30 border border-border px-3 py-2">
                  <span className="font-mono text-xs text-foreground">{s}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">SET</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3"><Cpu className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Runtime</h3></div>
            <div className="text-xs space-y-1.5 text-muted-foreground">
              <div className="flex justify-between"><span>Functions registered</span><span className="text-foreground font-semibold">{FUNCTIONS.length}</span></div>
              <div className="flex justify-between"><span>Runtime</span><span className="text-foreground font-semibold">Deno Deploy</span></div>
              <div className="flex justify-between"><span>SDK</span><span className="text-foreground font-semibold">@base44/sdk</span></div>
            </div>
          </div>
        </div>
      </div>
    </AdminSection>
  );
}