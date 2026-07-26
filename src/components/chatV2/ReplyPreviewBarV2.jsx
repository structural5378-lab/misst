import { X, CornerUpRight } from "lucide-react";

// ReplyPreviewBarV2 — shown above the composer while composing a reply.
function Avatar({ name, avatar }) {
  if (avatar) return <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />;
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-secondary-foreground">{initials}</div>;
}

export default function ReplyPreviewBarV2({ replyTo, onCancel }) {
  if (!replyTo) return null;
  return (
    <div className="flex items-center gap-2 px-3 pt-2.5 pb-1 max-w-4xl mx-auto w-full">
      <CornerUpRight className="w-4 h-4 text-primary shrink-0" />
      <Avatar name={replyTo.sender_name} avatar={replyTo.sender_avatar} />
      <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
        <p className="text-[11px] font-semibold text-primary">Replying to {replyTo.sender_name || "Unknown"}</p>
        <p className="text-xs text-muted-foreground truncate">{replyTo.body || "Deleted message"}</p>
      </div>
      <button onClick={onCancel} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60" aria-label="Cancel reply">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}