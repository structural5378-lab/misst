import React from "react";
import { Mail } from "lucide-react";

export default function MyBBConversationList({ pms, onSelect, onCompose }) {
  if (pms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No messages yet</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Send a private message to a forum member</p>
        <button
          onClick={onCompose}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          New Message
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.05]">
      {pms.map((pm) => {
        const unread = pm.readtime === "0" || pm.readtime === 0;
        const date = pm.dateline
          ? new Date(parseInt(pm.dateline) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "";

        return (
          <button
            key={pm.pmid}
            onClick={() => onSelect(pm)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-violet-400">
                {(pm.fromuser || "?")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                  {pm.fromuser || "Unknown"}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{date}</span>
              </div>
              <p className={`text-xs truncate mt-0.5 ${unread ? "text-foreground/70" : "text-muted-foreground"}`}>
                {pm.subject}
              </p>
            </div>
            {unread && <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}