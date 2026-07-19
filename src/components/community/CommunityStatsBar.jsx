import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageSquare, FileText, Users, Wifi } from "lucide-react";

export default function CommunityStatsBar({ threads = [] }) {
  const { data: members = 0 } = useQuery({
    queryKey: ["forum-member-total"],
    queryFn: async () => (await base44.entities.User.list("-created_date", 500)).length,
    staleTime: 120000,
  });
  const { data: online = [] } = useQuery({
    queryKey: ["forum-online-presence"],
    queryFn: () => base44.entities.UserPresence.filter({ status: "online" }),
    staleTime: 15000,
  });
  const posts = threads.reduce((s, t) => s + (t.reply_count || 0), 0);
  const items = [
    { icon: MessageSquare, label: "Threads", value: threads.length },
    { icon: FileText, label: "Posts", value: posts },
    { icon: Users, label: "Members", value: members },
    { icon: Wifi, label: "Online", value: online.length },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 px-4 pt-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex flex-col items-center py-2.5 rounded-xl bg-card/60 border border-border/60">
          <Icon className="w-3.5 h-3.5 text-primary mb-1" />
          <span className="text-base font-bold text-foreground leading-none">{value}</span>
          <span className="text-[9px] text-muted-foreground mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}