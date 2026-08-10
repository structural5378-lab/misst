import React, { useCallback, useEffect, useState } from "react";
import { Search, Download, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";

// DeletedMessagesViewer — admin-only viewer for soft-deleted community chat
// messages. Server-gated by listDeletedMessages (community_owner/admin or
// platform admin). Regular members can never reach this. Supports search,
// room filter, date range, pagination, and CSV export.
export default function DeletedMessagesViewer({ community }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 25;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await mist.functions.invoke("listDeletedMessages", {
        community_id: community.id, search, room_id: roomId || undefined,
        date_from: dateFrom || undefined, date_to: dateTo || undefined, page: p, limit,
      });
      const data = res?.data || res || {};
      setItems(data.items || []);
      setTotal(data.total || 0);
      setHasMore(!!data.has_more);
      setPage(p);
    } catch (e) {
      toast({ title: "Failed to load", description: e?.response?.data?.error || e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [community.id, search, roomId, dateFrom, dateTo, toast]);

  useEffect(() => {
    mist.entities.ChatV2Room.filter({ community_id: community.id }, "order", 200)
      .then((r) => setRooms(r || [])).catch(() => {});
  }, [community.id]);

  useEffect(() => { load(1); }, [load]);

  const applyFilters = (e) => { e?.preventDefault(); load(1); };
  const resetFilters = () => { setSearch(""); setRoomId(""); setDateFrom(""); setDateTo(""); };

  const exportCsv = () => {
    const head = ["Message ID", "Author", "Room", "Body", "Deleted By", "Deleted At", "Reason"];
    const rows = items.map((m) => [
      m.id, m.sender_name || "", m.room_name || "",
      (m.body || "").replace(/"/g, '""'),
      m.deleted_by_name || "", m.deleted_at || "", m.deleted_reason || "",
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    const csv = [head.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `deleted-messages-${community.slug || community.id}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={applyFilters} className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search body, author, deleted by, reason…"
              className="w-full rounded-xl bg-secondary/50 border border-border pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}
            className="rounded-xl bg-secondary/50 border border-border px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">All rooms</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg bg-secondary/50 border border-border px-2 py-1.5 text-xs" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg bg-secondary/50 border border-border px-2 py-1.5 text-xs" />
          <button type="submit" className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">Apply</button>
          <button type="button" onClick={resetFilters} className="text-xs px-3 py-1.5 rounded-lg bg-secondary/60 text-secondary-foreground">Reset</button>
          <div className="flex-1" />
          <button type="button" onClick={exportCsv} disabled={!items.length}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary/60 text-secondary-foreground flex items-center gap-1.5 disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </form>

      <div className="text-xs text-muted-foreground">{total} deleted message{total === 1 ? "" : "s"}</div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <Trash2 className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No deleted messages found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground truncate">{m.sender_name || "Unknown"}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{m.room_name || "Room"}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-1.5">{m.body || "(empty)"}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span>Deleted by <span className="text-foreground font-medium">{m.deleted_by_name || "—"}</span></span>
                <span>{m.deleted_at ? new Date(m.deleted_at).toLocaleString() : "—"}</span>
                {m.deleted_reason && <span className="text-amber-400">Reason: {m.deleted_reason}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(total > limit) && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => load(page - 1)} disabled={page === 1 || loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-secondary/60 flex items-center gap-1 disabled:opacity-40">
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="text-xs text-muted-foreground">Page {page}</span>
          <button onClick={() => load(page + 1)} disabled={!hasMore || loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-secondary/60 flex items-center gap-1 disabled:opacity-40">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}