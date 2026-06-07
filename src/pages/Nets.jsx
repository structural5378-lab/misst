import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/layout/PageHeader";
import NetCard from "@/components/nets/NetCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu } from "lucide-react";

export default function Nets() {
  const [tab, setTab] = useState("upcoming");

  const { data: nets, isLoading } = useQuery({
    queryKey: ["nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 50),
    initialData: [],
  });

  const filtered = tab === "favorites" 
    ? nets.filter((n) => n.is_favorite) 
    : nets;

  return (
    <div>
      <PageHeader title="Nets" showBack />
      <div className="px-4 pt-3 space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary/50 w-full grid grid-cols-3">
            <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">Favorites</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No nets found</p>
          ) : (
            filtered.map((n) => <NetCard key={n.id} net={n} />)
          )}
        </div>
      </div>
    </div>
  );
}