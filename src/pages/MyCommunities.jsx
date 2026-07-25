import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Check, ArrowLeft, Building2 } from "lucide-react";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { Button } from "@/components/ui/button";

export default function MyCommunities() {
  const { data: communities = [], isLoading } = useUserCommunities();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(localStorage.getItem("selected_community_id"));

  useEffect(() => {
    document.title = "My Communities · MISST";
  }, []);

  const switchTo = (c) => {
    localStorage.setItem("selected_community_id", c.id);
    localStorage.setItem("selected_community_name", c.name);
    setSelectedId(c.id);
    navigate(`/c/${c.slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> My Communities</h1>
            <p className="text-sm text-muted-foreground">Switch between communities you belong to.</p>
          </div>
        </div>

        {isLoading && <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>}

        {!isLoading && communities.length === 0 && (
          <div className="py-16 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">You haven't joined any communities yet.</p>
            <Link to="/onboarding"><Button className="mt-4" size="sm">Browse Communities</Button></Link>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => switchTo(c)}
                className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${active ? "border-primary/40 bg-primary/10" : "border-border bg-card hover:bg-muted"}`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.category || "Community"}{c.location ? ` · ${c.location}` : ""}</div>
                </div>
                {active && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}