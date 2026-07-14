import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Smile, Reply, Quote, MoreHorizontal, Edit2, Trash2, CornerDownRight } from "lucide-react";
import { timeAgo, parseJSON, REACTION_EMOJIS, getRoleBadge } from "@/lib/forumUtils";

const QUICK_REACTIONS = ["like", "heart", "fire", "laugh"];

export default function PostCard({ post, thread, user, isOP = false, onReply, onQuote, isAdmin, onUpdate }) {
  const navigate = useNavigate();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const reactions = parseJSON(post.reactions, {});
  const mentions = parseJSON(post.mentions, []);
  const isAuthor = user?.id === post.author_id;
  const canModerate = isAdmin || isAuthor;

  const openProfile = () => { if (post.author_id) navigate(`/profile?user=${post.author_id}`); };

  const toggleReaction = async (type) => {
    if (!user?.id) return;
    const updated = { ...reactions };
    const list = updated[type] || [];
    const idx = list.indexOf(user.id);
    if (idx >= 0) { list.splice(idx, 1); } else { list.push(user.id); }
    updated[type] = list;
    try {
      await base44.entities.ForumPost.update(post.id, { reactions: JSON.stringify(updated) });
      onUpdate?.();
    } catch {}
    setShowReactions(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await base44.entities.ForumPost.update(post.id, { is_deleted: true, body: "[deleted]" });
      onUpdate?.();
    } catch {}
    setShowMenu(false);
  };

  const roleBadge = getRoleBadge(post.author_role);

  return (
    <div className={`rounded-xl border p-4 ${isOP ? "border-primary/30 bg-primary/5" : "border-border/50 bg-card"}`}>
      {/* Quote block */}
      {post.quote_of_author && (
        <div className="border-l-2 border-primary/40 pl-3 mb-3 text-xs text-muted-foreground italic">
          <span className="font-semibold not-italic">{post.quote_of_author} said:</span>
          <p className="mt-0.5 line-clamp-3">{post.quote_of_body}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <button onClick={openProfile} className="shrink-0">
          {post.author_avatar ? (
            <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
              {(post.author_name || "A")[0]}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={openProfile} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
              {post.author_name || "Unknown"}
            </button>
            {post.author_callsign && <span className="text-xs text-primary">{post.author_callsign}</span>}
            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${roleBadge.color}`}>{roleBadge.label}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {timeAgo(post.created_date)}
            {post.edited_at && <span className="ml-1 italic">· edited</span>}
          </p>
        </div>
        {canModerate && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-lg shadow-xl py-1 w-36">
                {isAuthor && (
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted/50">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
                <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="forum-markdown text-sm text-foreground/90 leading-relaxed">
        <ReactMarkdown>{post.body || ""}</ReactMarkdown>
      </div>

      {/* Image */}
      {post.image_url && <img src={post.image_url} alt="" className="max-w-full rounded-lg mt-2 border border-border/30" />}

      {/* Nested reply indicator */}
      {post.reply_to_author && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
          <CornerDownRight className="w-3 h-3" /> Reply to {post.reply_to_author}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {Object.entries(reactions).map(([type, users]) => {
          if (!users || users.length === 0) return null;
          return (
            <button
              key={type}
              onClick={() => toggleReaction(type)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                user?.id && users.includes(user.id) ? "bg-primary/15 border-primary/30 text-primary" : "bg-muted/30 border-border/50 text-muted-foreground"
              }`}
            >
              <span>{REACTION_EMOJIS[type] || "👍"}</span>
              <span className="text-[10px] font-medium">{users.length}</span>
            </button>
          );
        })}
        <div className="relative">
          <button onClick={() => setShowReactions(!showReactions)} className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
            <Smile className="w-4 h-4" />
          </button>
          {showReactions && (
            <div className="flex items-center gap-1 absolute left-0 top-8 z-20 bg-popover border border-border rounded-full shadow-xl px-2 py-1">
              {QUICK_REACTIONS.map((r) => (
                <button key={r} onClick={() => toggleReaction(r)} className="text-lg hover:scale-125 transition-transform">
                  {REACTION_EMOJIS[r]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        {onReply && (
          <button onClick={() => onReply(post)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-2 py-0.5">
            <Reply className="w-3 h-3" /> Reply
          </button>
        )}
        {onQuote && (
          <button onClick={() => onQuote(post)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-2 py-0.5">
            <Quote className="w-3 h-3" /> Quote
          </button>
        )}
      </div>
    </div>
  );
}