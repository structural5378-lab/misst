import { useParsedField, DEFAULT_NOTIFS } from "@/hooks/useAccountPrefs";
import { SectionCard, ToggleRow } from "../ui";
import { Switch } from "@/components/ui/switch";
import { Bell, MessageSquare, AtSign, Mail, UserPlus, Calendar, Radio, Newspaper, Megaphone, Award, Trophy, Smartphone } from "lucide-react";

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
];

export default function AccountNotifications() {
  const [n, save] = useParsedField("notif_settings", DEFAULT_NOTIFS);
  const set = (k, v) => save({ ...n, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="Notification Categories" desc="Choose what you're notified about." icon={Bell}>
        {CATEGORIES.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
              <div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
            </div>
            <Switch checked={!!n[key]} onCheckedChange={(v) => set(key, v)} />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Delivery Channels" desc="Where notifications are sent." icon={Smartphone}>
        <ToggleRow label="Push Notifications" desc="On-device push alerts." checked={!!n.push} onChange={(v) => set("push", v)} />
        <ToggleRow label="Email Notifications" desc="Digest and important alerts via email." checked={!!n.email} onChange={(v) => set("email", v)} />
        <ToggleRow label="SMS (future)" desc="Text message alerts — coming soon." checked={!!n.sms} onChange={(v) => set("sms", v)} />
      </SectionCard>
    </div>
  );
}