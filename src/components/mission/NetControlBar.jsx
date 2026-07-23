import React from "react";
import { Play, Pause, Square, Plus, RotateCcw } from "lucide-react";

export default function NetControlBar({ session, onStart, onPause, onResume, onEnd, onManual, disabled }) {
  const status = session?.status;
  return (
    <div className="flex gap-2">
      {!session ? (
        <button onClick={onStart} disabled={disabled} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50 shadow-lg shadow-violet-500/30">
          <Play className="w-4 h-4" /> Start Net
        </button>
      ) : (
        <>
          {status === "active" ? (
            <button onClick={onPause} className="flex-1 py-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
              <Pause className="w-4 h-4" /> Pause
            </button>
          ) : (
            <button onClick={onResume} className="flex-1 py-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
              <RotateCcw className="w-4 h-4" /> Resume
            </button>
          )}
          <button onClick={onManual} className="flex-1 py-3.5 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
            <Plus className="w-4 h-4" /> Check-in
          </button>
          <button onClick={onEnd} className="flex-1 py-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
            <Square className="w-4 h-4" /> End Net
          </button>
        </>
      )}
    </div>
  );
}