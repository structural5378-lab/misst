import { MessageSquare, Sparkles, Search } from "lucide-react";

// ChatV2EmptyState — polished empty screens for the three states.
export default function ChatV2EmptyState({ variant = "default", onNewChat }) {
  if (variant === "no-conversations") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[60vh]">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-1.5">Start your first conversation</h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Search for a member and say hello. Your chats will appear here.
        </p>
        {onNewChat && (
          <button onClick={onNewChat} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Start a new chat
          </button>
        )}
      </div>
    );
  }
  if (variant === "no-messages") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <p className="text-base font-medium text-foreground">Say hello! 👋</p>
        <p className="text-sm text-muted-foreground mt-1">No messages yet — break the ice.</p>
      </div>
    );
  }
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 min-h-[60vh]">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        <MessageSquare className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-1.5">Your messages</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Select a conversation or start a new one. Messages are delivered instantly when you're online.
      </p>
      {onNewChat && (
        <button onClick={onNewChat} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Search className="w-4 h-4" /> Start a new chat
        </button>
      )}
    </div>
  );
}