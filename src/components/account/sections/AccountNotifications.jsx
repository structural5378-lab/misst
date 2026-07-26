import { useParsedField, DEFAULT_NOTIFS } from "@/hooks/useAccountPrefs";
import { SectionCard } from "../ui";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Bell, MessageSquare, AtSign, Mail, UserPlus, Calendar, Radio,
  Newspaper, Megaphone, Award, Trophy, ShieldAlert, Users, Settings as SettingsIcon,
  Volume2, Vibrate, Smartphone, BellOff,
} from "lucide-react";

const CATEGORIES = [
  { key: "forum_replies", label: "Forum Replies", desc: "When someone replies to your threads.", icon: MessageSquare },
  { key: "mentions", label: "Mentions", desc: "When you're @mentioned in a post.", icon: AtSign },
  { key: "messages", label: "Direct Messages", desc: "New private messages.", icon: Mail },
  { key: "friend_requests", label: "Friend Requests", desc: "Incoming friend requests.", icon: UserPlus },
  { key: "events", label: "Events", desc: "Upcoming community events.", icon: Calendar },
  { key: "repeaters", label: "Repeaters", desc: "Repeater updates near you.", icon: Radio },
  { key: "news", label: "News", desc: "Platform news and updates.", icon: Newspaper },
  { key: "announcements", label: "Announcements", desc: "Official announcements.", icon: Megaphone },
  { key: "achievements", label: "Achievements", desc: "When you earn an achievement.", icon: Award },
  { key: "badges", label: "Badges", desc: "When you're awarded a badge.", icon: Trophy },
  { key: "emergency_alerts", label: "Emergency Alerts", desc: "Always delivered — sound & vibration only.", icon: ShieldAlert, locked: true },
  { key: "community_chat", label: "Community Chat", desc: "Community channel messages.", icon: Users },
  { key: "system", label: "System Notifications", desc: "Platform system messages.", icon: SettingsIcon },
];

const CHANNELS = [
  { field: "push", label: "Push", icon: Smartphone },
  { field: "inapp", label: "In-App", icon: Bell },
  { field: "sound", label: "Sound", icon: Volume2 },
  { field: "vibrate", label: "Vibrate", icon: Vibrate },
];

// Normalize a stored category value (legacy boolean or object) into 4 booleans.
function norm(v) {
  if (v === false) return { push: false, inapp: false, sound: false, vibrate: false };
  if (v === true || v == null) return { push: true, inapp: true, sound: true, vibrate: true };
  return {
    push: v.push !== false,
    inapp: v.inapp !== false,
    sound: v.sound !== false,
    vibrate: v.vibrate !== false,
  };
}

export default function AccountNotifications() {
  const [n, save] = useParsedField("notif_settings", DEFAULT_NOTIFS);
  const { toast } = useToast();

  const update = (key, field, value, locked) => {
    if (locked && (field === "push" || field === "inapp")) return; // emergency always delivered
    const cur = norm(n[key]);
    const next = { ...cur, [field]: value };
    // If both delivery channels turn off, the category is fully disabled.
    save({ ...n, [key]: next });
    toast({ title: `${key.replace(/_/g, " ")} preference saved`, duration: 1600 });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Notification Categories" desc="Fine-tune how each category reaches you. Changes save instantly." icon={Bell}>
        <div className="space-y-1">
          {CATEGORIES.map(({ key, label, desc, icon: Icon, locked }) => {
            const c = norm(n[key]);
            const off = !c.push && !c.inapp;
            return (
              <div
                key={key}
                className={`rounded-xl border border-border/40 p-3 transition-colors ${off ? "bg-muted/20 opacity-70" : "bg-card/40"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      {off && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <BellOff className="w-3 h-3" /> Off
                        </span>
                      )}
                      {locked && (
                        <span className="text-[10px] font-medium text-destructive">Always on</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    <div className="grid grid-cols-4 gap-2 mt-2.5">
                      {CHANNELS.map(({ field, label: chLabel, icon: ChIcon }) => {
                        const isDelivery = field === "push" || field === "inapp";
                        const disabled = locked && isDelivery;
                        return (
                          <label
                            key={field}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 border border-border/30 ${disabled ? "opacity-50" : "cursor-pointer hover:bg-muted/30"}`}
                          >
                            <ChIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">{chLabel}</span>
                            <Switch
                              checked={!!c[field]}
                              disabled={disabled}
                              onCheckedChange={(v) => update(key, field, v, locked)}
                              className="ml-auto scale-90"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}