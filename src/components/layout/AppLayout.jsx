import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import AlertPoller from "./AlertPoller";
import SimplexRequestPoller from "./SimplexRequestPoller";
import NotificationPrompt from "./NotificationPrompt";
import InstallBanner from "./InstallBanner";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full bg-violet-950/80 border-b border-violet-500/20 backdrop-blur-sm px-4 py-2 flex items-center justify-center">
        <span className="text-xs font-bold tracking-[0.2em] text-violet-300 uppercase">INSOMNIACSGMRS.COM</span>
      </div>
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
      <AlertPoller />
      <SimplexRequestPoller />
      <NotificationPrompt />
      <InstallBanner />
    </div>
  );
}