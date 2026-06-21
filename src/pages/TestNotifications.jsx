import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function TestNotifications() {
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const checkStatus = () => {
    const pa = window.PushAlertCo || window.pa_push;
    const swReg = navigator.serviceWorker?.controller ? 'active' : (navigator.serviceWorker?.ready ? 'registered' : 'none');
    const s = {
      sdkLoaded: !!pa,
      hasTriggerOptIn: !!pa?.triggerOptIn,
      hasSubscribe: !!pa?.subscribe,
      isSubscribed: pa?.isSubscribed?.() || localStorage.getItem("pa_subscription_active") === "1",
      permission: typeof Notification !== "undefined" ? Notification.permission : "unknown",
      prompted: localStorage.getItem("pa_subscription_prompted") === "1",
      active: localStorage.getItem("pa_subscription_active") === "1",
      serviceWorker: swReg,
    };
    setStatus(s);
    console.log("Notification status:", s);
    return s;
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => checkStatus(), 2000);
    setTimeout(() => clearInterval(interval), 10000);
  }, []);

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

  const handleSubscribe = () => {
    console.log("=== PushAlert SDK Debug ===");
    console.log("PushAlertCo:", window.PushAlertCo);
    console.log("pa_push:", window.pa_push);
    console.log("All PushAlertCo keys:", window.PushAlertCo ? Object.keys(window.PushAlertCo) : "not found");
    console.log("All pa_push keys:", window.pa_push ? Object.keys(window.pa_push) : "not found");
    
    // Try all possible method names
    const methodsToTry = [
      () => window.PushAlertCo?.triggerOptIn?.(),
      () => window.PushAlertCo?.subscribe?.(),
      () => window.PushAlertCo?.optIn?.(),
      () => window.PushAlertCo?.push?.(),
      () => window.pa_push?.triggerOptIn?.(),
      () => window.pa_push?.subscribe?.(),
      () => window.pa_push?.optIn?.(),
      () => window.pa_push?.push?.(),
    ];
    
    for (const method of methodsToTry) {
      try {
        const result = method();
        if (result !== undefined) {
          console.log("Successfully called method:", method.toString());
          break;
        }
      } catch (e) {
        console.log("Method failed:", method.toString(), e);
      }
    }
    
    setTimeout(() => checkStatus(), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem("pa_subscription_prompted");
    localStorage.removeItem("pa_subscription_active");
    checkStatus();
    alert("Subscription data cleared. Refresh the page to try again.");
  };

  if (!status) return <div className="min-h-screen bg-background"><PageHeader title="Notification Test" showBack /><div className="p-4"><Loader2 className="w-6 h-6 animate-spin" /></div></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Notification Test" showBack />
      <div className="p-4 space-y-4">
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">PushAlert SDK Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>SDK Loaded:</span>
              {status.sdkLoaded ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
            </div>
            <div className="flex items-center justify-between">
              <span>triggerOptIn:</span>
              {status.hasTriggerOptIn ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
            </div>
            <div className="flex items-center justify-between">
              <span>subscribe:</span>
              {status.hasSubscribe ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
            </div>
            <div className="flex items-center justify-between">
              <span>Service Worker:</span>
              <span className={status.serviceWorker === 'active' ? "text-emerald-400" : status.serviceWorker === 'registered' ? "text-amber-400" : "text-red-400"}>{status.serviceWorker}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Is Subscribed:</span>
              {status.isSubscribed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="flex items-center justify-between">
              <span>Browser Permission:</span>
              <span className={status.permission === "granted" ? "text-emerald-400" : "text-amber-400"}>{status.permission}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleSubscribe} className="w-full" variant="primary">
            {status.isSubscribed ? "Already Subscribed" : "Subscribe to Notifications"}
          </Button>
          
          <Button onClick={handleTest} disabled={testing} className="w-full" variant="outline">
            {testing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending Test...</> : "Send Test Notification"}
          </Button>

          <Button onClick={handleClear} className="w-full" variant="destructive">
            Reset Subscription Data
          </Button>
        </div>

        {testResult && (
          <div className={`rounded-xl p-4 ${testResult.success ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
            <h4 className="font-semibold mb-2">{testResult.success ? "✅ Test Sent!" : "❌ Test Failed"}</h4>
            <pre className="text-xs text-muted-foreground overflow-auto">{JSON.stringify(testResult.detail, null, 2)}</pre>
          </div>
        )}

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h4 className="font-semibold text-amber-400 mb-2">⚠️ Important Notes</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Push notifications require custom domain (mist.insomniacsgmrs.com)</li>
            <li>Service worker registered at /sw.js</li>
            <li>Users must explicitly subscribe before receiving notifications</li>
            <li>Test on mobile browser for accurate results</li>
            <li>Check browser console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}