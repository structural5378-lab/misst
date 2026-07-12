import React, { useState } from "react";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { base44 } from "@/api/base44Client";
import { X, MessageSquare, Send, Navigation, Loader2, Shield, ExternalLink } from "lucide-react";
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

// ─── Compose Modal ────────────────────────────────────────────────────────────
function ComposeModal({ recipient, onClose }) {
  const { mybbUser } = useMyBBAuth();
  const [subject, setSubject] = useState(`Hello from ${mybbUser?.username || "a member"}`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      await base44.functions.invoke("mybbMessages", {
        action: "send_pm",
        username: mybbUser.username,
        password: mybbUser.password,
        to_username: recipient.username,
        subject,
        message,
      });
      setSent(true);
    } catch {
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-5 pb-8 space-y-4 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-violet-500/30 bg-violet-950/50">
              <img src={normalizeAvatar(recipient.avatar) || LOGO_URL} alt={recipient.username}
                className="w-full h-full object-cover" onError={e => { e.target.src = LOGO_URL; }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{recipient.username}</p>
              <p className="text-xs text-muted-foreground">Private Message</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Message Sent!</p>
            <p className="text-xs text-muted-foreground">Your message was delivered to {recipient.username}</p>
            <button onClick={onClose} className="mt-2 text-xs text-violet-400 hover:underline">Close</button>
          </div>
        ) : (
          <>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`Write a message to ${recipient.username}...`}
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending..." : "Send Message"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────
export default function OnlineMembersSheet({ members, onClose }) {
  const { mybbUser } = useMyBBAuth();
  const [composeTo, setComposeTo] = useState(null);

  return (
    <>
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
                            onClick={() => setComposeTo(member)}
                            title="Send Message"
                            className="p-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 transition-colors"
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

      {composeTo && (
        <ComposeModal recipient={composeTo} onClose={() => setComposeTo(null)} />
      )}
    </>
  );
}