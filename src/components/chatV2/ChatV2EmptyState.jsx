import { MessageSquare } from "lucide-react";

// ChatV2EmptyState — shown when no conversation is selected.
export default function ChatV2EmptyState({ onNewChat }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[60vh]">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        <MessageSquare className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-1.5">Your messages</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Select a conversation or start a new one. Messages delivered instantly when you're online.
      </p>
      {onNewChat && (
        <button
          onClick={onNewChat}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Start a new chat
        </button>
      )}
    </div>
  );
}