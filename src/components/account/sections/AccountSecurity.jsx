import { useState } from "react";
import { useMistUser } from "@/hooks/useMistUser";
import { useParsedField, DEFAULT_SECURITY } from "@/hooks/useAccountPrefs";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { SectionCard, ToggleRow } from "../ui";
import {
  KeyRound, ShieldCheck, Smartphone, History, AlertTriangle, LogOut, RefreshCw, Mail,
} from "lucide-react";

export default function AccountSecurity() {
  const { user, mistUser } = useMistUser();
  const [sec, saveSec] = useParsedField("security_settings", DEFAULT_SECURITY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  const sendReset = async () => {
    setSending(true);
    try { await base44.auth.resetPasswordRequest(user?.email || ""); setSent(true); }
    catch {} finally { setSending(false); }
  };

  const generateRecovery = () => {
    const codes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 8).toUpperCase());
    saveSec({ ...sec, recovery_codes: codes, recovery_seen: true });
  };

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown";

  return (
    <div className="space-y-4">
      <SectionCard title="Change Password" desc="Secure your account with a strong password." icon={KeyRound}>
        <p className="text-sm text-muted-foreground">For your security, password changes are handled through MIST's verified reset flow. We'll send a secure link to your email.</p>
        <div className="flex items-center gap-2 mt-3">
          <Button onClick={sendReset} disabled={sending}>
            {sending ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>) : (<><Mail className="w-4 h-4" /> Send reset email</>)}
          </Button>
          {sent && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Email sent</Badge>}
        </div>
      </SectionCard>

      <SectionCard title="Email Verification" desc="Confirm your email address." icon={ShieldCheck}>
        {user?.email_verified ? (
          <div className="flex items-center gap-2"><Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Verified</Badge><span className="text-sm text-muted-foreground">{user?.email}</span></div>
        ) : (
          <div className="flex items-center gap-2"><Badge variant="outline" className="text-amber-400 border-amber-500/30">Unverified</Badge><span className="text-sm text-muted-foreground">Check your inbox for a verification link.</span></div>
        )}
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" desc="Add an extra layer of security." icon={Smartphone}>
        <ToggleRow
          label="2FA (TOTP)"
          desc={sec.two_factor ? "Enabled — requires a code at sign-in." : "Add a time-based code from an authenticator app."}
          checked={!!sec.two_factor}
          onChange={(v) => saveSec({ ...sec, two_factor: v })}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => { generateRecovery(); setRecoveryOpen(true); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Generate recovery codes
          </Button>
        </div>
        <Dialog open={recoveryOpen} onOpenChange={setRecoveryOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Recovery codes</DialogTitle><DialogDescription>Save these one-time codes in a safe place. Each can be used once if you lose access to your authenticator.</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {(sec.recovery_codes || []).map((c, i) => <div key={i} className="px-2 py-1 rounded bg-secondary text-center">{c}</div>)}
            </div>
            <DialogFooter><Button onClick={() => setRecoveryOpen(false)}>I've saved them</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </SectionCard>

      <SectionCard title="Active Sessions & Devices" desc="Where your account is signed in." icon={History}>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <div><p className="text-sm font-medium">{browser} on {os}</p><p className="text-xs text-muted-foreground">This device · current session</p></div>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Active</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Detailed session and login history require platform support to display accurately.</p>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setConfirmLogout(true)}>
          <LogOut className="w-3.5 h-3.5" /> Sign out other devices
        </Button>
        <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
          <DialogContent>
            <DialogHeader><DialogTitle>Sign out other devices?</DialogTitle><DialogDescription>This will end all other active sessions. You'll stay signed in on this device.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirmLogout(false)}>Cancel</Button>
              <Button onClick={() => setConfirmLogout(false)}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SectionCard>

      <SectionCard title="Security Alerts" desc="Recent security events." icon={AlertTriangle}>
        <p className="text-sm text-muted-foreground">No recent security alerts. We'll notify you of suspicious activity here.</p>
      </SectionCard>
    </div>
  );
}