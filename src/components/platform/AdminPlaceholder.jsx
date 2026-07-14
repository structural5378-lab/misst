import React from "react";
import { Construction } from "lucide-react";

export default function AdminPlaceholder({ title, description, features = [] }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-violet-400" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {features.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}