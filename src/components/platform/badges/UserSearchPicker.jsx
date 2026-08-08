import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X } from "lucide-react";

// UserSearchPicker — searchable platform-wide member picker.
// Reuses the existing searchUsers backend function (admins see email too).
// onSelect(user) fires with { id, full_name, callsign, mybb_username, avatar_url, email }.
// Pass `selected` to render the chosen user as a removable chip instead of the search box.
export default function UserSearchPicker({ onSelect, selected, placeholder = "Search by name, callsign, or email…" }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const Avatar = ({ u, size = "w-9 h-9" }) =>
    u.avatar_url
      ? <img src={u.avatar_url} alt="" className={`${size} rounded-full object-cover`} />
      : <div className={`${size} rounded-full bg-secondary flex items-center justify-center text-sm font-semibold`}>{(u.full_name || u.callsign || "?").slice(0, 1).toUpperCase()}</div>;

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 border border-border">
        <Avatar u={selected} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{selected.full_name || selected.mybb_username || "Unknown"}</p>
          <p className="text-xs text-muted-foreground truncate">{selected.callsign ? `${selected.callsign} · ` : ""}{selected.email || selected.id}</p>
        </div>
        <button onClick={() => { setQ(""); onSelect(null); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Change recipient"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full rounded-xl bg-background border border-input pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border/60">
        {loading && <p className="text-sm text-muted-foreground p-4 text-center">Searching…</p>}
        {!loading && !results.length && q.trim() && <p className="text-sm text-muted-foreground p-4 text-center">No members found.</p>}
        {!loading && !q.trim() && <p className="text-sm text-muted-foreground p-4 text-center">Type a name to search members.</p>}
        {results.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelect(u)}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 active:bg-primary/20 text-left transition-colors border-b border-border/40 last:border-0"
          >
            <Avatar u={u} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{u.full_name || u.mybb_username || "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">{u.callsign ? `${u.callsign} · ` : ""}{u.email}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}