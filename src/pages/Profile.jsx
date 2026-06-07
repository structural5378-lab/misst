import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Radio, Star, Award, MessageSquare, Settings, LogOut, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const callsign = user?.callsign || "MIST User";
  const bio = user?.bio || "GMRS operator and community member";

  return (
    <div>
      <PageHeader 
        title="Profile" 
        showBack 
        rightAction={
          <button className="p-2 text-muted-foreground">
            <Settings className="w-5 h-5" />
          </button>
        }
      />
      <div className="px-4 pt-4 space-y-4 pb-4">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-3">
            <Radio className="w-10 h-10 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{callsign}</h2>
            <StatusBadge status="online" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">GMRS Operator</p>
          <Button variant="ghost" size="sm" className="text-primary text-xs mt-1">
            <Edit className="w-3 h-3 mr-1" />
            Edit Profile
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Star, label: "Reputation", value: user?.reputation || 0 },
            { icon: Award, label: "Badges", value: user?.badges || 0 },
            { icon: MessageSquare, label: "Threads", value: user?.forum_count || 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center py-4 rounded-xl bg-card border border-border/50">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground mt-1">{label}</span>
            </div>
          ))}
        </div>

        {/* About Me */}
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-2">About Me</h3>
          <p className="text-sm text-muted-foreground">{bio}</p>
        </div>

        {/* Radio Setup */}
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-2">Radio Setup</h3>
          <ul className="space-y-1.5">
            {(user?.radios || ["No radios listed"]).map((radio, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                {radio}
              </li>
            ))}
          </ul>
        </div>

        {/* Member Since */}
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-1">Member Since</h3>
          <p className="text-sm text-muted-foreground">
            {user?.created_date ? new Date(user.created_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
          </p>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => base44.auth.logout("/")}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}