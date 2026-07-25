import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AdminSection from "@/components/platform/AdminSection";
import { LayoutTemplate, ExternalLink, FileCode, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

// Inventory of the app's primary routes (source of truth: src/App.jsx).
const ROUTES = [
  { path: "/", name: "Dashboard", group: "Core" },
  { path: "/repeaters", name: "Repeaters", group: "Radio" },
  { path: "/map", name: "Map View", group: "Radio" },
  { path: "/nets", name: "Nets", group: "Radio" },
  { path: "/messages", name: "Messages", group: "Social" },
  { path: "/alerts", name: "Alerts", group: "Social" },
  { path: "/live-chat", name: "Live Chat", group: "Social" },
  { path: "/gallery", name: "Gallery", group: "Content" },
  { path: "/members", name: "Members", group: "People" },
  { path: "/weather", name: "Weather", group: "Tools" },
  { path: "/cineplex", name: "Cineplex Mode", group: "Content" },
  { path: "/shopping", name: "Marketplace", group: "Content" },
  { path: "/radioscope", name: "RadioScope", group: "Radio" },
  { path: "/achievements", name: "Achievements", group: "Profile" },
  { path: "/leaderboard", name: "Leaderboard", group: "Profile" },
  { path: "/profile", name: "Operator Profile", group: "Profile" },
  { path: "/settings", name: "Settings", group: "Account" },
  { path: "/account", name: "Account Center", group: "Account" },
  { path: "/notifications", name: "Notifications", group: "Account" },
  { path: "/search", name: "Search", group: "Core" },
  { path: "/onboarding", name: "Community Onboarding", group: "Onboarding" },
  { path: "/community/create", name: "Create Community", group: "Onboarding" },
];

const GROUPS = ["Core", "Radio", "Social", "Content", "People", "Tools", "Profile", "Account", "Onboarding"];

export default function PlatformAdminAppBuilder() {
  const { data: flags = [] } = useQuery({
    queryKey: ["admin-feature-flags-mini"],
    queryFn: async () => (await base44.entities.FeatureFlag.list("-created_date", 200)) || [],
  });

  return (
    <AdminSection title="App Builder" description="Inventory of every app page and feature toggle — the app's navigation surface.">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Pages</p><p className="text-2xl font-bold mt-1">{ROUTES.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Page Groups</p><p className="text-2xl font-bold mt-1">{GROUPS.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Feature Flags</p><p className="text-2xl font-bold mt-1">{flags.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Stack</p><p className="text-lg font-bold mt-1">React + Vite</p></div>
      </div>

      {GROUPS.map((g) => (
        <div key={g} className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5" /> {g}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ROUTES.filter((r) => r.group === g).map((r) => (
              <Link key={r.path} to={r.path} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 hover:border-primary/40 transition-colors">
                <span className="flex items-center gap-2 min-w-0"><FileCode className="w-3.5 h-3.5 text-primary shrink-0" /><span className="text-sm font-medium text-foreground truncate">{r.name}</span><span className="text-[10px] text-muted-foreground font-mono truncate">{r.path}</span></span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl border border-border bg-card">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Visual drag-and-drop page editing runs in the Base44 Studio builder (this app's source). Feature availability per page is controlled via <Link to="/platform/admin/feature-flags" className="text-primary font-medium">Feature Flags</Link>.</p>
      </div>
    </AdminSection>
  );
}