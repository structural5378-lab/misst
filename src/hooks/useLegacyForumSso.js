import { useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useLegacyForumSso — initiates MIST→MyBB Single Sign-On.
 *
 * MIST is the IdP. This asks MIST to issue a short-lived signed token, then
 * submits it to the trusted PHP bridge via a hidden POST form (SAML-style POST
 * binding) — no query-string auth, no password. The bridge validates the token
 * server-side and establishes a MyBB session, so the user is already logged in
 * when the forum loads.
 *
 * Use this only for transitional legacy forum access while MyBB remains the
 * forum engine; the native MIST Community UI (Phase 4) supersedes direct
 * MyBB pages.
 */
export function useLegacyForumSso() {
  return useCallback(async () => {
    const res = await base44.functions.invoke("ssoIssueToken", {});
    if (!res.data?.success) {
      throw new Error(res.data?.error || "Unable to start forum single sign-on");
    }
    const { token, bridge_url } = res.data;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = bridge_url;
    form.style.display = "none";

    const addAction = document.createElement("input");
    addAction.type = "hidden";
    addAction.name = "action";
    addAction.value = "sso";
    form.appendChild(addAction);

    const addToken = document.createElement("input");
    addToken.type = "hidden";
    addToken.name = "token";
    addToken.value = token;
    form.appendChild(addToken);

    document.body.appendChild(form);
    form.submit();
  }, []);
}

export default useLegacyForumSso;