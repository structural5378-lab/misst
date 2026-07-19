import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMistUser } from "@/hooks/useMistUser";
import { base44 } from "@/api/base44Client";
import { X, MessageSquare, Navigation, Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";
const FORUM_BASE = "https://insomniacsgmrs.com/";

function normalizeAvatar(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return FORUM_BASE + avatar.replace(/^\//, "");
}

function getRoleStyle(role) {
  if (role === "admin") return { label: "Admin", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  if (role === "moderator") return { label: "Mod", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  return null;
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────
export default function OnlineMembersSheet({ members, onClose }) {
  const { mybbUser } = useMistUser();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(null);

  // Start a native MIST direct message: resolve the MyBB username to a MIST
  // user id, then hand off to /messages which creates/opens the conversation.
  const handleMessage = async (member) => {
    setStarting(member.uid);
    try {
      const res = await base44.functions.invoke("searchUsers", { query: member.username });
      const found = (res.data?.users || []).find((u) => u.mybb_username === member.username);
      if (found) {
        const params = new URLSearchParams({
          new_dm: found.id,
          name: found.full_name || found.email || member.username,
          avatar: found.avatar_url || "",
          callsign: found.callsign || "",
        });
        onClose();
        navigate(`/messages?${params.toString()}`);
      } else {
        alert(`${member.username} hasn't registered with MIST native auth yet. They need to log in with their email to use direct messaging.`);
      }
    } catch {
      alert("Failed to start conversation. Please try again.");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom-4"
        style={{ maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-foreground">Online Now</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {members.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member list */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 65px)" }}>
          {members.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No members currently online</div>
          ) : (
            <div className="p-4 space-y-2 pb-24">
              {members.map(member => {
                const isSelf = mybbUser?.username === member.username;
                const role = getRoleStyle(member.role);
                const avatarUrl = normalizeAvatar(member.avatar);

                return (
                  <div key={member.uid} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    {/* Avatar with online dot */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-violet-950/50 border border-violet-500/20">
                        <img
                          src={avatarUrl || LOGO_URL}
                          alt={member.username}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = LOGO_URL; }}
                        />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground truncate">{member.username}</span>
                        {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold">You</span>}
                        {role && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${role.cls}`}>
                            <Shield className="w-2 h-2" />{role.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{member.postcount ?? 0} posts · {member.reputation ?? 0} rep</p>
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleMessage(member)}
                          disabled={starting === member.uid}
                          title="Send Message"
                          className="p-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 transition-colors disabled:opacity-50"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/cineplex?target=${encodeURIComponent(member.username)}`}
                          title="Simplex Share"
                          className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                          onClick={onClose}
                        >
                          <Navigation className="w-4 h-4" />
                        </Link>
                        <a
                          href={`https://insomniacsgmrs.com/member.php?action=profile&username=${encodeURIComponent(member.username)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Forum Profile"
                          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}