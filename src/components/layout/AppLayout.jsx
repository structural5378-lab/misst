import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import CommunitySelector from "./CommunitySelector";
import AlertPoller from "./AlertPoller";
import SimplexRequestPoller from "./SimplexRequestPoller";
import NotificationPrompt from "./NotificationPrompt";
import InstallBanner from "./InstallBanner";
import NotificationManager from "./NotificationManager";
import { base44 } from "@/api/base44Client";

export default function AppLayout() {
  const [dateTime, setDateTime] = useState(new Date());
  const [temp, setTemp] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTemp = async () => {
      try {
        const res = await base44.functions.invoke("getWeatherData", { lat: 28.5383, lon: -81.3792 });
        if (res.data?.temperature) setTemp(Math.round(res.data.temperature));
      } catch {}
    };
    fetchTemp();
    const interval = setInterval(fetchTemp, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const formatTime = (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDate(dateTime)}</span>
            <span className="text-violet-400">{formatTime(dateTime)}</span>
            {temp !== null && <span className="text-amber-400">{temp}°F</span>}
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