import { MessageSquare, Plus } from "lucide-react";

// HubEmpty — the pre-selection state for the center pane.
export default function HubEmpty({ onNewMessage }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-gradient-to-b from-background to-secondary/20">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl mist-fab-halo" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 flex items-center justify-center">
          <MessageSquare className="w-9 h-9 text-violet-300" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1.5">MISST Messaging</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Select a channel or direct message to start chatting, or begin a new conversation.
      </p>
      <button
        onClick={onNewMessage}
        className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:brightness-110 active:scale-95 transition-all"
      >
        <Plus className="w-4 h-4" /> New Message
      </button>
    </div>
  );
}