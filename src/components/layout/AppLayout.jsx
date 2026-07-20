import React, { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMistUser } from "@/hooks/useMistUser";
import BottomNav from "./BottomNav";
import CommunitySelector from "./CommunitySelector";
import AlertPoller from "./AlertPoller";
import SimplexRequestPoller from "./SimplexRequestPoller";
import NotificationPrompt from "./NotificationPrompt";
import InstallBanner from "./InstallBanner";
import NotificationManager from "./NotificationManager";
import Clock from "./Clock";
import { Bell, User as UserIcon } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function AppLayout() {
  // Restore normal interface after orientation change or fullscreen exit
  useEffect(() => {
    const reset = () => {
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event("resize"));
    };
    const onVisibilityChange = () => {
      if (!document.hidden) setTimeout(reset, 100);
    };
    window.addEventListener("orientationchange", reset);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("orientationchange", reset);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const { data: weather } = useQuery({
    queryKey: ["weather-data"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getWeatherData", {});
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
  });
  const temp = weather?.current?.temp ?? null;
  const { data: unread = 0 } = useUnreadNotifications();
  const { mistUser } = useMistUser();

  // Desktop full-bleed routes (community + Account Center) drop the mobile chrome;
  // their own shells own the full viewport.
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const p = location.pathname;
  const isFullBleedDesktop =
    isDesktop &&
    (p === "/community-forum" || p.startsWith("/community/thread/") || p === "/community/new" || p === "/account");

  if (isFullBleedDesktop) {
    return (
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <Outlet />
        <NotificationManager />
        <AlertPoller />
        <SimplexRequestPoller />
        <NotificationPrompt />
        <InstallBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col w-full max-w-full overflow-x-hidden">
      <div className="w-full bg-violet-950/80 border-b border-violet-500/20 backdrop-blur-sm px-4 py-2 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a24d788be1af31b2258fab2/ef2f5095f_EA7D7629-51E2-49DA-AE8B-4017441D651F.png"
              alt="Logo"
              className="w-5 h-5 object-contain"
            />
            <span className="text-xs font-bold tracking-[0.2em] text-violet-300 uppercase">MISST</span>
          </div>
          <CommunitySelector />
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-1.5 text-violet-300 hover:text-violet-100" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link to="/account" className="relative p-1.5 text-violet-300 hover:text-violet-100" aria-label="Account Center">
              {mistUser?.avatarUrl ? (
                <img src={mistUser.avatarUrl} alt="Account" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </Link>
            <Clock temp={temp} />
          </div>
        </div>
      </div>
      <main className="pb-20 flex-1 w-full max-w-2xl mx-auto overflow-x-hidden">
        <Outlet />
      </main>
      <NotificationManager />
      <BottomNav />
      <AlertPoller />
      <SimplexRequestPoller />
      <NotificationPrompt />
      <InstallBanner />
    </div>
  );
}