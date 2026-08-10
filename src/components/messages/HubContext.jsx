import { useEffect, useState } from "react";
import { X, Hash, Radio, Image as ImageIcon, Info, Shield, Wifi, Calendar, Activity, CloudLightning, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { mist } from '@/api/mist';
import { otherParticipant } from "@/lib/chatV2/chatV2Api";
import { presenceStatus, lastSeenLabel } from "@/lib/chatV2/chatV2Utils";

// HubContext — the context-sensitive right rail.
// For a channel: community info, online members, linked repeater, and a shared
// media grid. For a DM: the other participant's presence + shared media.
export default function HubContext({ sel, mistUser, community, members, myRole, presenceByUser, conversations, rooms, onClose }) {
  const [tab, setTab] = useState("members");
  const isChannel = sel?.type === "channel";
  const room = isChannel ? rooms.find((r) => r.id === sel.id) : null;
  const entry = !isChannel ? conversations.find((c) => c.conversation.id === sel.id) : null;
  const conversation = entry?.conversation;
  const other = conversation ? otherParticipant(conversation, mistUser?.id) : null;
  const otherPresence = other ? presenceByUser[other.id] : null;

  const onlineMembers = (isChannel ? members : [])
    .filter((m) => { const p = presenceByUser[m.user_id]; return p && presenceStatus(p) === "online"; });

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <header className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">{isChannel ? "Channel Info" : "Conversation Info"}</h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 -mr-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60">
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isChannel ? (
          <ChannelInfo community={community} room={room} members={members} onlineMembers={onlineMembers} myRole={myRole} tab={tab} setTab={setTab} />
        ) : (
          <DmInfo other={other} presence={otherPresence} conversation={conversation} />
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children, action }) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        </div>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function ChannelInfo({ community, room, members, onlineMembers, myRole, tab, setTab }) {
  if (!room || !community) return <div className="p-6 text-sm text-muted-foreground">No channel selected.</div>;
  const admins = members.filter((m) => ["community_owner", "community_admin"].includes(m.role));
  return (
    <>
      <div className="px-4 pt-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Hash className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">#{room.name}</h3>
            <p className="text-xs text-muted-foreground">{members.length} members · {onlineMembers.length} online</p>
          </div>
        </div>
        {room.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{room.description}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto scrollbar-hide">
        {["members", "media", "net", "weather", "events", "radio"].map((id) => (
          <button key={id} onClick={() => setTab(id)} className={`px-2.5 h-8 rounded-lg text-[12px] font-semibold transition-colors shrink-0 capitalize ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{id === "radio" ? "Radio" : id}</button>
        ))}
      </div>

      {tab === "members" && (
        <div>
          <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Online — {onlineMembers.length}</div>
          {onlineMembers.length === 0 && <p className="px-4 pb-3 text-xs text-muted-foreground">No one online right now.</p>}
          {onlineMembers.map((m) => <MemberRow key={m.user_id} m={m} online />)}
          {admins.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Administrators</div>
              {admins.map((m) => <MemberRow key={m.user_id} m={m} roleBadge />)}
            </>
          )}
        </div>
      )}

      {tab === "media" && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-secondary/40 border border-border flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">Shared media appears here as it's posted.</p>
        </div>
      )}

      {tab === "net" && <NetTab community={community} />}
      {tab === "weather" && <WeatherTab community={community} />}
      {tab === "events" && <EventsTab community={community} />}

      {tab === "radio" && (
        <div className="p-4 space-y-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Linked Repeater</span>
            </div>
            <Row label="Repeater" value={community.primary_repeater || "—"} />
            <Row label="Frequency" value={community.frequency ? `${community.frequency} MHz` : "—"} />
            <Row label="PL / DCS" value={community.pl_tone || "—"} />
            <Row label="Callsign" value={community.callsign || "—"} />
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Community</span>
            </div>
            <Row label="Name" value={community.name} />
            <Row label="Location" value={community.location || "—"} />
            <Row label="Members" value={members.length} />
          </div>
        </div>
      )}
    </>
  );
}

function DmInfo({ other, presence, conversation }) {
  const status = presenceStatus(presence);
  const dotColor = status === "online" ? "bg-emerald-400" : status === "away" ? "bg-amber-400" : "bg-muted-foreground/40";
  return (
    <>
      <div className="flex flex-col items-center text-center px-4 pt-6 pb-4 border-b border-border">
        {other?.avatar
          ? <img src={other.avatar} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20 mb-3" />
          : <div className="w-20 h-20 rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold mb-3">{(other?.name || "?")[0].toUpperCase()}</div>}
        <h3 className="text-base font-bold text-foreground">{other?.name || "Unknown"}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-xs text-muted-foreground">{lastSeenLabel(presence)}</span>
        </div>
        {conversation?.is_group && <p className="text-xs text-muted-foreground mt-1">Group conversation</p>}
      </div>
      <Section icon={ImageIcon} title="Shared Media">
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-secondary/40 border border-border flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function MemberRow({ m, online, roleBadge }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted/30 transition-colors">
      <div className="relative shrink-0">
        {m.user_avatar ? <img src={m.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-semibold">{(m.user_name || "?")[0].toUpperCase()}</div>}
        {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{m.user_name || "Unknown"}</p>
        {m.user_callsign && <p className="text-[11px] text-muted-foreground truncate">{m.user_callsign}</p>}
      </div>
      {roleBadge && m.role === "community_owner" && (
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-full"><Shield className="w-2.5 h-2.5" />Owner</span>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium truncate ml-2">{value}</span>
    </div>
  );
}

function NetTab({ community }) {
  const [nets, setNets] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id) return;
    let alive = true;
    setLoading(true);
    mist.entities.Net.filter({ community_id: community.id, status: "active" }, "-created_date", 20)
      .then((r) => { if (alive) setNets(r || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [community?.id]);
  if (loading) return <div className="p-6 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!nets.length) return <p className="p-6 text-sm text-muted-foreground text-center">No active nets right now.</p>;
  return (
    <div className="p-3 space-y-2">
      {nets.map((n) => (
        <Link key={n.id} to={`/nets/${n.id}/control`} className="block rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 hover:brightness-125 transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-foreground truncate">{n.name}</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mist-pulse-ring" />LIVE</span>
          </div>
          {n.frequency && <Row label="Frequency" value={`${n.frequency} MHz`} />}
          {n.primary_net_control && <Row label="Net Control" value={n.primary_net_control} />}
          {n.time && <Row label="Time" value={n.time} />}
        </Link>
      ))}
    </div>
  );
}

function WeatherTab({ community }) {
  const [wx, setWx] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id) return;
    let alive = true;
    setLoading(true);
    base44.functions.invoke("getWeatherData", { community_id: community.id, lat: community.location_lat, lon: community.location_lon })
      .then((r) => { if (alive) setWx(r); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [community?.id]);
  if (loading) return <div className="p-6 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  const temp = wx?.temp ?? wx?.temperature;
  return (
    <div className="p-3 space-y-3">
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
        <div className="rs-tile-radar h-20 rounded-lg border border-sky-500/20 bg-slate-900/50 mb-2" />
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">{temp != null ? `${Math.round(temp)}°` : "—"}</span>
          <span className="text-xs text-muted-foreground text-right">{wx?.condition || wx?.conditions || wx?.summary || "—"}</span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
        {wx?.humidity != null && <Row label="Humidity" value={`${wx.humidity}%`} />}
        {wx?.wind_speed != null && <Row label="Wind" value={`${wx.wind_speed} ${wx.wind_unit || "mph"}`} />}
        {community?.location && <Row label="Location" value={community.location} />}
      </div>
    </div>
  );
}

function EventsTab({ community }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!community?.id) return;
    let alive = true;
    setLoading(true);
    mist.entities.Event.filter({ community_id: community.id }, "-created_date", 20)
      .then((r) => { if (alive) setEvents(r || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [community?.id]);
  if (loading) return <div className="p-6 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!events.length) return <p className="p-6 text-sm text-muted-foreground text-center">No upcoming events.</p>;
  return (
    <div className="p-3 space-y-2">
      {events.map((e) => (
        <div key={e.id} className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-violet-300" />
            <span className="text-sm font-bold text-foreground truncate">{e.title || e.name || "Event"}</span>
          </div>
          {e.start_date && <Row label="Date" value={e.start_date} />}
          {e.location && <Row label="Location" value={e.location} />}
          {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
        </div>
      ))}
    </div>
  );
}