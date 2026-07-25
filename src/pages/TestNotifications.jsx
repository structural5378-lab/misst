import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Bell, BellOff } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import {
  isPushSupported,
  isSubscribed,
  getVapidKey,
  subscribeFcm,
  unsubscribeFcm,
  getCurrentToken,
} from "@/lib/fcmPush";

export default function TestNotifications() {
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const refresh = async () => {
    const vapid = await getVapidKey();
    const s = {
      supported: isPushSupported(),
      permission: typeof Notification !== "undefined" ? Notification.permission : "unknown",
      subscribed: await isSubscribed(),
      token: await getCurrentToken(),
      vapidConfigured: !!vapid,
      prompted: localStorage.getItem("fcm_prompted") === "1",
    };
    setStatus(s);
    return s;
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    setTimeout(() => clearInterval(interval), 12000);
  }, []);

  const handleSubscribe = async () => {
    const r = await subscribeFcm();
    if (!r?.ok) {
      alert(
        r?.reason === "no-vapid-key"
          ? "FCM Web Push VAPID key isn't configured. Ask an admin to set it."
          : r?.reason === "permission-denied"
          ? "Notification permission was blocked."
          : "Subscription failed."
      );
    }
    refresh();
  };

  const handleUnsubscribe = async () => {
    await unsubscribeFcm();
    refresh();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("sendTestNotification", {});
      setTestResult({ success: res.data?.ok, detail: res.data });
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
    setTesting(false);
  };

  if (!status)
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Notification Test" showBack />
        <div className="p-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );

  const Row = ({ label, value, good }) => (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {typeof value === "boolean" ? (
        value ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-amber-400" />
        )
      ) : (
        <span className={good ? "text-emerald-400" : "text-amber-400"}>{value}</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Notification Test" showBack />
      <div className="p-4 space-y-4">
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">FCM Push Status</h3>
          <div className="space-y-2 text-sm">
            <Row label="Push supported" value={status.supported} />
            <Row label="VAPID configured" value={status.vapidConfigured} />
            <Row label="Browser permission" value={status.permission} good={status.permission === "granted"} />
            <Row label="Subscribed" value={status.subscribed} />
            <div className="flex items-center justify-between">
              <span>FCM token</span>
              <span className="text-[11px] font-mono text-muted-foreground max-w-[60%] truncate">
                {status.token || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {status.subscribed ? (
            <Button onClick={handleUnsubscribe} className="w-full" variant="outline">
              <BellOff className="w-4 h-4 mr-2" /> Unsubscribe
            </Button>
          ) : (
            <Button onClick={handleSubscribe} className="w-full">
              <Bell className="w-4 h-4 mr-2" /> Subscribe to Notifications
            </Button>
          )}

          <Button onClick={handleTest} disabled={testing} className="w-full" variant="outline">
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Test...
              </>
            ) : (
              "Send Test Notification"
            )}
          </Button>
        </div>

        {testResult && (
          <div
            className={`rounded-xl p-4 ${
              testResult.success
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            <h4 className="font-semibold mb-2">{testResult.success ? "✅ Test Sent!" : "❌ Test Failed"}</h4>
            <pre className="text-xs text-muted-foreground overflow-auto">
              {JSON.stringify(testResult.detail || { error: testResult.error }, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h4 className="font-semibold text-amber-400 mb-2">⚠️ Important Notes</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Push uses Firebase Cloud Messaging (FCM) via the native Push API.</li>
            <li>The FCM Web Push VAPID key must be set (see Secrets & Configuration).</li>
            <li>Requires HTTPS / custom domain on mobile browsers.</li>
            <li>Subscribe on this device first, then send a test push.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}