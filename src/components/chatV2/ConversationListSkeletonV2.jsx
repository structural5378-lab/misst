// ConversationListSkeletonV2 — professional placeholder rows while the
// conversation list loads.
export default function ConversationListSkeletonV2({ count = 7 }) {
  return (
    <div className="flex-1 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3.5 border-b border-border/40 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-muted/50 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex justify-between gap-2">
              <div className="h-3.5 w-1/3 rounded bg-muted/50" />
              <div className="h-2.5 w-8 rounded bg-muted/40" />
            </div>
            <div className="h-3 w-3/4 rounded bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}