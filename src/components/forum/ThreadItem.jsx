import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";

export default function ThreadItem({ thread }) {
  return (
    <Link
      to={`/forums/thread/${thread.id}`}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">{thread.title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          {thread.category_name} · {thread.reply_count || 0} replies
        </p>
      </div>
      <div className="flex items-center gap-1 ml-3 shrink-0 bg-primary/10 rounded-full px-2.5 py-1">
        <MessageSquare className="w-3 h-3 text-primary" />
        <span className="text-xs font-semibold text-primary">{thread.reply_count || 0}</span>
      </div>
    </Link>
  );
}