import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wifi, ShieldCheck } from "lucide-react";

const STAFF_ROLES = ["platform_owner", "platform_admin", "community_owner", "community_admin", "moderator"];

export default function OnlineMembersStrip() {
  const { data: online = [] } = useQuery({
    queryKey: ["forum-online-presence"],
    queryFn: () => base44.entities.UserPresence.filter({ status: "online" }),
    staleTime: 15000,
  });
  const { data: staffIds = [] } = useQuery({
    queryKey: ["forum-staff-ids"],
    queryFn: async () => {
      const [plat, comm] = await Promise.all([
        base44.entities.PlatformRole.filter({ is_active: true }),
        base44.entities.CommunityRole.filter({ is_active: true }),
      ]);
      const ids = new Set();
      [...(plat || []), ...(comm || [])].forEach((r) => { if (STAFF_ROLES.includes(r.role)) ids.add(r.user_id); });
      return Array.from(ids);
    },
    staleTime: 60000,
  });

  if (!online.length) return null;
  const staffSet = new Set(staffIds);
  const staffOnline = online.filter((o) => staffSet.has(o.user_id));
  const regularOnline = online.filter((o) => !staffSet.has(o.user_id));

  return (
    <div className="px-4 pt-3 space-y-3">
      {staffOnline.length > 0 && (
        <Strip icon={ShieldCheck} title="Staff Online" members={staffOnline} accent="text-emerald-400" />
      )}
      <Strip icon={Wifi} title="Online Now" members={regularOnline} accent="text-primary" />
    </div>
  );
}

function Strip({ icon: Icon, title, members, accent }) {
  if (!members.length) return null;
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${accent} mb-1.5 px-1`}>
        <Icon className="w-3.5 h-3.5" /> {title}
        <span className="text-muted-foreground font-normal">{members.length}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {members.map((m) => (
          <div key={m.user_id} className="flex flex-col items-center gap-1 shrink-0 w-14">
            {m.user_avatar ? (
              <img src={m.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {(m.user_name || "?")[0]}
              </div>
            )}
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">{(m.user_name || "?").split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}