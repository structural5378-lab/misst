// TypingIndicatorV2 — animated "typing…" bubble / inline label.
export default function TypingIndicatorV2({ names = [], inline = false }) {
  if (!names.length) return null;
  const label = names.length === 1
    ? `${names[0]} is typing`
    : `${names.length} people are typing`;
  if (inline) {
    return (
      <div className="flex items-center gap-1.5 px-3 text-xs text-muted-foreground">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current" />
        <span className="ml-1">{label}…</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1 px-3 py-2 rounded-2xl bg-secondary/60 shadow-sm backdrop-blur">
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
      </div>
      <span className="text-xs text-muted-foreground">{label}…</span>
    </div>
  );
}