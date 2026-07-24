import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, MessageSquarePlus, Hash, UserPlus, Users, Calendar, Radio, UserCircle2, Sparkles, ArrowRight, Share2, Loader2,
} from "lucide-react";

export default function CommunityWelcome() {
  const { slug } = useParams();

  const { data: community, isLoading } = useQuery({
    queryKey: ["welcome-community", slug],
    queryFn: async () => {
      const res = await base44.functions.invoke("getCommunityBySlug", { slug });
      return res.data?.community;
    },
    enabled: !!slug,
  });

  const handleInvite = async () => {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      if (navigator.share) await navigator.share({ title: community?.name || "Join my community", url });
      else await navigator.clipboard?.writeText(url);
    } catch {}
  };

  const actions = [
    { icon: LayoutDashboard, label: "View Dashboard", desc: "Your community home", to: `/c/${slug}`, color: "text-violet-400", bg: "bg-violet-500/10" },
    { icon: MessageSquarePlus, label: "Introduce Yourself", desc: "Post in the forum", to: `/c/${slug}/forum`, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { icon: Hash, label: "Explore Channels", desc: "Browse conversations", to: `/c/${slug}/chat`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: UserPlus, label: "Invite Friends", desc: "Share invite link", onClick: handleInvite, color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Users, label: "View Members", desc: "Meet the crew", to: `/c/${slug}/members`, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: Calendar, label: "Open Events", desc: "Upcoming events", to: `/c/${slug}/events`, color: "text-rose-400", bg: "bg-rose-500/10" },
    { icon: Radio, label: "Open Repeaters", desc: "Community repeaters", to: `/c/${slug}/repeaters`, color: "text-sky-400", bg: "bg-sky-500/10" },
    { icon: UserCircle2, label: "Complete Profile", desc: "Finish setup", to: "/account", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[32rem] h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8 mist-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">You're in!</span>
          </div>
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-secondary border-2 border-primary/30 mb-4 flex items-center justify-center">
            {community?.logo_url ? (
              <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-9 h-9 text-primary" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Welcome to {community?.name || "your community"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your community is all set up. Here are a few things you can do to get started.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {actions.map((a, i) => {
            const Icon = a.icon;
            const inner = (
              <>
                <div className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${a.color}`} />
                </div>
                <span className="text-sm font-semibold text-foreground text-center leading-tight">{a.label}</span>
                <span className="text-[11px] text-muted-foreground text-center mt-0.5">{a.desc}</span>
              </>
            );
            const cls = `flex flex-col items-center p-4 rounded-2xl bg-card/60 border border-white/[0.08] backdrop-blur-md hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95 mist-fade-up`;
            const style = { animationDelay: `${i * 50 + 80}ms` };
            return a.to ? (
              <Link key={a.label} to={a.to} className={cls} style={style}>{inner}</Link>
            ) : (
              <button key={a.label} onClick={a.onClick} className={cls} style={style}>{inner}</button>
            );
          })}
        </div>

        {/* CTA */}
        <Link
          to={`/c/${slug}`}
          className="mist-fade-up w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          style={{ animationDelay: "500ms" }}
        >
          Enter Dashboard <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          onClick={handleInvite}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share your community link
        </button>
      </div>
    </div>
  );
}