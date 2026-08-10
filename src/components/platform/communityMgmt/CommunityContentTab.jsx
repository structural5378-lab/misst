import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { mist } from '@/api/mist';
import { Button } from "@/components/ui/button";
import { Pin, PinOff, Lock, Unlock, Star, Trash2, MessageSquare, Radio, CalendarClock, RadioTower } from "lucide-react";

function Row({ item, type, communityId, onChanged }) {
  const [busy, setBusy] = useState(false);
  const run = async (action) => {
    setBusy(true);
    try {
      await base44.functions.invoke("adminManageCommunity", { action, community_id: communityId, entity_type: type, entity_id: item.id });
      onChanged();
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Failed");
    }
    setBusy(false);
  };
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
          {item.is_pinned && <Pin className="w-3 h-3 text-primary" />}
          {item.is_locked && <Lock className="w-3 h-3 text-warning" />}
          {item.is_featured && <Star className="w-3 h-3 text-amber-400" />}
          {item.title || item.name || item.callsign || "Untitled"}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{item.author_name || item.repeater_callsign || item.location || item.net_name || ""}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {type === "ForumThread" && (
          <>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy} onClick={() => run(item.is_pinned ? "content_unpin" : "content_pin")}>{item.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}</Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy} onClick={() => run(item.is_locked ? "content_unlock" : "content_lock")}>{item.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}</Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy} onClick={() => run(item.is_featured ? "content_unfeature" : "content_feature")}><Star className="w-3.5 h-3.5" /></Button>
          </>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={busy} onClick={() => { if (window.confirm("Delete this item?")) run("content_delete"); }}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, queryKey, queryFn, type, communityId, onChanged }) {
  const { data = [], isLoading } = useQuery({ queryKey, queryFn });
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Icon className="w-4 h-4" />{title} <span className="text-xs text-muted-foreground font-normal">({data.length})</span></h3>
      {isLoading
        ? <div className="py-4 text-center text-xs text-muted-foreground">Loading…</div>
        : data.length === 0
          ? <div className="py-4 text-center text-xs text-muted-foreground">No items.</div>
          : <div>{data.slice(0, 50).map((it) => <Row key={it.id} item={it} type={type} communityId={communityId} onChanged={onChanged} />)}</div>}
    </div>
  );
}

export default function CommunityContentTab({ community, onChanged }) {
  const qc = useQueryClient();
  const changed = () => { onChanged(); qc.invalidateQueries(["community-content", community.id]); };
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Section title="Forum Threads" icon={MessageSquare} queryKey={["community-content", community.id, "threads"]} queryFn={async () => (await mist.entities.ForumThread.filter({ community_id: community.id }, "-created_date", 500)) || []} type="ForumThread" communityId={community.id} onChanged={changed} />
      <Section title="Events" icon={CalendarClock} queryKey={["community-content", community.id, "events"]} queryFn={async () => (await mist.entities.Event.filter({ community_id: community.id }, "-created_date", 500)) || []} type="Event" communityId={community.id} onChanged={changed} />
      <Section title="Repeaters" icon={RadioTower} queryKey={["community-content", community.id, "repeaters"]} queryFn={async () => (await mist.entities.Repeater.filter({ community_id: community.id }, "-created_date", 500)) || []} type="Repeater" communityId={community.id} onChanged={changed} />
      <Section title="Nets" icon={Radio} queryKey={["community-content", community.id, "nets"]} queryFn={async () => (await mist.entities.Net.filter({ community_id: community.id }, "-created_date", 500)) || []} type="Net" communityId={community.id} onChanged={changed} />
    </div>
  );
}