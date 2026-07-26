import { getServiceAccount, getProjectNumber } from "../../shared/fcm.ts";

// Public FCM web-push config (safe to expose to the browser). Returns the VAPID
// public key, the Firebase sender ID (project number), and the project ID. The
// Firebase Messaging JS SDK needs messagingSenderId to mint real registration
// tokens via getToken(); the service account's private key is never exposed.
Deno.serve(async () => {
  try {
    const vapid = Deno.env.get("FCM_WEB_VAPID_KEY");
    const senderId = Deno.env.get("FCM_SENDER_ID");
    const sa = getServiceAccount();
    const projectId = sa?.project_id || null;
    // Authoritative: derive the project number (messagingSenderId) from the
    // service account via the Cloud Resource Manager API so the client SDK always
    // mints tokens for the SAME project we send through. Falls back to the env var.
    let projectNumber = null;
    if (projectId) {
      try { projectNumber = await getProjectNumber(); } catch { /* ignore */ }
    }
    return Response.json({
      vapidPublicKey: vapid ? vapid : null,
      messagingSenderId: projectNumber || (senderId ? senderId : null),
      projectId,
    });
  } catch (error) {
    return Response.json({ vapidPublicKey: null, messagingSenderId: null, projectId: null, error: error.message }, { status: 500 });
  }
});