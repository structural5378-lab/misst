import { useEffect, useState } from "react";
import { mist } from '@/api/mist';
import { useMistUser } from "@/hooks/useMistUser";
import { SectionCard } from "../ui";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { CloudLightning, MapPin, Bell, Volume2, Vibrate, Map as MapIcon } from "lucide-react";

const RADII = [5, 10, 15, 25, 50];

export default function AccountWeather() {
  const { user } = useMistUser();
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const rows = await mist.entities.LightningAlertSettings.filter({ user_id: user.id });
        if (rows && rows.length > 0) {
          setSettings(rows[0]);
        } else {
          const created = await mist.entities.LightningAlertSettings.create({
            user_id: user.id,
            enabled: false,
            radius_miles: 10,
            push_enabled: true,
            sound_enabled: true,
            vibration_enabled: true,
            auto_open_map: false,
            updated_at: new Date().toISOString(),
          });
          setSettings(created);
        }
      } catch {}
      setLoading(false);
    })();
  }, [user?.id]);

  const update = async (patch) => {
    if (!settings) return;
    const next = { ...patch, updated_at: new Date().toISOString() };
    setSettings({ ...settings, ...next });
    try {
      await mist.entities.LightningAlertSettings.update(settings.id, next);
      toast({ title: "Lightning preferences saved", duration: 1500 });
    } catch {
      toast({ title: "Could not save preferences", variant: "destructive", duration: 1500 });
      setSettings(settings);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading…</div>;
  const s = settings || {};
  const dim = !s.enabled ? "opacity-50 pointer-events-none" : "";

  return (
    <div className="space-y-4">
      <SectionCard title="Weather & Hazard Alerts" desc="Get notified about nearby lightning activity. Provider: Mock (Phase 1)." icon={CloudLightning}>
        <Row icon={CloudLightning} label="Lightning Alerts" desc="Enable lightning strike alerts based on your live location.">
          <Switch checked={!!s.enabled} onCheckedChange={(v) => update({ enabled: v })} />
        </Row>

        <div className={`mt-4 ${dim}`}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Alert Radius</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {RADII.map((r) => (
              <button
                key={r}
                onClick={() => update({ radius_miles: r })}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  s.radius_miles === r
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {r} mi
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-4 space-y-2 ${dim}`}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notification Options</p>
          <Row icon={Bell} label="Push Notification" desc="Receive a push when a strike is within radius.">
            <Switch checked={!!s.push_enabled} onCheckedChange={(v) => update({ push_enabled: v })} />
          </Row>
          <Row icon={Volume2} label="Play Alert Sound" desc="Sound on push delivery.">
            <Switch checked={!!s.sound_enabled} onCheckedChange={(v) => update({ sound_enabled: v })} />
          </Row>
          <Row icon={Vibrate} label="Vibrate" desc="Vibrate on push delivery.">
            <Switch checked={!!s.vibration_enabled} onCheckedChange={(v) => update({ vibration_enabled: v })} />
          </Row>
          <Row icon={MapIcon} label="Show Map Automatically" desc="Open RadioScope centered on the strike when tapped.">
            <Switch checked={!!s.auto_open_map} onCheckedChange={(v) => update({ auto_open_map: v })} />
          </Row>
        </div>
      </SectionCard>
    </div>
  );
}

function Row({ icon: Icon, label, desc, children }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}