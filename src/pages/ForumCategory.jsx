import React from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import ThreadItem from "@/components/forum/ThreadItem";

export default function ForumCategoryPage() {
  const { id } = useParams();

  const { data: threads, isLoading } = useQuery({
    queryKey: ["category-threads", id],
    queryFn: () => base44.entities.ForumThread.filter({ category_id: id }, "-created_date", 50),
    initialData: [],
  });

  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const list = await base44.entities.ForumCategory.filter({ id });
      return list[0];
    },
  });

  return (
    <div>
      <PageHeader 
        title={category?.name || "Category"} 
        showBack
        rightAction={
          <Link to={`/forums/new?category=${id}`}>
            <Button size="sm" variant="ghost" className="text-primary">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
        }
      />
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No threads in this category</p>
        ) : (
          <div className="space-y-1 bg-card rounded-xl border border-border/50 overflow-hidden">
            {threads.map((t) => (
              <ThreadItem key={t.id} thread={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}