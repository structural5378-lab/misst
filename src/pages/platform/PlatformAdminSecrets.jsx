import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ExternalLink,
  Loader2,
  FlaskConical,
  Send,
  Cloud,
  Radio,
  Zap,
} from "lucide-react";

const INSTRUCTIONS = {
  WEATHER_API_KEY: {
    title: "Weather API Key",
    steps: [
      "Create a free account at openweathermap.org/api.",
      "Open your account → API keys and copy the key.",
      "Ask Base44 to update the WEATHER_API_KEY secret and paste it in the secure form.",
    ],
    docs: "https://openweathermap.org/api",
  },
  MYBB_BOT_PASSWORD: {
    title: "MyBB Bridge Bot Password",
    steps: [
      "On the MyBB forum, create or use the dedicated MIST bot account.",
      "Set its password in the forum admin.",
      "Ask Base44 to update the MYBB_BOT_PASSWORD secret and paste the password in the secure form.",
    ],
    docs: "",
  },
  MIST_BRIDGE_SECRET: {
    title: "MIST Bridge Shared Secret",
    steps: [
      "Generate a strong shared secret and install it in the mist-api.php bridge.",
      "Ask Base44 to update the MIST_BRIDGE_SECRET secret and paste the same value in the secure form.",
      "Both sides must match or bridge auth will fail.",
    ],
    docs: "",
  },
  FCM_SERVICE_ACCOUNT_JSON: {
    title: "Firebase Service Account (FCM)",
    steps: [
      "Open Firebase Console → Project settings → Service accounts.",
      'Click "Generate new private key" and download the JSON file.',
      "Ask Base44 to replace FCM_SERVICE_ACCOUNT_JSON and paste the entire file contents into the secure form.",
      "This is used server-side to mint FCM OAuth2 tokens for push delivery.",
    ],
    docs: "https://firebase.google.com/docs/cloud-messaging/send-message#authorize-send-requests",
  },
  FCM_WEB_VAPID_KEY: {
    title: "Firebase Web Push VAPID Key",
    steps: [
      "Open Firebase Console → Project settings → Cloud Messaging → Web configuration.",
      "Generate a Web Push certificate and copy the public key.",
      "Ask Base44 to update FCM_WEB_VAPID_KEY and paste the public key in the secure form.",
      "The public key is safe to expose to the browser; it is used to subscribe devices via the Push API.",
    ],
    docs: "https://firebase.google.com/docs/cloud-messaging/js/client#configure_web_credentials",
  },
};

function statusBadge(item) {
  if (!item.configured) return { icon: AlertTriangle, text: "Missing", className: "text-amber-400" };
  if (!item.valid) return { icon: AlertTriangle, text: "Invalid format", className: "text-rose-400" };
  return { icon: CheckCircle2, text: "Configured", className: "text-emerald-400" };
}

export default function PlatformAdminSecrets() {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [replaceKey, setReplaceKey] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-secret-status"],
    queryFn: async () => (await base44.functions.invoke("adminSecretStatus", { action: "status" }))?.data,
    staleTime: 0,
  });

  const items = data?.items || [];
  const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
  const ready = (key) => byKey[key]?.configured;
  const fcmValid = byKey["FCM_SERVICE_ACCOUNT_JSON"]?.valid;
  const vapidReady = ready("FCM_WEB_VAPID_KEY");

  const forumReady = ready("MYBB_BOT_PASSWORD") && ready("MIST_BRIDGE_SECRET");
  const forumStatus = forumReady
    ? "Ready"
    : ready("MIST_BRIDGE_SECRET")
    ? "Missing Bot Password"
    : ready("MYBB_BOT_PASSWORD")
    ? "Missing Bridge Secret"
    : "Missing Credentials";

  const fcmStatus = !fcmValid
    ? "Missing Service Account"
    : !vapidReady
    ? "Missing VAPID Key"
    : "Ready";

  const readiness = [
    { label: "Push (FCM)", icon: Zap, status: fcmStatus },
    { label: "Weather", icon: Cloud, status: ready("WEATHER_API_KEY") ? "Ready" : "Missing API Key" },
    { label: "Forum Bridge", icon: Radio, status: forumStatus },
  ];

  async function runTests() {
    setTesting(true);
    setTestResults(null);
    try {
      const res = await base44.functions.invoke("adminSecretStatus", { action: "test" });
      setTestResults(res?.data?.services || null);
    } catch (e) {
      setTestResults({ error: e.message });
    } finally {
      setTesting(false);
    }
  }

  const inst = INSTRUCTIONS[replaceKey];

  return (
    <AdminSection
      title="Secrets & Configuration"
      description="Detect, validate, and test platform integrations. Push notifications use Firebase Cloud Messaging (FCM). Secret values are never exposed."
      action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Validate
          </Button>
          <Button size="sm" onClick={runTests} disabled={testing}>
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            Test Configuration
          </Button>
        </div>
      }
    >
      {/* Readiness summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {readiness.map((r) => {
          const ok = r.status === "Ready";
          const Icon = r.icon;
          return (
            <div key={r.label} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                <Icon className="w-3.5 h-3.5" /> {r.label}
              </div>
              <p className={`text-base font-bold mt-1 ${ok ? "text-emerald-400" : "text-amber-400"}`}>{r.status}</p>
            </div>
          );
        })}
      </div>

      {/* Secret list */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Checking secrets…
        </div>
      ) : isError ? (
        <div className="text-center py-8 rounded-2xl border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Couldn't read secret status.</p>
          <p className="text-[11px] text-destructive/70 font-mono px-4 break-all mb-3">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const b = statusBadge(item);
            const StatusIcon = b.icon;
            return (
              <div key={item.key} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                <div className="rounded-xl bg-secondary/40 p-2 mt-0.5">
                  <KeyRound className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${b.className}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {b.text}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{item.key}</p>
                  {item.key === "FCM_SERVICE_ACCOUNT_JSON" && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Service account JSON (project_id, private_key, client_email). Used server-side to mint FCM OAuth2
                      tokens.{" "}
                      <a
                        href={item.docs}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary inline-flex items-center gap-0.5 hover:underline"
                      >
                        Firebase docs <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  )}
                  {item.key === "FCM_WEB_VAPID_KEY" && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Public VAPID key from Firebase Console → Cloud Messaging → Web configuration. Used by the browser
                      to subscribe to push. Safe to expose to the client.
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.valid ? "bg-emerald-400" : item.configured ? "bg-rose-400" : "bg-amber-400"
                    }`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setReplaceKey(item.key)}>
                    <RefreshCw className="w-3.5 h-3.5" /> Replace
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test results */}
      {testResults && (
        <div className="mt-5 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Integration Test Results</h3>
          </div>
          {testResults.error ? (
            <p className="text-sm text-destructive">{testResults.error}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(testResults).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-secondary/20 p-3">
                  <div className="flex items-center gap-2">
                    {v.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-semibold text-sm capitalize">{k}</span>
                    {v.latencyMs != null && (
                      <span className="text-[10px] text-muted-foreground ml-auto">{v.latencyMs}ms</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{v.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Replace dialog */}
      <Dialog open={!!replaceKey} onOpenChange={(o) => !o && setReplaceKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{inst?.title || "Replace Secret"}</DialogTitle>
            <DialogDescription>
              Secret values live in Base44's encrypted secrets store and are never exposed to the app or returned to the
              client. To replace a value, request the update in the Base44 chat and paste the new value into the secure
              form that appears. Existing values are never overwritten unless you explicitly choose to replace them.
            </DialogDescription>
          </DialogHeader>
          {inst?.steps && (
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
              {inst.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {inst?.docs && (
            <a
              href={inst.docs}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary inline-flex items-center gap-1 hover:underline mt-1"
            >
              Open documentation <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceKey(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSection>
  );
}