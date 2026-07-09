import React from "react";
import ChatAvatar from "./ChatAvatar";

export default function ChatTypingBubble({ name, avatar }) {
  return (
    <div className="flex items-end gap-2 my-1">
      <ChatAvatar src={avatar} name={name} size="w-7 h-7" />
      <div className="flex flex-col items-start">
        {name && (
          <span className="text-[11px] font-medium text-violet-400 mb-0.5 ml-1">{name}</span>
        )}
        <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}