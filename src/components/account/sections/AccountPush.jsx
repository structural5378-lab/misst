import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { SectionCard } from "../ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  isPushSupported, subscribeFcm, unsubscribeFcm, getCurrentToken, ensureSubscribed,
  refreshSubscription, listMyDevices, removeDeviceById, getLastRefresh, getVapidKey,
} from "@/lib/fcmPush";
import { Bell, Smartphone, Monitor, Tablet, Trash2, RefreshCw, Send, Loader2 } from "lucide-react";

function StatusRow({ label, value, tone = "default" }) {
  const toneClass =
    tone === "ok" ? "text-success"
    : tone === "warn" ? "text-warning"
    : tone === "bad" ? "text-destructive"
    : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${toneClass}`}>{value}</span>
    </div>
  );
}

function deviceIcon(ua) {
  const s = (ua || "").toLowerCase();
  if (/ipad|tablet/.test(s)) return Tablet;
  if (/mobile|android|iphone/.test(s)) return Smartphone;
  return Monitor;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function AccountPush() {
  const { mistUser } = useMistUser();
  const { toast } = useToast();
  const [supported] = useState(isPushSupported());
  const [vapidReady, setVapidReady] = useState(null);
  const [permission, setPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [thisToken, setThisToken] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(getLastRefresh());
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setVapidReady(!!(await getVapidKey()));
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
      // Mint/register a real FCM token via the SDK before reporting status.
      if (isPushSupported() && typeof Notification !== "undefined" && Notification.permission === "granted") {
        await ensureSubscribed();
      }
      setThisToken(await getCurrentToken());
      setLastRefresh(getLastRefresh());
      setDevices(await listMyDevices());
    } catch (e) {
      console.warn("AccountPush load", e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEnable = async () => {
    setBusy(true);
    const r = await subscribeFcm();
    setBusy(false);
    if (r?.ok) {
      await load();
      try { await base44.functions.invoke("sendTestNotification", {}); } catch { /* ignore */ }
      toast({ title: "Push enabled", description: "A test notification is on its way." });
    } else if (r?.reason === "no-vapid-key") {
      toast({ title: "Not configured", description: "The FCM Web Push VAPID key isn't set.", variant: "destructive" });
    } else if (r?.reason === "permission-denied") {
      toast({ title: "Permission blocked", description: "Enable notifications in your browser site settings.", variant: "destructive" });
    } else {
      toast({ title: "Couldn't enable push", description: r?.reason || "Try again later.", variant: "destructive" });
    }
  };

  const handleReRegister = async () => {
    setBusy(true);
    const r = await refreshSubscription();
    setBusy(false);
    if (r?.ok) { await load(); toast({ title: "Device re-registered" }); }
    else toast({ title: "Re-register failed", description: r?.reason || "", variant: "destructive" });
  };

  const handleRemoveThis = async () => {
    setBusy(true);
    await unsubscribeFcm();
    setBusy(false);
    await load();
    toast({ title: "This device removed" });
  };

  const handleRemoveOther = async (id) => {
    try { await removeDeviceById(id); await load(); toast({ title: "Device removed" }); }
    catch (e) { toast({ title: "Failed", description: String(e?.message || e), variant: "destructive" }); }
  };

  const handleSendTest = async () => {
    try { await base44.functions.invoke("sendTestNotification", {}); toast({ title: "Test notification sent" }); }
    catch (e) { toast({ title: "Failed", description: String(e?.message || e), variant: "destructive" }); }
  };

  if (!supported) {
    return (
      <SectionCard title="Push Notifications" desc="Firebase Cloud Messaging (FCM)" icon={Bell}>
        <p className="text-sm text-muted-foreground">Push notifications aren't supported in this browser.</p>
      </SectionCard>
    );
  }

  const enabled = permission === "granted" && !!thisToken;
  const statusLabel = enabled ? "Enabled" : vapidReady === false ? "Not configured" : "Disabled";

  return (
    <div className="space-y-4">
      <SectionCard title="Push Notifications" desc="Firebase Cloud Messaging (FCM) — alerts even when the app is closed." icon={Bell}>
        <StatusRow label="Status" value={statusLabel} tone={enabled ? "ok" : vapidReady === false ? "warn" : "default"} />
        <StatusRow label="Permission" value={permission} tone={permission === "granted" ? "ok" : permission === "denied" ? "bad" : "default"} />
        <StatusRow label="This device registered" value={thisToken ? "Yes" : "No"} tone={thisToken ? "ok" : "default"} />
        <StatusRow label="Last token refresh" value={fmtDate(lastRefresh)} />
        <StatusRow label="Devices registered" value={String(devices.length)} />

        <div className="flex flex-wrap gap-2 pt-4">
          {!enabled && (
            <Button onClick={handleEnable} disabled={busy} size="sm">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Enable
            </Button>
          )}
          {enabled && (
            <Button onClick={handleReRegister} disabled={busy} size="sm" variant="outline">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Re-register this device
            </Button>
          )}
          {enabled && (
            <Button onClick={handleRemoveThis} disabled={busy} size="sm" variant="outline">
              <Trash2 className="w-4 h-4" /> Remove this device
            </Button>
          )}
          {enabled && (
            <Button onClick={handleSendTest} disabled={busy} size="sm" variant="outline">
              <Send className="w-4 h-4" /> Send test
            </Button>
          )}
        </div>

        {vapidReady === false && (
          <p className="text-xs text-warning mt-3">
            The FCM Web Push VAPID key isn't configured on the server. Ask an admin to set FCM_WEB_VAPID_KEY.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Your Devices" desc="Each device that has opted in to push." icon={Monitor}>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices registered yet.</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => {
              const Icon = deviceIcon(d.user_agent);
              const isCurrent = d.token === thisToken;
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isCurrent ? "This device" : (d.platform || "web")}
                      {isCurrent && <span className="ml-2 text-[10px] text-success font-semibold">CURRENT</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{d.user_agent || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">Last seen: {fmtDate(d.last_seen)}</p>
                  </div>
                  <Button
                    onClick={() => handleRemoveOther(d.id)}
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}