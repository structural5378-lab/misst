import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";
import RepeaterCard from "@/components/repeaters/RepeaterCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Repeaters() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: repeaters, isLoading } = useQuery({
    queryKey: ["repeaters"],
    queryFn: () => base44.entities.Repeater.list("-created_date", 50),
    initialData: [],
  });

  const filtered = repeaters.filter((r) => {
    const matchesSearch = !search || 
      r.callsign?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "all" || 
      (tab === "favorites" && r.is_favorite) ||
      (tab === "near_me");
    return matchesSearch && matchesTab;
  });

  return (
    <div>
      <PageHeader 
        title="Repeaters" 
        showBack 
        rightAction={
          <button className="p-2 text-muted-foreground">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        }
      />
      <div className="px-4 pt-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search repeaters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50 h-10"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-secondary/50 w-full grid grid-cols-3">
            <TabsTrigger value="near_me" className="text-xs">Near Me</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">Favorites</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">All Repeaters</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No repeaters found</p>
          ) : (
            filtered.map((r) => <RepeaterCard key={r.id} repeater={r} />)
          )}
        </div>
      </div>
    </div>
  );
}