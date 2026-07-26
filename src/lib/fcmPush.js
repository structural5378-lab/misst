import { base44 } from "@/api/base44Client";

// FCM web push client — native Push API + FCM HTTP v1 backend. No Firebase JS SDK.
// The VAPID public key is fetched from getFcmPublicConfig; the Push subscription
// endpoint yields the FCM registration token, registered to the DeviceToken entity
// (one record per device — supports multiple devices per user).

const SW_PATH = "/sw.js";
const PROMPTED_KEY = "fcm_prompted";
const TOKEN_KEY = "fcm_token";
const LAST_REFRESH_KEY = "fcm_last_refresh";

export async function getVapidKey() {
  try {
    const res = await base44.functions.invoke("getFcmPublicConfig", {});
    return res?.data?.vapidPublicKey || null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
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
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

export async function getCurrentToken() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!reg) return null;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return null;
    return sub.endpoint.split("/").pop();
  } catch {
    return null;
  }
}

export function getLastRefresh() {
  try { return localStorage.getItem(LAST_REFRESH_KEY) || null; } catch { return null; }
}

function markRefresh() {
  try { localStorage.setItem(LAST_REFRESH_KEY, new Date().toISOString()); } catch { /* ignore */ }
}

// Register / refresh a device token against the backend (idempotent per token).
export async function registerToken(token) {
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

export async function listMyDevices() {
  try {
    const me = await base44.auth.me();
    const list = await base44.entities.DeviceToken.filter({ user_id: me.id, is_active: true }, "-last_seen", 50);
    return list || [];
  } catch {
    return [];
  }
}

export async function removeDeviceById(id) {
  await base44.entities.DeviceToken.delete(id);
}

// Request permission, subscribe via Push API, register token. (Initial enable.)
export async function subscribeFcm() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  const vapid = await getVapidKey();
  if (!vapid) return { ok: false, reason: "no-vapid-key" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "permission-denied" };
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    }
    const token = sub.endpoint.split("/").pop();
    await registerToken(token);
    try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(PROMPTED_KEY, "1"); } catch { /* ignore */ }
    return { ok: true, token };
  } catch (e) {
    return { ok: false, reason: "subscribe-error", error: String(e?.message || e) };
  }
}

// Re-subscribe / re-register the current device (assumes permission already granted).
export async function refreshSubscription() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") return { ok: false, reason: "permission-denied" };
  const vapid = await getVapidKey();
  if (!vapid) return { ok: false, reason: "no-vapid-key" };
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    }
    const token = sub.endpoint.split("/").pop();
    await registerToken(token);
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
    return { ok: true, token };
  } catch (e) {
    return { ok: false, reason: "subscribe-error", error: String(e?.message || e) };
  }
}

export async function unsubscribeFcm() {
  try {
    if (isPushSupported()) {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = await reg?.pushManager?.getSubscription();
      if (sub) await sub.unsubscribe();
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const existing = await base44.entities.DeviceToken.filter({ token });
      for (const t of existing || []) {
        await base44.entities.DeviceToken.delete(t.id).catch(() => {});
      }
    }
  } catch { /* ignore */ }
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(LAST_REFRESH_KEY); } catch { /* ignore */ }
  return { ok: true };
}