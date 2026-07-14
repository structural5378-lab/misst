import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import ThreadComposer from "@/components/community/ThreadComposer";
import { useAuth } from "@/lib/AuthContext";

export default function CommunityNewThread() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: () => base44.entities.ForumCategory.list("sort_order", 50),
    staleTime: 60000,
  });

  const handleSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
    navigate("/community-forum");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="text-primary p-1 -ml-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-foreground ml-2">New Discussion</h1>
        </div>
      </div>
      {categories.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-sm text-muted-foreground">No categories available yet. An admin needs to create forum categories first.</p>
        </div>
      ) : (
        <ThreadComposer
          categories={categories}
          user={user}
          onSubmitted={handleSubmitted}
          onCancel={() => navigate(-1)}
        />
      )}
    </div>
  );
}