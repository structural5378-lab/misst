import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ChevronRight } from "lucide-react";

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/forums/category/${category.id}`}
      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{category.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
          {category.thread_count || 0}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}