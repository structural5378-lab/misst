import React from "react";
import { Building, MapPin, Radio, Calendar, Clock } from "lucide-react";

export default function CommunityOverviewTab({ community, members }) {
  const active = members.filter((m) => m.status === "active").length;
  const pending = members.filter((m) => m.status === "pending").length;
  const banned = members.filter((m) => m.status === "banned").length;
  const mods = members.filter((m) => m.role === "moderator" || m.role === "community_admin" || m.role === "community_owner").length;
  const recent = [...members]
    .filter((m) => m.joined_date)
    .sort((a, b) => new Date(b.joined_date) - new Date(a.joined_date))
    .slice(0, 6);

  const stats = [
    { label: "Active Members", value: active },
    { label: "Pending", value: pending },
    { label: "Banned", value: banned },
    { label: "Moderators", value: mods },
  ];
  const info = [
    { icon: Calendar, label: "Created", value: community.created_date ? new Date(community.created_date).toLocaleDateString() : "—" },
    { icon: Building, label: "Category", value: community.category || "—" },
    { icon: MapPin, label: "Location", value: community.location || "—" },
    { icon: Radio, label: "Repeater", value: community.primary_repeater || "—" },
    { icon: Radio, label: "Frequency", value: community.frequency ? `${community.frequency} MHz` : "—" },
    { icon: Clock, label: "Last Activity", value: community.updated_date ? new Date(community.updated_date).toLocaleString() : "—" },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {community.banner_url && (
          <img src={community.banner_url} alt="banner" className="w-full h-40 rounded-xl object-cover" />
        )}
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{community.description || "No description provided."}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {info.map((i) => (
            <div key={i.label} className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><i.icon className="w-3.5 h-3.5" />{i.label}</div>
              <div className="text-sm font-medium text-foreground truncate">{i.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-muted/40 p-3">
                <div className="text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Members</h3>
          <div className="space-y-2">
            {recent.length === 0 && <p className="text-xs text-muted-foreground">No members yet.</p>}
            {recent.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                {m.user_avatar
                  ? <img src={m.user_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  : <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs text-primary font-bold">{(m.user_name || "?").charAt(0)}</div>}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{m.user_name || m.user_email}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{m.joined_date ? new Date(m.joined_date).toLocaleDateString() : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}