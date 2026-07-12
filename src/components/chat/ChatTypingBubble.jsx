import React from "react";
import ChatAvatar from "./ChatAvatar";

export default function ChatTypingBubble({ name, avatar }) {
  return (
    <div className="flex items-end gap-2 my-1">
      <ChatAvatar src={avatar} name={name} size="w-9 h-9" />
      <div className="flex flex-col items-start">
        {name && (
          <span className="text-xs font-medium text-violet-400 mb-0.5 ml-1">{name}</span>
        )}
        <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3.5 flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}