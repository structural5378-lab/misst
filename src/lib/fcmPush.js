import { base44 } from "@/api/base44Client";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, deleteToken, onMessage } from "firebase/messaging";

// FCM web push client built on the official Firebase Messaging JS SDK.
// Registration tokens are obtained EXCLUSIVELY via getToken(messaging, { vapidKey }).
// Never derived from PushSubscription endpoints. One DeviceToken record per device
// supports multiple devices per user. Token rotation is detected by comparing the
// freshly-minted token against the stored one (onTokenRefresh was removed in v11).

const SW_PATH = "/sw.js";
const PROMPTED_KEY = "fcm_prompted";
const TOKEN_KEY = "fcm_token";
const LAST_REFRESH_KEY = "fcm_last_refresh";

let _config = null;
let _app = null;
let _messaging = null;

export async function getVapidKey() {
  const cfg = await getFcmConfig();
  return cfg?.vapidPublicKey || null;
}

async function getFcmConfig() {
  if (_config) return _config;
  try {
    const res = await base44.functions.invoke("getFcmPublicConfig", {});
    _config = res?.data || null;
  } catch {
    _config = null;
  }
  return _config;
}

async function initMessaging() {
  const cfg = await getFcmConfig();
  if (!cfg || !cfg.messagingSenderId) return null;
  if (!_app) {
    // Use an isolated NAMED app so a stale default Firebase app (e.g. left over
    // from a previous build) cannot be reused and mint tokens for the wrong project.
    // Full web config (apiKey, appId, authDomain, storageBucket, measurementId) is
    // required so Firebase Installations initializes correctly (messagingSenderId
    // alone triggers "Missing App configuration value: apiKey").
    const name = "mist-fcm";
    _app = getApps().find((a) => a.name === name) || initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId || undefined,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
      measurementId: cfg.measurementId,
    }, name);
  }
  if (!_messaging) _messaging = getMessaging(_app);
  return _messaging;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

export async function isSubscribed() {
  if (!isPushSupported()) return false;
  try { return !!localStorage.getItem(TOKEN_KEY); } catch { return false; }
}

export async function getCurrentToken() {
  try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
}

export function getLastRefresh() {
  try { return localStorage.getItem(LAST_REFRESH_KEY) || null; } catch { return null; }
}

function markRefresh() {
  try { localStorage.setItem(LAST_REFRESH_KEY, new Date().toISOString()); } catch { /* ignore */ }
}

async function registerToken(token) {
  if (!token) return null;
  try {
    const existing = await base44.entities.DeviceToken.filter({ token, is_active: true });
    if (existing && existing.length > 0) {
      await base44.entities.DeviceToken.update(existing[0].id, {
        last_seen: new Date().toISOString(),
        is_active: true,
      });
      markRefresh();
      return existing[0];
    }
    const me = await base44.auth.me();
    await base44.entities.DeviceToken.create({
      user_id: me.id,
      token,
      platform: "web",
      user_agent: navigator.userAgent,
      is_active: true,
      last_seen: new Date().toISOString(),
    });
    markRefresh();
  } catch (e) {
    console.warn("registerToken failed", e);
  }
  return null;
}

// Persist a freshly-minted token. When Firebase rotates the token, deactivate the
// previous DeviceToken record so only the current token stays active.
async function persistToken(token) {
  const old = (await getCurrentToken()) || null;
  await registerToken(token);
  try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(PROMPTED_KEY, "1"); } catch { /* ignore */ }
  if (old && old !== token) {
    // Firebase rotates the token — deactivate the PREVIOUS token only. We do NOT
    // inspect token format (e.g. colon presence) to judge validity; format is not
    // guaranteed. Stale tokens naturally fail at send time and are cleaned up there.
    try {
      const stale = await base44.entities.DeviceToken.filter({ token: old });
      for (const t of stale || []) await base44.entities.DeviceToken.update(t.id, { is_active: false }).catch(() => {});
    } catch { /* ignore */ }
  }
}

// Core: obtain a real FCM registration token via the Firebase Messaging SDK.
export async function requestToken() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  const cfg = await getFcmConfig();
  if (!cfg || !cfg.vapidPublicKey) return { ok: false, reason: "no-vapid-key" };
  if (!cfg.messagingSenderId) return { ok: false, reason: "no-sender-id" };
  try {
    const messaging = await initMessaging();
    if (!messaging) return { ok: false, reason: "init-failed" };
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    await navigator.serviceWorker.ready;
    // One-time migration: clear any stale subscription/SDK cache left by the old
    // endpoint-extraction flow so the SDK mints a fresh, properly-enrolled token.
    if (!localStorage.getItem("fcm_sdk_clean")) {
      try { await deleteToken(messaging); } catch { /* no cached token — fine */ }
      try { const oldSub = await reg.pushManager.getSubscription(); if (oldSub) await oldSub.unsubscribe(); } catch { /* ignore */ }
      localStorage.setItem("fcm_sdk_clean", "1");
    }
    const token = await getToken(messaging, { vapidKey: cfg.vapidPublicKey, serviceWorkerRegistration: reg });
    // Diagnostic: log the EXACT object returned by getToken() — unmodified.
    // Firebase token formats are not guaranteed, so we report shape only (no
    // validity assumptions like colon presence).
    // eslint-disable-next-line no-console
    console.log("[FCM] getToken() resolved", {
      resolved: true,
      typeofToken: typeof token,
      isString: typeof token === "string",
      length: typeof token === "string" ? token.length : null,
      startsWith: typeof token === "string" ? token.slice(0, 8) : null,
    });
    if (!token) return { ok: false, reason: "no-token" };
    return { ok: true, token };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("[FCM] getToken() threw", { resolved: false, error: String(e?.message || e) });
    return { ok: false, reason: "subscribe-error", error: String(e?.message || e) };
  }
}

// Ensure permission is granted and a valid token is registered (used on app load).
export async function ensureSubscribed() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
    return { ok: false, reason: "permission-denied" };
  }
  const r = await requestToken();
  if (!r.ok) return r;
  await persistToken(r.token);
  return r;
}

// Initial enable (asks permission first).
export async function subscribeFcm() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  const cfg = await getFcmConfig();
  if (!cfg || !cfg.vapidPublicKey) return { ok: false, reason: "no-vapid-key" };
  if (!cfg.messagingSenderId) return { ok: false, reason: "no-sender-id" };
  if (typeof Notification !== "undefined") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "permission-denied" };
  }
  const r = await requestToken();
  if (!r.ok) return r;
  await persistToken(r.token);
  return r;
}

export async function refreshSubscription() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") return { ok: false, reason: "permission-denied" };
  const r = await requestToken();
  if (!r.ok) return r;
  await persistToken(r.token);
  return r;
}

export async function unsubscribeFcm() {
  try {
    const messaging = await initMessaging().catch(() => null);
    if (messaging) {
      try { await deleteToken(messaging); } catch { /* ignore */ }
    } else if (isPushSupported()) {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = await reg?.pushManager?.getSubscription();
      if (sub) await sub.unsubscribe();
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const existing = await base44.entities.DeviceToken.filter({ token });
      for (const t of existing || []) await base44.entities.DeviceToken.delete(t.id).catch(() => {});
    }
  } catch { /* ignore */ }
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(LAST_REFRESH_KEY); } catch { /* ignore */ }
  return { ok: true };
}

export async function listMyDevices() {
  try {
    const me = await base44.auth.me();
    const list = await base44.entities.DeviceToken.filter({ user_id: me.id, is_active: true }, "-last_seen", 50);
    return list || [];
  } catch { return []; }
}

export async function removeDeviceById(id) {
  await base44.entities.DeviceToken.delete(id);
}

// Foreground message hook for components that want live in-app toasts.
export { onMessage };