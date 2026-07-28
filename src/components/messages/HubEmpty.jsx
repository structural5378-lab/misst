import { Radio, Plus, ShieldCheck } from "lucide-react";

// HubEmpty — the pre-selection state for the center pane. Reinforces MISST
// identity (radio / emergency comms) with a calm, premium empty surface.
export default function HubEmpty({ onNewMessage }) {
  return (
    <div className="mist-hub flex-1 flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 mist-empty-orb blur-2xl opacity-70" />
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-cyan-500/20 blur-2xl mist-fab-halo" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Radio className="w-9 h-9 text-cyan-300" />
        </div>
      </div>
      <div className="relative">
        <h2 className="text-xl font-bold text-foreground mb-1.5 tracking-tight">MISST Messaging</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-1 leading-relaxed">
          Purpose-built for GMRS, amateur radio, emergency communications, and community coordination.
        </p>
        <p className="text-xs text-muted-foreground/70 max-w-sm mb-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/80" /> Select a channel or start a new conversation.
        </p>
        <div className="flex justify-center">
          <button
            onClick={onNewMessage}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
      </div>
    </div>
  );
}