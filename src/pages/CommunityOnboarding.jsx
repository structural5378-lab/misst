import React, { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  Rocket, Users, Search, MapPin, Radio, Globe, Lock, Loader2, ArrowRight, Sparkles, SkipForward, SlidersHorizontal,
} from "lucide-react";
import CommunityDirectoryCard from "@/components/community/onboarding/CommunityDirectoryCard";
import JoinRequestSheet from "@/components/community/onboarding/JoinRequestSheet";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { CATEGORIES } from "@/components/community/wizard/StepBasics";

const SORTS = [
  { key: "members", label: "Most Members" },
  { key: "newest", label: "Newest" },
  { key: "near", label: "Near Me" },
];

function distanceMi(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lat2 == null) return Infinity;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CommunityOnboarding() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: memberships = [] } = useUserCommunities();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("members");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [requestCommunity, setRequestCommunity] = useState(null);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["public-communities"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listCommunities", {});
      return res.data?.communities || [];
    },
    staleTime: 60 * 1000,
  });

  // All of the user's membership records (incl. pending) to show status on cards.
  const { data: myMemberships = [] } = useQuery({
    queryKey: ["my-memberships-all"],
    queryFn: async () => {
      const u = await base44.auth.me().catch(() => null);
      if (!u) return [];
      return await base44.entities.CommunityMember.filter({ user_id: u.id });
    },
    staleTime: 15000,
  });

  const myStatusByCommunity = useMemo(() => {
    const map = {};
    myMemberships.forEach((m) => { map[m.community_id] = m.status; });
    return map;
  }, [myMemberships]);

  const filtered = useMemo(() => {
    let list = communities;
    if (category) list = list.filter((c) => c.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) =>
        [c.name, c.callsign, c.description, c.location, c.primary_repeater]
          .some((f) => (f || "").toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sort === "members") sorted.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    else if (sort === "newest") sorted.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    else if (sort === "near") {
      if (coords) sorted.sort((a, b) => distanceMi(coords.lat, coords.lon, a.location_lat, a.location_lon) - distanceMi(coords.lat, coords.lon, b.location_lat, b.location_lon));
    }
    return sorted;
  }, [communities, category, query, sort, coords]);

  // If the user already belongs to a community, onboarding is complete.
  if (memberships.length > 0) {
    return <Navigate to="/" replace />;
  }

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocating(false); setSort("near"); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleJoin = async (community) => {
    setBusyId(community.id);
    try {
      const res = await base44.functions.invoke("manageCommunityMembership", { action: "join", community_id: community.id });
      if (res.data?.success) {
        toast({ title: "Welcome aboard!", description: `You joined ${community.name}.` });
        localStorage.setItem("selected_community_id", community.id);
        localStorage.setItem("selected_community_name", community.name);
        localStorage.removeItem("onboarding_skipped");
        await qc.invalidateQueries({ queryKey: ["user-communities"] });
        window.location.href = `/c/${community.slug}/welcome`;
      } else {
        toast({ title: "Couldn't join", description: res.data?.error || "Try again later.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleRequestResolved = (community, status) => {
    setRequestCommunity(null);
    if (status === "active") {
      localStorage.setItem("selected_community_id", community.id);
      localStorage.setItem("selected_community_name", community.name);
      localStorage.removeItem("onboarding_skipped");
      window.location.href = `/c/${community.slug}/welcome`;
    } else {
      // Pending — stay on onboarding so they can browse more or create one.
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_skipped", "1");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[32rem] h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 mist-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Choose Your Community</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome to MISST</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Every MISST experience lives inside a community. Join an existing one, create your own, or skip for now with limited access.
          </p>
        </div>

        {/* Three options */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" })}
            className="mist-fade-up text-left rounded-3xl p-6 bg-card/60 border border-white/[0.08] backdrop-blur-xl hover:border-primary/30 transition-all"
            style={{ animationDelay: "60ms" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Join a Community</h2>
            <p className="text-sm text-muted-foreground mb-4">Browse the directory and join a public community, or request to join a private one.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Browse Communities <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          <Link
            to="/community/create"
            className="mist-fade-up text-left rounded-3xl p-6 bg-card/60 border border-white/[0.08] backdrop-blur-xl hover:border-accent/30 transition-all group"
            style={{ animationDelay: "120ms" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Create a Community</h2>
            <p className="text-sm text-muted-foreground mb-4">Launch a new community with default channels, roles, and settings ready to go.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2 transition-all">
              Start Setup <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <button
            onClick={handleSkip}
            className="mist-fade-up text-left rounded-3xl p-6 bg-card/40 border border-white/[0.06] backdrop-blur-xl hover:border-muted-foreground/30 transition-all"
            style={{ animationDelay: "180ms" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <SkipForward className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Skip for Now</h2>
            <p className="text-sm text-muted-foreground mb-4">Continue with limited access. You can join or create a community anytime later.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              Continue Limited <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* Directory */}
        <div id="directory" className="mist-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Community Directory
            </h3>
            <button onClick={locate} className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80">
              {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              {coords ? "Location on" : "Near me"}
            </button>
          </div>

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, callsign, repeater, city…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card/60 border border-white/[0.08] backdrop-blur-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl bg-card/60 border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-primary/40 appearance-none"
              >
                {SORTS.map((s) => <option key={s.key} value={s.key} className="bg-card">{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mb-4">
            <button
              onClick={() => setCategory("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!category ? "bg-primary text-primary-foreground" : "bg-card/60 border border-border text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(category === c.value ? "" : c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === c.value ? "bg-primary text-primary-foreground" : "bg-card/60 border border-border text-muted-foreground hover:text-foreground"}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-card/40 border border-white/[0.06] overflow-hidden">
                  <div className="h-24 bg-secondary/40 animate-pulse" />
                  <div className="p-4">
                    <div className="h-4 w-2/3 bg-secondary animate-pulse rounded mb-2" />
                    <div className="h-3 w-full bg-secondary/60 animate-pulse rounded mb-3" />
                    <div className="h-8 bg-secondary/40 animate-pulse rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-card/40 border border-white/[0.06]">
              <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {query || category ? "No communities match your filters." : "No communities are listed yet. Be the first — create one!"}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <CommunityDirectoryCard
                  key={c.id}
                  community={c}
                  coords={coords}
                  busy={busyId === c.id}
                  myStatus={myStatusByCommunity[c.id]}
                  onJoin={() => handleJoin(c)}
                  onRequest={(c) => setRequestCommunity(c)}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" /> You can skip for now, but full access requires joining a community.
        </p>
      </div>

      {requestCommunity && (
        <JoinRequestSheet
          community={requestCommunity}
          onClose={() => setRequestCommunity(null)}
          onJoined={handleRequestResolved}
        />
      )}
    </div>
  );
}