import React, { useEffect } from "react";
import { Zap } from "lucide-react";

export default function XpToast({ amount, onDone }) {
  useEffect(() => {
    if (!amount) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [amount, onDone]);

  if (!amount) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] pointer-events-none">
      <div className="mist-fade-up flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_24px_rgba(168,85,247,0.6)] border border-white/20">
        <Zap className="w-4 h-4 text-white" />
        <span className="text-sm font-extrabold text-white tracking-wide">+{amount} XP</span>
      </div>
    </div>
  );
}