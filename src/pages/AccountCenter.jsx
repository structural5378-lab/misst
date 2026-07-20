import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMistUser } from "@/hooks/useMistUser";
import {
  User, Settings, Shield, Bell, Eye, Palette, Radio,
  Users as UsersIcon, Image as ImageIcon, Monitor, Database,
} from "lucide-react";

import AccountProfile from "@/components/account/sections/AccountProfile";
import AccountSettings from "@/components/account/sections/AccountSettings";
import AccountSecurity from "@/components/account/sections/AccountSecurity";
import AccountNotifications from "@/components/account/sections/AccountNotifications";
import AccountPrivacy from "@/components/account/sections/AccountPrivacy";
import AccountAppearance from "@/components/account/sections/AccountAppearance";
import AccountRadio from "@/components/account/sections/AccountRadio";
import AccountCommunity from "@/components/account/sections/AccountCommunity";
import AccountMedia from "@/components/account/sections/AccountMedia";
import AccountSessions from "@/components/account/sections/AccountSessions";
import AccountData from "@/components/account/sections/AccountData";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User, Component: AccountProfile },
  { id: "account", label: "Account", icon: Settings, Component: AccountSettings },
  { id: "security", label: "Security", icon: Shield, Component: AccountSecurity },
  { id: "notifications", label: "Notifications", icon: Bell, Component: AccountNotifications },
  { id: "privacy", label: "Privacy", icon: Eye, Component: AccountPrivacy },
  { id: "appearance", label: "Appearance", icon: Palette, Component: AccountAppearance },
  { id: "radio", label: "Radio Profile", icon: Radio, Component: AccountRadio },
  { id: "community", label: "Community", icon: UsersIcon, Component: AccountCommunity },
  { id: "media", label: "Media", icon: ImageIcon, Component: AccountMedia },
  { id: "sessions", label: "Sessions", icon: Monitor, Component: AccountSessions },
  { id: "data", label: "Data & Privacy", icon: Database, Component: AccountData },
];

export default function AccountCenter() {
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [active, setActive] = useState("profile");
  const { mistUser } = useMistUser();
  const Current = SECTIONS.find((s) => s.id === active)?.Component || AccountProfile;

  const NavButton = ({ s }) => {
    const Icon = s.icon;
    const on = active === s.id;
    return (
      <button
        onClick={() => setActive(s.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          on ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{s.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header
        className={isDesktop ? "sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border" : "bg-background border-b border-border"}
      >
        <div className="flex items-center gap-3 h-14 px-4">
          <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {mistUser.avatarUrl ? (
              <img src={mistUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (mistUser.displayName || "M").charAt(0)
            )}
          </div>
          <h1 className="text-base font-bold text-foreground">Account Center</h1>
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">{mistUser.displayName}</span>
        </div>
        {!isDesktop && (
          <div className="flex gap-1 px-2 pb-2 overflow-x-auto scrollbar-hide">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const on = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {isDesktop ? (
        <div className="flex max-w-6xl mx-auto">
          <aside className="w-60 shrink-0 border-r border-border h-[calc(100dvh-3.5rem)] sticky top-14 overflow-y-auto p-3 space-y-0.5">
            {SECTIONS.map((s) => <NavButton key={s.id} s={s} />)}
          </aside>
          <main className="flex-1 min-w-0 h-[calc(100dvh-3.5rem)] overflow-y-auto p-6">
            <Current />
          </main>
        </div>
      ) : (
        <main className="p-4 max-w-2xl mx-auto">
          <Current />
        </main>
      )}
    </div>
  );
}