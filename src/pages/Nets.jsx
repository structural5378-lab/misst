import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/layout/PageHeader";
import PublicNetCard from "@/components/nets/PublicNetCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio } from "lucide-react";

// Nets — public schedule. View + join only. No create/edit/delete/admin controls
// (those live in the Net Control dashboard). Tabs: Upcoming / Today / Weekly /
// Favorites. Live nets show a LIVE NOW badge and accept check-ins.
export default function Nets() {
  const [tab, setTab] = useState("upcoming");

  const { data: nets = [], isLoading } = useQuery({
    queryKey: ["nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 200),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["net-sessions-active"],
    queryFn: () => base44.entities.NetSession.list("-started_at", 200),
    refetchInterval: 15000,
  });

  // live nets: have an active/paused session
  const liveByNet = useMemo(() => {
    const m = new Map();
    for (const s of sessions || []) {
      if (s.status === "active" || s.status === "paused") m.set(s.net_id, s);
    }
    return m;
  }, [sessions]);

  // public nets: active status only (hide disabled/archived)
  const publicNets = (nets || []).filter((n) => (n.status || "active") === "active");

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const filtered = useMemo(() => {
    if (tab === "favorites") return publicNets.filter((n) => n.is_favorite);
    if (tab === "today") return publicNets.filter((n) => {
      if (liveByNet.has(n.id)) return true;
      const days = (() => { try { return JSON.parse(n.days || "[]"); } catch { return []; } })();
      return n.day_of_week === todayName || (Array.isArray(days) && days.includes(todayName));
    });
    if (tab === "weekly") {
      const order = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      return [...publicNets].sort((a, b) => {
        const da = order.indexOf(a.day_of_week || "Sunday");
        const db = order.indexOf(b.day_of_week || "Sunday");
        return da - db;
      });
    }
    // upcoming: not live, sorted soonest first (simple by name/time)
    return publicNets.filter((n) => !liveByNet.has(n.id));
  }, [publicNets, tab, liveByNet, todayName]);

  return (
    <div>
      <PageHeader title="Nets" showBack />
      <div className="px-4 pt-3 space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary/50 w-full grid grid-cols-4">
            <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
            <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">Favorites</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No nets {tab === "favorites" ? "favorited" : "scheduled"} yet</p>
            </div>
          ) : (
            filtered.map((n) => (
              <PublicNetCard key={n.id} net={n} liveSession={liveByNet.get(n.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}