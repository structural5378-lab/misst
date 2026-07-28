import React from "react";
import { useActiveCommunity } from "@/hooks/useActiveCommunity";
import { useCommunityOnlineMembers } from "@/hooks/useCommunityOnlineMembers";
import { Wifi, ShieldCheck } from "lucide-react";

/**
 * OnlineMembersStrip — community-scoped "who's online".
 *
 * Displays ONLY members of the active community who are currently online
 * (UserPresence.status === 'online' INTERSECT active CommunityMember). The
 * backend function enforces the community boundary and rejects unscooped
 * queries, so a user from another community can never appear here.
 *
 * Accepts an optional `communityId` prop (for callers that already have a
 * community context); otherwise resolves the active community.
 */
export default function OnlineMembersStrip({ communityId }) {
  const { community } = useActiveCommunity();
  const activeId = communityId || community?.id;
  const { data } = useCommunityOnlineMembers(activeId);
  const online = data?.online || [];

  if (!online.length) return null;

  const staffOnline = online.filter((o) => o.is_staff);
  const regularOnline = online.filter((o) => !o.is_staff);

  return (
    <div className="px-4 lg:px-6 xl:px-8 pt-3 space-y-3">
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