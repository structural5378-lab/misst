import React from "react";
import { ClipboardList } from "lucide-react";

export default function CommunityReportsTab({ community }) {
  return (
    <div className="rounded-xl bg-card border border-border p-10 text-center">
      <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-foreground">No Reports</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        A dedicated report system for members, posts, messages, and comments is being developed.
        Reported content will appear here for review and action (dismiss, warn, suspend, delete, ban).
      </p>
    </div>
  );
}