import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell, Radio } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";
import StatusBadge from "@/components/ui/StatusBadge";
import UserStatsBar from "@/components/dashboard/UserStatsBar";
import QuickAccessGrid from "@/components/dashboard/QuickAccessGrid";
import UpcomingNetsPreview from "@/components/dashboard/UpcomingNetsPreview";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: nets } = useQuery({
    queryKey: ["nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 5),
    initialData: [],
  });

  const callsign = user?.callsign || "MIST User";
  const location = user?.location || "GMRS Community";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <img src={LOGO_URL} alt="Insomniacs GMRS" className="h-10 w-auto object-contain" />
        <Link to="/alerts" className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground relative">
          <Bell className="w-5 h-5" />
        </Link>
      </header>

      <div className="px-4 space-y-5 pb-4">
        {/* User Card */}
        <div className="p-4 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-background border-2 border-primary/30 overflow-hidden flex items-center justify-center">
              <img src={LOGO_URL} alt="Insomniacs GMRS" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{callsign}</span>
                <StatusBadge status="online" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{location}</p>
              <p className="text-xs text-muted-foreground">GMRS Operator</p>
            </div>
          </div>
          <div className="mt-3">
            <Link to="/profile" className="text-xs text-primary font-medium hover:underline">
              View Profile
            </Link>
          </div>
        </div>

        {/* Stats */}
        <UserStatsBar reputation={user?.reputation || 0} badges={user?.badges || 0} forums={user?.forum_count || 0} />

        {/* Quick Access */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Access</h3>
          <QuickAccessGrid />
        </div>

        {/* Upcoming Nets */}
        <UpcomingNetsPreview nets={nets} />
      </div>
    </div>
  );
}