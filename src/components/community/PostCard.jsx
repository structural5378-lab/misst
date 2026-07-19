import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Reply, Quote, MoreHorizontal, Edit2, Trash2, CornerDownRight, Link2, Share2, Flag, Copy, Paperclip } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { timeAgo, parseJSON } from "@/lib/forumUtils";
import PostProfileSidebar from "./PostProfileSidebar";
import ReactionBar from "./ReactionBar";

export default function PostCard({ post, thread, user, isOP = false, onReply, onQuote, onMultiQuote, multiQuoted, isAdmin, onUpdate, onOpenProfile, onCopyLink, onReport }) {
  const [showMenu, setShowMenu] = useState(false);
  const isAuthor = user?.id === post.author_id;
  const canModerate = isAdmin || isAuthor;
  const attachments = parseJSON(post.attachments, []);

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await base44.entities.ForumPost.update(post.id, { is_deleted: true, body: "[deleted]" });
      onUpdate?.();
    } catch {}
    setShowMenu(false);
  };

  const handleRestore = async () => {
    await base44.entities.ForumPost.update(post.id, { is_deleted: false });
    onUpdate?.();
  };

  if (post.is_deleted) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/40 p-3 text-center text-xs text-muted-foreground italic">
        <Trash2 className="w-3 h-3 inline mr-1" /> This post was deleted
        {isAdmin && <button onClick={handleRestore} className="ml-2 text-primary hover:underline not-italic">Restore</button>}
      </div>
    );
  }

  return (
    <div id={`post-${post.id}`} className={`rounded-xl border p-3 sm:p-4 msg-in ${isOP ? "border-primary/30 bg-primary/5" : "border-border/50 bg-card"}`}>
      {post.quote_of_author && (
        <div className="border-l-2 border-primary/40 pl-3 mb-3 text-xs text-muted-foreground italic">
          <span className="font-semibold not-italic">{post.quote_of_author} said:</span>
          <p className="mt-0.5 line-clamp-3">{post.quote_of_body}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <PostProfileSidebar post={post} onOpenProfile={onOpenProfile} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
              <span>{isOP ? "Original Post" : "Reply"}</span>
              <span>·</span>
              <span>{timeAgo(post.created_date)}</span>
              {post.edited_at && <span className="italic">· edited</span>}
              {post.reply_to_author && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><CornerDownRight className="w-2.5 h-2.5" />{post.reply_to_author}</span>
                </>
              )}
            </div>
            {canModerate && (
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-8 z-30 bg-popover border border-border rounded-lg shadow-xl py-1 w-40">
                      {isAuthor && <MenuBtn icon={Edit2} label="Edit" />}
                      {onMultiQuote && (
                        <MenuBtn icon={Copy} label={multiQuoted ? "Remove from quote" : "Add to quote"} onClick={() => { onMultiQuote(post); setShowMenu(false); }} />
                      )}
                      <MenuBtn icon={Link2} label="Copy link" onClick={() => { onCopyLink?.(post); setShowMenu(false); }} />
                      <MenuBtn icon={Share2} label="Share" onClick={() => setShowMenu(false)} />
                      <MenuBtn icon={Flag} label="Report" onClick={() => { onReport?.(post); setShowMenu(false); }} />
                      <div className="border-t border-border/50 my-1" />
                      <MenuBtn icon={Trash2} label="Delete" danger onClick={handleDelete} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="forum-markdown text-sm text-foreground/90 leading-relaxed">
            <ReactMarkdown>{post.body || ""}</ReactMarkdown>
          </div>

          {post.image_url && (
            <img src={post.image_url} alt="" className="max-w-full rounded-lg mt-2 border border-border/30" />
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/40 border border-border/50 text-primary hover:bg-secondary/60">
                  <Paperclip className="w-3 h-3" /> {a.name || "attachment"}
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <ReactionBar post={post} user={user} onUpdate={onUpdate} />
            <div className="flex-1" />
            {onReply && <ActionBtn icon={Reply} label="Reply" onClick={() => onReply(post)} />}
            {onQuote && <ActionBtn icon={Quote} label="Quote" onClick={() => onQuote(post)} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuBtn({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs ${danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-muted/50"}`}>
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}

function ActionBtn({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-2 py-1">
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}