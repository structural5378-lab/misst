import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, MessageSquare, UserPlus, ExternalLink, Radio } from "lucide-react";
import { useAuthorProfile } from "@/hooks/useAuthorProfile";
import { getRoleBadge } from "@/lib/forumUtils";

function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
}

export default function ProfilePopup({ authorId, role, name, onClose }) {
  const navigate = useNavigate();
  const { data: profile } = useAuthorProfile(authorId);
  const stats = profile?.stats || {};
  const user = profile?.user || {};
  const roleBadge = getRoleBadge(role || "member");

  const { data: recent = [] } = useQuery({
    queryKey: ["author-recent-threads", authorId],
    queryFn: () => base44.entities.ForumThread.filter({ author_id: authorId }, "-created_date", 5),
    enabled: !!authorId,
    staleTime: 30000,
  });

  if (!authorId) return null;
  const radios = safeArr(user.radios);
  const displayName = user.full_name || name || "Unknown";
  const callsign = stats.user_callsign || user.callsign;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden sheet-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative h-20 bg-gradient-to-br from-violet-900/60 to-background">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 -mt-10 pb-4">
          <div className="flex items-end gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-card" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border-2 border-card flex items-center justify-center text-lg font-bold text-primary">
                {(displayName || "?")[0]}
              </div>
            )}
            <div className="flex-1 pb-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">{displayName}</h3>
              {callsign && <p className="text-xs text-primary">{callsign}</p>}
              <span className={`mt-1 inline-flex items-center text-[9px] px-1.5 py-0.5 rounded border ${roleBadge.color}`}>{roleBadge.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <Stat label="Level" value={stats.level || 1} />
            <Stat label="Rep" value={stats.reputation || 0} />
            <Stat label="Posts" value={stats.forum_posts || 0} />
          </div>
          {radios.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground mb-1">Equipment</p>
              <div className="flex flex-wrap gap-1">
                {radios.slice(0, 4).map((r, i) => (
                  <span key={i} className="text-[10px] bg-muted/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-primary" />{r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {recent.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground mb-1">Recent Activity</p>
              <div className="space-y-1">
                {recent.map((t) => (
                  <button key={t.id} onClick={() => { onClose(); navigate(`/community/thread/${t.id}`); }} className="w-full text-left text-xs text-foreground hover:text-primary truncate">
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
              <MessageSquare className="w-3.5 h-3.5" />Message
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-medium">
              <UserPlus className="w-3.5 h-3.5" />Follow
            </button>
            <button onClick={() => { onClose(); navigate(`/profile?user=${authorId}`); }} className="flex items-center justify-center py-2 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs font-medium">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="py-1.5 rounded-lg bg-muted/30">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}