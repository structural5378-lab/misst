import React from "react";
import { motion } from "framer-motion";

export default function ChatTypingBubble({ name }) {
  return (
    <div className="flex items-end gap-2 my-1">
      <div className="w-7 shrink-0" />
      <div className="flex flex-col items-start">
        {name && (
          <span className="text-[11px] font-medium text-violet-400 mb-0.5 ml-1">{name}</span>
        )}
        <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}