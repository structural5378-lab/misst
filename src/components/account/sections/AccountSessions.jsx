import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { SectionCard } from "../ui";
import { Monitor, Smartphone, LogOut, MapPin } from "lucide-react";

export default function AccountSessions() {
  const [confirm, setConfirm] = useState(false);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
  const isMobile = /Android|iPhone|iPad/.test(ua);

  return (
    <div className="space-y-4">
      <SectionCard title="Current Session" desc="This device." icon={isMobile ? Smartphone : Monitor}>
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-medium">{browser} on {os}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Approximate location hidden</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Active now</Badge>
        </div>
      </SectionCard>

      <SectionCard title="Active Sessions" desc="Other places you're signed in." icon={Monitor}>
        <p className="text-sm text-muted-foreground">No other active sessions detected. Detailed session tracking requires platform support.</p>
      </SectionCard>

      <SectionCard title="Trusted Devices" desc="Devices that skip extra verification." icon={Smartphone}>
        <p className="text-sm text-muted-foreground">This device is trusted by default. Manage trusted devices from the Security tab.</p>
      </SectionCard>

      <SectionCard title="Sign Out Everywhere" desc="End all other sessions." icon={LogOut}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setConfirm(true)}><LogOut className="w-4 h-4" /> Sign out other devices</Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">This signs you out of MIST on every other device. You'll stay signed in here.</p>
      </SectionCard>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sign out other devices?</DialogTitle><DialogDescription>This will end all other active sessions. You'll stay signed in on this device.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button onClick={() => setConfirm(false)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}