import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Star, Award, Search, Users, Shield,
  ChevronRight, X, Send, FileText, ExternalLink, Loader2
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

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

// ─── Compose Modal ───────────────────────────────────────────────────────────
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
    } catch (e) {
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-5 pb-8 space-y-4 animate-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
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
              rows={5}
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

// ─── Member Profile Sheet ─────────────────────────────────────────────────────
function MemberSheet({ member, onClose, onMessage, isSelf }) {
  const avatarUrl = normalizeAvatar(member.avatar);
  const role = getRoleStyle(member.role);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl overflow-y-auto max-h-[85vh] animate-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-violet-900/60 via-indigo-900/60 to-background relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-8">
          {/* Avatar */}
          <div className="flex items-end justify-between mt-4 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-violet-500/50 bg-violet-950 shadow-lg shadow-violet-900/40">
              <img src={avatarUrl || LOGO_URL} alt={member.username}
                className="w-full h-full object-cover" onError={e => { e.target.src = LOGO_URL; }} />
            </div>
            {!isSelf && (
              <button
                onClick={() => onMessage(member)}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-foreground">{member.username}</h2>
            {role && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${role.cls}`}>
                <Shield className="w-2.5 h-2.5" />{role.label}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-5">GMRS Community Member</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: MessageSquare, label: "Posts", value: member.postcount ?? 0, color: "text-violet-400" },
              { icon: FileText, label: "Threads", value: member.threadcount ?? 0, color: "text-cyan-400" },
              { icon: Star, label: "Reputation", value: member.reputation ?? 0, color: "text-amber-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center py-3 rounded-xl bg-secondary/60 border border-border">
                <Icon className={`w-4 h-4 ${color} mb-1`} />
                <span className="text-lg font-bold text-foreground">{value}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Forum profile link */}
          <a
            href={`https://insomniacsgmrs.com/member.php?action=profile&username=${encodeURIComponent(member.username)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border hover:bg-secondary transition-colors"
          >
            <span className="text-sm text-foreground font-medium">View Forum Profile</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
        {/* Safe area spacer for bottom nav */}
        <div className="h-24" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Members() {
  const { mybbUser } = useMyBBAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | admin | moderator
  const [selectedMember, setSelectedMember] = useState(null);
  const [composeTo, setComposeTo] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["forum-members"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "members" });
      return res.data?.members || [];
    },
    staleTime: 60000,
  });

  const filtered = members.filter(m => {
    const matchSearch = !search || m.username?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || m.role === filter;
    return matchSearch && matchFilter;
  });

  const admins = members.filter(m => m.role === "admin").length;
  const mods = members.filter(m => m.role === "moderator").length;

  const handleMessage = (member) => {
    setSelectedMember(null);
    setComposeTo(member);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Members" showBack />

      <div className="px-4 py-4 space-y-4">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: members.length, color: "text-violet-400" },
            { label: "Admins", value: admins, color: "text-amber-400" },
            { label: "Mods", value: mods, color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-3 rounded-xl bg-secondary/40 border border-border">
              <span className={`text-xl font-bold ${color}`}>{value}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "All Members" },
            { key: "admin", label: "Admins" },
            { key: "moderator", label: "Mods" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-violet-600 text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading members...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No members found</p>
          </div>
        )}

        {/* Member List */}
        <div className="space-y-2">
          {filtered.map(member => {
            const avatarUrl = normalizeAvatar(member.avatar);
            const isSelf = mybbUser?.username === member.username;
            const role = getRoleStyle(member.role);

            return (
              <div
                key={member.uid}
                onClick={() => setSelectedMember(member)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-[0.99] transition-all cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-violet-950/50 border border-violet-500/20">
                    <img
                      src={avatarUrl || LOGO_URL}
                      alt={member.username}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.onerror = null; e.target.src = LOGO_URL; }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-semibold text-foreground truncate">{member.username}</span>
                    {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold">You</span>}
                    {role && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${role.cls}`}>
                        {role.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MessageSquare className="w-2.5 h-2.5" />{member.postcount ?? 0}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Award className="w-2.5 h-2.5" />{member.threadcount ?? 0}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Star className="w-2.5 h-2.5" />{member.reputation ?? 0} rep
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isSelf && (
                    <button
                      onClick={e => { e.stopPropagation(); handleMessage(member); }}
                      className="p-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Profile Sheet */}
      {selectedMember && (
        <MemberSheet
          member={selectedMember}
          isSelf={mybbUser?.username === selectedMember.username}
          onClose={() => setSelectedMember(null)}
          onMessage={handleMessage}
        />
      )}

      {/* Compose Modal */}
      {composeTo && (
        <ComposeModal
          recipient={composeTo}
          onClose={() => setComposeTo(null)}
        />
      )}
    </div>
  );
}