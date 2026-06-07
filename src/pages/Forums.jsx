import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";
import ThreadItem from "@/components/forum/ThreadItem";
import CategoryCard from "@/components/forum/CategoryCard";

export default function Forums() {
  const [search, setSearch] = useState("");

  const { data: threads } = useQuery({
    queryKey: ["forum-threads"],
    queryFn: () => base44.entities.ForumThread.list("-created_date", 20),
    initialData: [],
  });

  const { data: categories } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: () => base44.entities.ForumCategory.list("sort_order", 20),
    initialData: [],
  });

  const unreadThreads = threads.filter((t) => !t.is_read);

  return (
    <div>
      <PageHeader title="Forum" showBack />
      <div className="px-4 pt-3 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search forums..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50 h-10"
          />
        </div>

        {/* Unread Threads */}
        {unreadThreads.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Unread Threads</h3>
            <div className="space-y-1 bg-card rounded-xl border border-border/50 overflow-hidden">
              {unreadThreads.slice(0, 5).map((thread) => (
                <ThreadItem key={thread.id} thread={thread} />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Forum Categories</h3>
          <div className="space-y-2 pb-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}