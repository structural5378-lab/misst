import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminNets() {
  return (
    <AdminPlaceholder
      title="Nets Management"
      description="Manage scheduled nets across all communities — configure schedules, net control operators, and categories."
      features={[
        "Create and edit net schedules",
        "Assign net control operators",
        "Configure net categories (general, emergency, technical)",
        "Monitor net check-in activity",
        "Bulk net management",
        "Net reminder configuration",
      ]}
    />
  );
}