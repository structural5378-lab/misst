import { useEffect, useRef } from "react";

// ReactionPickerV2 — quick emoji reactions shown above a message on hover /
// long-press / context menu. Calls onPick(emoji) and onClose.
const QUICK = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function ReactionPickerV2({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);
  return (
    <div ref={ref} className="sheet-fade flex gap-0.5 p-1.5 rounded-full bg-popover border border-border shadow-xl">
      {QUICK.map((e) => (
        <button
          key={e}
          onClick={() => onPick?.(e)}
          className="w-9 h-9 rounded-full text-xl flex items-center justify-center hover:bg-muted/60 hover:scale-125 transition-transform"
          aria-label={`React ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}