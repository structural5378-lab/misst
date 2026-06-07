import React from "react";
import { Link } from "react-router-dom";
import { Radio, MessageSquare, Users, Bell, ChevronRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

const options = [
  { icon: Radio, label: "Add Repeater", desc: "Register a new repeater", path: "/repeaters", color: "text-primary" },
  { icon: MessageSquare, label: "New Thread", desc: "Start a forum discussion", path: "/forums/new", color: "text-blue-400" },
  { icon: Users, label: "Create Net", desc: "Schedule a new net", path: "/nets", color: "text-purple-400" },
  { icon: Bell, label: "Post Alert", desc: "Send an alert to the community", path: "/alerts", color: "text-amber-400" },
];

export default function AddContent() {
  return (
    <div>
      <PageHeader title="Create" showBack />
      <div className="px-4 pt-4 space-y-2">
        {options.map(({ icon: Icon, label, desc, path, color }) => (
          <Link
            key={label}
            to={path}
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}