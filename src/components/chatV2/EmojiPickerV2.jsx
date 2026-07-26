import { useEffect, useRef } from "react";

// EmojiPickerV2 — compact, inline emoji grid for the composer. Inserts the
// chosen emoji (parent appends at cursor). Closes on outside click / Escape.
const EMOJIS = [
  "😀","😂","🤣","😊","😍","😎","🤩","😅","😉","🙃",
  "😭","😢","😡","🤔","😮","😴","🤯","🥳","😱","🤗",
  "👍","👎","👏","🙏","💪","👀","🎉","🔥","💯","❤️",
  "🧡","💛","💚","💙","💜","🤍","✨","⚡","🌟","👋",
];

export default function EmojiPickerV2({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [onClose]);
  return (
    <div ref={ref} className="sheet-fade absolute bottom-14 left-2 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover shadow-xl p-2 grid grid-cols-8 gap-0.5 max-h-56 overflow-y-auto">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onPick?.(e)}
          className="w-8 h-8 rounded-lg text-xl leading-none hover:bg-muted/60 flex items-center justify-center transition-colors"
          aria-label={`Insert ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}