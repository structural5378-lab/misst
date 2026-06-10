import React from "react";
import { Link } from "react-router-dom";
import { Radio, MessageSquare, Users, Bell, ChevronRight, Lock } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

const options = [
  { icon: Radio, label: "Add Repeater", desc: "Register a new repeater", path: "/repeaters/add", color: "text-primary", requiresEdit: true },
  { icon: MessageSquare, label: "New Thread", desc: "Start a forum discussion", path: "/forums/new", color: "text-blue-400", requiresEdit: false },
  { icon: Users, label: "Create Net", desc: "Schedule a new net", path: "/nets/create", color: "text-purple-400", requiresEdit: true },
  { icon: Bell, label: "Post Alert", desc: "Send an alert to the community", path: "/alerts/create", color: "text-amber-400", requiresEdit: true },
];

export default function AddContent() {
  const { mybbUser } = useMyBBAuth();
  const canEdit = mybbUser?.canEdit;

  return (
    <div>
      <PageHeader title="Create" showBack />
      <div className="px-4 pt-4 space-y-2">
        {options.map(({ icon: Icon, label, desc, path, color, requiresEdit }) => {
          const locked = requiresEdit && !canEdit;
          return locked ? (
            <div
              key={label}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Admin / Moderator only</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
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
          );
        })}

        {!canEdit && (
          <p className="text-center text-xs text-muted-foreground pt-2">
            Signed in as <strong className="text-foreground">{mybbUser?.username}</strong> · Member access
          </p>
        )}
      </div>
    </div>
  );
}