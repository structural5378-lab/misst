import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Smile, Plus } from "lucide-react";
import { parseJSON, REACTION_EMOJIS } from "@/lib/forumUtils";

const REACTIONS = ["like", "helpful", "informative", "funny", "thanks", "heart", "fire", "laugh"];

export default function ReactionBar({ post, user, onUpdate }) {
  const [open, setOpen] = useState(false);
  const reactions = parseJSON(post.reactions, {});

  const toggle = async (type) => {
    if (!user?.id) return;
    const updated = { ...reactions };
    const list = updated[type] || [];
    const idx = list.indexOf(user.id);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(user.id);
    updated[type] = list;
    try {
      await base44.entities.ForumPost.update(post.id, { reactions: JSON.stringify(updated) });
      onUpdate?.();
    } catch {}
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Object.entries(reactions).map(([type, users]) => {
        if (!users || users.length === 0) return null;
        const active = user?.id && users.includes(user.id);
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all active:scale-95 ${
              active ? "bg-primary/15 border-primary/30 text-primary" : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{REACTION_EMOJIS[type] || "👍"}</span>
            <span className="text-[10px] font-medium">{users.length}</span>
          </button>
        );
      })}
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-0.5 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
          <Smile className="w-4 h-4" />
          <Plus className="w-2.5 h-2.5" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="flex items-center gap-1 absolute left-0 top-9 z-30 bg-popover border border-border rounded-full shadow-xl px-2 py-1.5">
              {REACTIONS.map((r) => (
                <button key={r} onClick={() => toggle(r)} className="text-lg hover:scale-125 transition-transform" title={r}>
                  {REACTION_EMOJIS[r] || "👍"}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}