import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

// McvAiAssistant — AI Assistant (BETA) panel (right column bottom). Generates a
// concise net summary via InvokeLLM using live session data.
export default function McvAiAssistant({ v2 }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true);
    try {
      const s = await v2.generateSummary();
      setSummary(typeof s === "string" ? s : JSON.stringify(s));
    } catch {
      setSummary("Unable to generate summary.");
    } finally { setLoading(false); }
  };
  return (
    <div className="rounded-xl bg-[#15191e] border border-white/[0.06] p-3 space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Assistant <span className="text-[9px] text-violet-400/70 font-normal">BETA</span></h3>
      {summary ? <p className="text-[11px] text-foreground/90 whitespace-pre-wrap leading-relaxed">{summary}</p> : <p className="text-[11px] text-muted-foreground">Generate an AI summary of the current net session.</p>}
      <button onClick={generate} disabled={loading} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-500/30 text-xs font-bold disabled:opacity-50">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Generate Net Summary
      </button>
    </div>
  );
}