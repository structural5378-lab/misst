import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Rocket, Users, Search, MapPin, Radio, Globe, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";
import CommunityDirectoryCard from "@/components/community/onboarding/CommunityDirectoryCard";
import { useUserCommunities } from "@/hooks/useUserCommunities";

export default function CommunityOnboarding() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: memberships = [] } = useUserCommunities();
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["public-communities"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listCommunities", {});
      return res.data?.communities || [];
    },
    staleTime: 60 * 1000,
  });

  // If the user already belongs to at least one community, they've completed onboarding.
  if (memberships.length > 0) {
    return <Navigate to="/" replace />;
  }

  const filtered = query.trim()
    ? communities.filter(c =>
        [c.name, c.callsign, c.description, c.location, c.primary_repeater]
          .some(f => (f || "").toLowerCase().includes(query.trim().toLowerCase()))
      )
    : communities;

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleJoin = async (community) => {
    const action = community.visibility === "public" ? "join" : "request";
    setBusyId(community.id);
    try {
      const res = await base44.functions.invoke("manageCommunityMembership", { action, community_id: community.id });
      if (res.data?.success) {
        if (action === "join") {
          toast({ title: "Welcome aboard!", description: `You joined ${community.name}.` });
          localStorage.setItem("selected_community_id", community.id);
          localStorage.setItem("selected_community_name", community.name);
          await qc.invalidateQueries({ queryKey: ["user-communities"] });
          window.location.href = `/c/${community.slug}`;
        } else {
          toast({ title: "Request sent", description: `Your request to join ${community.name} is pending approval.` });
          await qc.invalidateQueries({ queryKey: ["user-communities"] });
          window.location.href = `/c/${community.slug}`;
        }
      } else {
        toast({ title: "Couldn't join", description: res.data?.error || "Try again later.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
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
            <span className="text-xs font-semibold text-primary">Step 1 of 1 — Choose Your Community</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome to MIST</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Every MIST experience lives inside a community. Join an existing one or create your own to get started.
          </p>
        </div>

        {/* Two options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="mist-fade-up rounded-3xl p-6 bg-card/60 border border-white/[0.08] backdrop-blur-xl hover:border-primary/30 transition-all" style={{ animationDelay: "60ms" }}>
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Join an Existing Community</h2>
            <p className="text-sm text-muted-foreground mb-4">Browse the directory and join a public community, or request to join a private one.</p>
            <a href="#directory" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 transition-all">
              Browse Communities <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <Link to="/community/create" className="mist-fade-up rounded-3xl p-6 bg-card/60 border border-white/[0.08] backdrop-blur-xl hover:border-accent/30 transition-all group" style={{ animationDelay: "120ms" }}>
            <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Create My Community</h2>
            <p className="text-sm text-muted-foreground mb-4">Launch a new community with default channels, roles, and settings ready to go.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2 transition-all">
              Start Setup <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Directory */}
        <div id="directory" className="mist-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Community Directory
            </h3>
            <button onClick={locate} className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80">
              {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              {coords ? "Location on" : "Near me"}
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, callsign, repeater, city, or ZIP…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card/60 border border-white/[0.08] backdrop-blur-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-card/40 border border-white/[0.06]">
              <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {query ? "No communities match your search." : "No communities are listed yet. Be the first — create one!"}
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
                  onJoin={() => handleJoin(c)}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" /> You must belong to a community before accessing MIST.
        </p>
      </div>
    </div>
  );
}