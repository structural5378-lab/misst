import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio, Calendar, Pin, Image as ImageIcon, FileText, Users, Wifi } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { mist } from '@/api/mist';
import { presenceStatus } from "@/lib/chatV2/chatV2Utils";
import { Badge, roleBadge } from "./badges";

// CommunityViews — alternate views of the same community (not separate chats).
// Used by the conversation tab bar (mobile center) and the info panel sections.

function Spinner() { return <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>; }
function Empty({ icon: Icon, text }) { return <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><Icon className="w-8 h-8 mb-2 opacity-30" /><p className="text-xs">{text}</p></div>; }
function Row({ label, value }) { return <div className="flex items-center justify-between py-1 text-xs"><span className="text-muted-foreground">{label}</span><span className="text-foreground font-medium truncate ml-2">{value}</span></div>; }

async function fetchRoomContent(communityId, roomId, extra = {}, limit = 50) {
  const res = await base44.functions.invoke("listCommunityContent", {
    community_id: communityId, entity: "ChatV2RoomMessage", sort: "-created_date", limit,
    extra: { room_id: roomId, deleted: false, ...extra },
  });
  return (res?.data?.items || []).reverse();
}

export function MembersView({ members, presenceByUser }) {
  const list = members || [];
  const online = list.filter((m) => { const p = presenceByUser?.[m.user_id]; return p && presenceStatus(p) === "online"; });
  const onlineSet = new Set(online.map((m) => m.user_id));
  const sorted = [...list].sort((a, b) => (onlineSet.has(a.user_id) ? 0 : 1) - (onlineSet.has(b.user_id) ? 0 : 1));
  if (!sorted.length) return <Empty icon={Users} text="No members." />;
  return (
    <div className="p-1">
      {sorted.map((m) => {
        const isOnline = onlineSet.has(m.user_id);
        return (
          <div key={m.user_id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/30">
            <div className="relative shrink-0">
              {m.user_avatar ? <img src={m.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-semibold">{(m.user_name || "?")[0].toUpperCase()}</div>}
              {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{m.user_name}</p>
              {m.user_callsign && <p className="text-[11px] text-muted-foreground truncate">{m.user_callsign}</p>}
            </div>
            <Badge badge={roleBadge(m.role)} />
          </div>
        );
      })}
    </div>
  );
}

export function EventsView({ community }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id) return;
    let a = true; setLoading(true);
    mist.entities.Event.filter({ community_id: community.id }, "-created_date", 20).then((r) => a && setEvents(r || [])).catch(() => {}).finally(() => a && setLoading(false));
    return () => { a = false; };
  }, [community?.id]);
  if (loading) return <Spinner />;
  if (!events.length) return <Empty icon={Calendar} text="No upcoming events." />;
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-violet-300" /><span className="text-sm font-bold truncate">{e.title || e.name || "Event"}</span></div>
          {e.start_date && <Row label="Date" value={e.start_date} />}
          {e.location && <Row label="Location" value={e.location} />}
          {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
        </div>
      ))}
    </div>
  );
}

export function NetsView({ community }) {
  const [nets, setNets] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id) return;
    let a = true; setLoading(true);
    mist.entities.Net.filter({ community_id: community.id, status: "active" }, "-created_date", 20).then((r) => a && setNets(r || [])).catch(() => {}).finally(() => a && setLoading(false));
    return () => { a = false; };
  }, [community?.id]);
  if (loading) return <Spinner />;
  if (!nets.length) return <Empty icon={Radio} text="No active nets." />;
  return (
    <div className="space-y-2">
      {nets.map((n) => (
        <Link key={n.id} to={`/nets/${n.id}/control`} className="block rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 hover:brightness-125 transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold truncate">{n.name}</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />LIVE</span>
          </div>
          {n.frequency && <Row label="Frequency" value={`${n.frequency} MHz`} />}
          {n.primary_net_control && <Row label="Net Control" value={n.primary_net_control} />}
          {n.time && <Row label="Time" value={n.time} />}
        </Link>
      ))}
    </div>
  );
}

export function PinnedView({ community, room, onJump }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id || !room?.id) return;
    let a = true; setLoading(true);
    fetchRoomContent(community.id, room.id, { pinned: true }).then((r) => a && setItems(r)).catch(() => {}).finally(() => a && setLoading(false));
    return () => { a = false; };
  }, [community?.id, room?.id]);
  if (loading) return <Spinner />;
  if (!items.length) return <Empty icon={Pin} text="No pinned messages." />;
  return (
    <div className="space-y-2">
      {items.map((m) => (
        <button key={m.id} onClick={() => onJump?.(m.id)} className="w-full text-left rounded-xl border border-primary/30 bg-primary/10 p-3 hover:brightness-125 transition">
          <div className="flex items-center gap-2 mb-1"><Pin className="w-3.5 h-3.5 text-primary" /><span className="text-[11px] font-semibold text-muted-foreground">{m.sender_name}</span></div>
          <p className="text-sm line-clamp-3">{m.body}</p>
        </button>
      ))}
    </div>
  );
}

function attachmentUrl(m) { try { const a = JSON.parse(m.attachments || "[]"); return a[0]; } catch { return null; } }

export function MediaView({ community, room }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id || !room?.id) return;
    let a = true; setLoading(true);
    fetchRoomContent(community.id, room.id, {}, 50).then((r) => a && setItems(r.filter((m) => m.message_type === "image"))).catch(() => {}).finally(() => a && setLoading(false));
    return () => { a = false; };
  }, [community?.id, room?.id]);
  if (loading) return <Spinner />;
  if (!items.length) return <Empty icon={ImageIcon} text="No shared media yet." />;
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((m) => { const f = attachmentUrl(m); return (
        <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-secondary/40">
          {f?.url ? <img src={f.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground/30" /></div>}
        </div>
      ); })}
    </div>
  );
}

export function FilesView({ community, room }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id || !room?.id) return;
    let a = true; setLoading(true);
    fetchRoomContent(community.id, room.id, {}, 50).then((r) => a && setItems(r.filter((m) => m.message_type === "file"))).catch(() => {}).finally(() => a && setLoading(false));
    return () => { a = false; };
  }, [community?.id, room?.id]);
  if (loading) return <Spinner />;
  if (!items.length) return <Empty icon={FileText} text="No shared files yet." />;
  return (
    <div className="space-y-2">
      {items.map((m) => { const f = attachmentUrl(m); return (
        <a key={m.id} href={f?.url || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/30 p-2.5 hover:brightness-125 transition">
          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div>
          <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{f?.name || "File"}</p><p className="text-[11px] text-muted-foreground truncate">{m.sender_name}</p></div>
        </a>
      ); })}
    </div>
  );
}

export function RepeaterView({ community }) {
  const linked = !!(community?.primary_repeater || community?.frequency);
  return (
    <div className={`rounded-xl border p-3 ${linked ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-secondary/30"}`}>
      <div className="flex items-center gap-2 mb-2"><Wifi className={`w-4 h-4 ${linked ? "text-emerald-400" : "text-muted-foreground/60"}`} /><span className="text-xs font-bold">Linked Repeater</span></div>
      {linked ? (
        <>
          <Row label="Repeater" value={community.primary_repeater || "—"} />
          <Row label="Frequency" value={community.frequency ? `${community.frequency} MHz` : "—"} />
          <Row label="PL / DCS" value={community.pl_tone || "—"} />
          <Row label="Callsign" value={community.callsign || "—"} />
        </>
      ) : <p className="text-xs text-muted-foreground">No repeater linked.</p>}
    </div>
  );
}

export function StatsView({ community, members }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-border bg-secondary/30 p-3"><p className="text-2xl font-bold text-primary">{members?.length || 0}</p><p className="text-[11px] text-muted-foreground">Members</p></div>
      <div className="rounded-xl border border-border bg-secondary/30 p-3"><p className="text-2xl font-bold text-primary">{community?.member_count || members?.length || 0}</p><p className="text-[11px] text-muted-foreground">Total</p></div>
    </div>
  );
}