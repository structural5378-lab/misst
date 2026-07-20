import { useState } from "react";
import { useMistUser } from "@/hooks/useMistUser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { SectionCard, Field } from "../ui";
import { Mail, Globe, Clock, CalendarDays, Volume2, Check } from "lucide-react";

const LANGS = ["English", "Spanish", "French", "German"];
const TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "UTC"];
const DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
const SOUNDS = ["Default", "Chime", "Ping", "None"];

export default function AccountSettings() {
  const { user, mistUser, updateProfile } = useMistUser();
  const [username, setUsername] = useState(mistUser.username || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const pref = (field) => ({
    value: user?.[field] || "",
    set: (v) => updateProfile({ [field]: v }),
  });

  const saveUsername = async () => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return;
    setSaving(true);
    try { await updateProfile({ username }); setSaved(true); setTimeout(() => setSaved(false), 1500); }
    catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Email Address" desc="Your email is managed securely by MIST." icon={Mail}>
        <div className="flex items-center gap-2">
          <Input value={user?.email || ""} readOnly />
          {user?.email_verified ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Verified</Badge>
          ) : (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30">Unverified</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">To change your email, contact Base44 support.</p>
      </SectionCard>

      <SectionCard title="Username" desc="Your unique handle across MIST." icon={Globe}
        footer={
          <div className="flex justify-end">
            <Button onClick={saveUsername} disabled={saving || !/^[a-zA-Z0-9_]{3,20}$/.test(username)}>
              {saved ? (<><Check className="w-4 h-4" /> Saved</>) : "Save username"}
            </Button>
          </div>
        }
      >
        <Field label="Username" hint="3–20 chars · letters, numbers, underscore">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
        </Field>
      </SectionCard>

      <SectionCard title="Localization" desc="Regional and display preferences." icon={Clock}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Language">
            <Select value={pref("language").value || "English"} onValueChange={pref("language").set}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Time Zone">
            <Select value={pref("timezone").value || "America/New_York"} onValueChange={pref("timezone").set}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Date Format">
            <Select value={pref("date_format").value || "MM/DD/YYYY"} onValueChange={pref("date_format").set}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DATE_FORMATS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Notification Sound">
            <Select value={pref("notif_sound").value || "Default"} onValueChange={pref("notif_sound").set}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SOUNDS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> Theme & accent color live in the Appearance tab.
        </p>
      </SectionCard>
    </div>
  );
}