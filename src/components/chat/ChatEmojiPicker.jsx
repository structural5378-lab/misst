import React from "react";

const EMOJIS = [
  "😀","😂","🥰","😎","🤔","😢","😡","👍",
  "👎","❤️","🔥","🎉","👏","🙏","💯","🚀",
  "📻","📡","⚡","✅","❌","⚠️","📍","🌤️",
  "👀","💪","🤝","👋","😅","🥳","😴","🤷",
];

export default function ChatEmojiPicker({ onPick }) {
  return (
    <div className="px-3 py-2 border-t border-border bg-card max-h-44 overflow-y-auto">
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onPick(emoji)}
            className="text-2xl p-1.5 rounded-lg hover:bg-secondary active:scale-90 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}