import React from "react";

const colorMap = {
  violet: "text-violet-400 bg-violet-500/10",
  cyan: "text-cyan-400 bg-cyan-500/10",
  emerald: "text-emerald-400 bg-emerald-500/10",
  amber: "text-amber-400 bg-amber-500/10",
  rose: "text-rose-400 bg-rose-500/10",
  blue: "text-blue-400 bg-blue-500/10",
};

export default function AdminStatCard({ icon: Icon, label, value, color = "violet", loading }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-card border border-border p-4 hover:border-violet-500/20 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.violet}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">
        {loading ? <span className="inline-block w-12 h-6 bg-muted rounded animate-pulse" /> : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}