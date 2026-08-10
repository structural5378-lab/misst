import { useEffect, useState, useRef } from "react";
import { mist } from '@/api/mist';
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { ScrollText, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const EXPECTED_PROJECT_ID = "misst-8bffd";
const EXPECTED_SENDER_ID = "135575197642";
const SW_PATH = "/sw.js";
const APP_NAME = "mist-fcm-diag";

function detectPlatform(ua) {
  const s = ua || "";
  const isIOS = /iPad|iPhone|iPod/.test(s) && !/Windows Phone/.test(s);
  const isStandalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
  if (isIOS && isStandalone) return "iOS Safari PWA";
  if (isIOS) return "iOS Safari (browser)";
  if (/Android/.test(s) && /Chrome/.test(s)) return "Android Chrome";
  if (/Android/.test(s) && /Firefox/.test(s)) return "Android Firefox";
  if (/CrOS/.test(s)) return "ChromeOS Chrome";
  if (/Edg/.test(s)) return "Desktop Edge";
  if (/Chrome/.test(s) && !/Edg|OPR|Brave/.test(s)) return "Desktop Chrome";
  if (/Firefox/.test(s)) return "Desktop Firefox";
  if (/Safari/.test(s) && !/Chrome/.test(s)) return "Desktop Safari";
  return "Other / unknown";
}

function redact(str) {
  if (!str || typeof str !== "string") return null;
  if (str.length <= 12) return str.slice(0, 2) + "…" + str.slice(-2);
  return str.slice(0, 4) + "…" + str.slice(-4);
}

export default function FcmDiagnostics() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(true);
  const doneRef = useRef(false);

  const push = (section, label, value, ok = true) => {
    setLog((prev) => [...prev, { section, label, value, ok }]);
    // eslint-disable-next-line no-console
    console.log(`[FCM-DIAG][${section}] ${label}:`, value);
  };

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    (async () => {
      setRunning(true);

      // ── 5. Browser Diagnostics ──
      const ua = navigator.userAgent;
      push("Browser", "navigator.userAgent", ua);
      push("Browser", "platform (detected)", detectPlatform(ua));
      push("Browser", "display-mode standalone", typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(display-mode: standalone)").matches : "n/a");
      push("Browser", "navigator.standalone", navigator.standalone ?? "n/a");
      push("Browser", "'serviceWorker' in navigator", "serviceWorker" in navigator);
      push("Browser", "'PushManager' in window", "PushManager" in window);
      push("Browser", "typeof Notification", typeof Notification);
      push("Browser", "Notification.permission", typeof Notification !== "undefined" ? Notification.permission : "undefined");

      // ── 1. Service Workers ──
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        push("SW", "registrations count", regs.length);
        regs.forEach((r, i) => {
          push("SW", `reg[${i}].scriptURL`, (r.active && r.active.scriptURL) || (r.installing && r.installing.scriptURL) || (r.waiting && r.waiting.scriptURL) || "?");
          push("SW", `reg[${i}].scope`, r.scope);
          push("SW", `reg[${i}].state`, r.active ? "active" : r.installing ? "installing" : r.waiting ? "waiting" : "redundant");
        });
      } catch (e) {
        push("SW", "getRegistrations() threw", String(e?.message || e), false);
      }
      const controller = navigator.serviceWorker.controller;
      push("SW", "controller.scriptURL", controller ? controller.scriptURL : "(none — page not yet controlled)");
      push("SW", "controller.state", controller ? controller.state : "(none)");

      // ── 2. Browser Cache / fresh bundle ──
      try {
        const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
        push("Cache", `${SW_PATH} registered`, !!reg);
        if (reg) {
          push("Cache", "active SW scriptURL", reg.active ? reg.active.scriptURL : "?");
          // Force update check
          await reg.update().catch(() => {});
          push("Cache", "update() called", true);
        }
      } catch (e) {
        push("Cache", "update check threw", String(e?.message || e), false);
      }

      // ── 3. Firebase Initialization config ──
      let cfg = null;
      try {
        const res = await mist.functions.invoke("getFcmPublicConfig", {});
        cfg = res?.data || null;
        push("Config", "getFcmPublicConfig response", JSON.stringify(cfg));
      } catch (e) {
        push("Config", "getFcmPublicConfig threw", String(e?.message || e), false);
      }

      if (!cfg) {
        push("Config", "abort", "no config — cannot initialize Firebase", false);
        setRunning(false);
        return;
      }

      push("Config", "projectId", cfg.projectId, cfg.projectId === EXPECTED_PROJECT_ID);
      push("Config", "messagingSenderId", cfg.messagingSenderId, String(cfg.messagingSenderId) === EXPECTED_SENDER_ID);
      push("Config", "sender matches CRM 135575197642", String(cfg.messagingSenderId) === EXPECTED_SENDER_ID, String(cfg.messagingSenderId) === EXPECTED_SENDER_ID);
      push("Config", "vapidPublicKey (first 10)", cfg.vapidPublicKey ? cfg.vapidPublicKey.slice(0, 10) + "…" : null, !!cfg.vapidPublicKey);
      push("Config", "apiKey", cfg.apiKey ? redact(cfg.apiKey) : "(absent)", !!cfg.apiKey);
      push("Config", "appId", cfg.appId || "(absent)", !!cfg.appId);
      push("Config", "authDomain", cfg.authDomain || "(absent)", !!cfg.authDomain);
      push("Config", "storageBucket", cfg.storageBucket || "(absent)", !!cfg.storageBucket);
      push("Config", "measurementId", cfg.measurementId || "(absent)", !!cfg.measurementId);

      // ── 4. Messaging Registration (raw, step by step) ──
      let app = null, messaging = null;
      try {
        const existing = getApps().find((a) => a.name === APP_NAME);
        app = existing || initializeApp({
          apiKey: cfg.apiKey,
          authDomain: cfg.authDomain,
          projectId: cfg.projectId || undefined,
          storageBucket: cfg.storageBucket,
          messagingSenderId: cfg.messagingSenderId,
          appId: cfg.appId,
          measurementId: cfg.measurementId,
        }, APP_NAME);
        push("Init", "initializeApp() name", app.name);
        push("Init", "initializeApp() options", JSON.stringify(app.options));
        push("Init", "app.options.apiKey", app.options.apiKey ? redact(app.options.apiKey) : "(absent)", !!app.options.apiKey);
        push("Init", "app.options.appId", app.options.appId || "(absent)", !!app.options.appId);
        push("Init", "app.options.authDomain", app.options.authDomain || "(absent)", !!app.options.authDomain);
        push("Init", "app.options.storageBucket", app.options.storageBucket || "(absent)", !!app.options.storageBucket);
        push("Init", "app.options.measurementId", app.options.measurementId || "(absent)", !!app.options.measurementId);
        push("Init", "app.options.projectId", app.options.projectId || "(absent)", app.options.projectId === EXPECTED_PROJECT_ID);
        push("Init", "app.options.messagingSenderId", app.options.messagingSenderId, String(app.options.messagingSenderId) === EXPECTED_SENDER_ID);
      } catch (e) {
        push("Init", "initializeApp() threw", String(e?.message || e), false);
      }

      try {
        messaging = getMessaging(app);
        push("Init", "getMessaging() ok", !!messaging);
      } catch (e) {
        push("Init", "getMessaging() threw", String(e?.message || e), false);
      }

      let swReg = null;
      try {
        swReg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
        await navigator.serviceWorker.ready;
        push("Init", "serviceWorkerRegistration.scriptURL", swReg.active ? swReg.active.scriptURL : SW_PATH);
        push("Init", "serviceWorkerRegistration.scope", swReg.scope);
      } catch (e) {
        push("Init", "SW register threw", String(e?.message || e), false);
      }

      // ── 6. Sender ID runtime match ──
      push("Match", "runtime senderId === CRM 135575197642", String(cfg.messagingSenderId) === EXPECTED_SENDER_ID, String(cfg.messagingSenderId) === EXPECTED_SENDER_ID);

      // ── getToken() ──
      let clientToken = null;
      if (messaging && swReg && cfg.vapidPublicKey) {
        try {
          push("Token", "calling getToken()", "…");
          const token = await getToken(messaging, { vapidKey: cfg.vapidPublicKey, serviceWorkerRegistration: swReg });
          if (token) {
            clientToken = token;
            push("Token", "resolved", true);
            push("Token", "typeof", typeof token);
            push("Token", "length", token.length);
            push("Token", "first 8 chars", token.slice(0, 8));
            push("Token", "last 8 chars", token.slice(-8));
          } else {
            push("Token", "getToken() returned", "(empty/null)", false);
          }
        } catch (e) {
          push("Token", "getToken() threw", String(e?.message || e), false);
        }
      } else {
        push("Token", "skipped", "messaging/SW/vapid missing", false);
      }

      // ── End-to-end: save exact token + send HTTP v1 test ──
      if (clientToken) {
        try {
          push("E2E", "sending exact token to debugFcmSend", `${clientToken.slice(0,8)}…${clientToken.slice(-8)} (len ${clientToken.length})`);
          const e2e = await mist.functions.invoke("debugFcmSend", { token: clientToken });
          const d = e2e?.data || null;
          if (!d) {
            push("E2E", "debugFcmSend response", JSON.stringify(e2e), false);
          } else {
            push("E2E", "httpStatus", d.httpStatus ?? "(none)", d.ok === true);
            push("E2E", "projectId", d.projectId || "(none)", d.projectId === EXPECTED_PROJECT_ID);
            push("E2E", "token length (client→server)", `${clientToken.length} → ${d.tokenLength}`, clientToken.length === d.tokenLength);
            push("E2E", "byte-for-byte (client token === tokenSent)", clientToken === d.tokenSent, clientToken === d.tokenSent);
            if (d.saveResult) {
              push("E2E", "DeviceToken stored byte-for-byte match", d.saveResult.byteForByteMatch, d.saveResult.byteForByteMatch);
              push("E2E", "DeviceToken recordId", d.saveResult.recordId || "(none)");
              push("E2E", "DeviceToken reused existing", d.saveResult.reused);
              push("E2E", "deactivated stale tokens", d.saveResult.deactivatedOthers ?? 0);
            }
            push("E2E", "FCM responseBody", JSON.stringify(d.responseBody), d.ok === true);
            if (d.ok === true) {
              push("E2E", "delivery", "✅ ACCEPTED by FCM — notification should arrive on this device", true);
            } else {
              push("E2E", "delivery", "❌ REJECTED by FCM — see responseBody error", false);
            }
          }
        } catch (e) {
          push("E2E", "debugFcmSend threw", String(e?.message || e), false);
        }
      }

      setRunning(false);
    })();
  }, []);

  const sections = ["Browser", "SW", "Cache", "Config", "Init", "Match", "Token", "E2E"];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">FCM Runtime Diagnostics</h1>
        {running && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Every value is also logged to the browser console as <code>[FCM-DIAG]</code>. Open DevTools → Console to copy the full output.
        Expected: projectId <code>{EXPECTED_PROJECT_ID}</code>, sender <code>{EXPECTED_SENDER_ID}</code>.
      </p>

      {sections.map((sec) => {
        const entries = log.filter((l) => l.section === sec);
        if (entries.length === 0) return null;
        return (
          <div key={sec} className="mb-4 rounded-xl border border-border/60 bg-card/60 overflow-hidden">
            <div className="px-4 py-2 bg-secondary/40 text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border/40">
              {sec}
            </div>
            <div className="divide-y divide-border/30">
              {entries.map((l, i) => (
                <div key={i} className="flex items-start gap-2 px-4 py-2 text-xs">
                  {l.ok === true ? <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                    : l.ok === false ? <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />}
                  <span className="text-muted-foreground min-w-0 shrink-0">{l.label}:</span>
                  <span className="font-mono break-all min-w-0 flex-1">{String(l.value)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {log.length === 0 && !running && (
        <p className="text-sm text-muted-foreground">No diagnostics captured.</p>
      )}
    </div>
  );
}