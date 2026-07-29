import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { startDirectConversation } from "@/lib/chatV2/chatV2Api";

// StartConversationDialog — search platform members and start a 1:1 DM.
// Uses the existing searchUsers backend function (service-role user search).
export default function StartConversationDialog({ open, onClose, onStarted, me }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) { setQ(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("searchUsers", { query: q.trim() });
        if (!cancelled) setResults(res?.data?.users || []);
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const pick = async (u) => {
    setStarting(u.id);
    setError(null);
    try {
      const { conversation, participant } = await startDirectConversation(u.id);
      onStarted?.(conversation, participant);
      onClose?.();
    } catch (e) {
      setError("Unable to start conversation. Please try again.");
    } finally {
      setStarting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, callsign, or username…"
            autoFocus
            className="w-full rounded-xl bg-secondary/50 border border-border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="max-h-80 overflow-y-auto -mx-1">
          {loading && <p className="text-sm text-muted-foreground p-4 text-center">Searching…</p>}
          {!loading && !results.length && q.trim() && <p className="text-sm text-muted-foreground p-4 text-center">No members found.</p>}
          {!loading && !q.trim() && <p className="text-sm text-muted-foreground p-4 text-center">Type a name to search members.</p>}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => pick(u)}
              disabled={starting === u.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 active:bg-primary/20 text-left transition-colors disabled:opacity-60"
            >
              {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">{(u.full_name || u.callsign || "?").slice(0, 1).toUpperCase()}</div>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{u.full_name || u.mybb_username || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.callsign ? `${u.callsign} · ` : ""}{u.email}</p>
              </div>
              {starting === u.id && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive text-center px-4 py-2">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}