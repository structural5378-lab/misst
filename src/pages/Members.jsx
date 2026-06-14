import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Star, Award, Search, Users } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useNavigate } from "react-router-dom";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";
const FORUM_BASE = "https://insomniacsgmrs.com/";

function normalizeAvatar(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return FORUM_BASE + avatar.replace(/^\//, "");
}

export default function Members() {
  const { mybbUser } = useMyBBAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["forum-members"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "members" });
      return res.data?.members || [];
    },
    staleTime: 60000,
  });

  const filtered = members.filter(m =>
    !search || m.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleMessage = (username) => {
    navigate("/messages", { state: { composeTo: username } });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="👥 Members" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No members found</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(member => {
            const avatarUrl = normalizeAvatar(member.avatar);
            const isSelf = mybbUser?.username === member.username;
            const roleLabel = member.role === "admin" ? "Admin" : member.role === "moderator" ? "Mod" : null;

            return (
              <div
                key={member.uid}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-colors"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-violet-950/50 border border-violet-500/20 shrink-0 flex items-center justify-center">
                  <img
                    src={avatarUrl || LOGO_URL}
                    alt={member.username}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.src = LOGO_URL; }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">{member.username}</span>
                    {roleLabel && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        member.role === "admin"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {roleLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />{member.postcount ?? 0} posts
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Award className="w-3 h-3" />{member.threadcount ?? 0} threads
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Star className="w-3 h-3" />{member.reputation ?? 0} rep
                    </span>
                  </div>
                </div>

                {/* Message button */}
                {!isSelf && (
                  <button
                    onClick={() => handleMessage(member.username)}
                    className="shrink-0 p-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 transition-colors"
                    title={`Message ${member.username}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}