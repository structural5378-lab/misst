import { getServiceAccount, getProjectNumber } from "../../shared/fcm.ts";

// Public Firebase Web App configuration (safe to expose to the browser — these
// are the public web config values, NOT secrets). Returns the complete config
// the Firebase JS SDK needs to initializeApp() so Installations / Messaging
// work without "Missing App configuration value: apiKey" errors.
// The service account's private key is never exposed.

// Public Firebase Web App config for project misst-8bffd.
const WEB_APP_CONFIG = {
  apiKey: "AIzaSyAiaN4Lq52q_zaYhfGSn7K9T3INlDdYGwA",
  authDomain: "misst-8bffd.firebaseapp.com",
  projectId: "misst-8bffd",
  storageBucket: "misst-8bffd.firebasestorage.app",
  appId: "1:135575197642:web:1b7a17d890018d889c6133",
  measurementId: "G-2BF2GNYB1L",
};

Deno.serve(async () => {
  try {
    const vapid = Deno.env.get("FCM_WEB_VAPID_KEY");
    const senderId = Deno.env.get("FCM_SENDER_ID");
    const sa = getServiceAccount();
    // Authoritative: derive the project number (messagingSenderId) from the
    // service account via the Cloud Resource Manager API so the client SDK always
    // mints tokens for the SAME project we send through. Falls back to the env var,
    // then to the web config value.
    let projectNumber = null;
    if (sa?.project_id) {
      try { projectNumber = await getProjectNumber(); } catch { /* ignore */ }
    }
    return Response.json({
      vapidPublicKey: vapid ? vapid : null,
      messagingSenderId: projectNumber || (senderId ? senderId : WEB_APP_CONFIG.projectId ? "135575197642" : null),
      projectId: sa?.project_id || WEB_APP_CONFIG.projectId,
      apiKey: WEB_APP_CONFIG.apiKey,
      authDomain: WEB_APP_CONFIG.authDomain,
      storageBucket: WEB_APP_CONFIG.storageBucket,
      appId: WEB_APP_CONFIG.appId,
      measurementId: WEB_APP_CONFIG.measurementId,
    });
  } catch (error) {
    return Response.json({ vapidPublicKey: null, messagingSenderId: null, projectId: null, apiKey: null, error: error.message }, { status: 500 });
  }
});