import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminRepeaters() {
  return (
    <AdminPlaceholder
      title="Repeater Management"
      description="Manage all repeaters across the platform — approve submissions, edit details, and monitor status."
      features={[
        "Approve pending repeater submissions",
        "Edit repeater details (frequency, tone, location)",
        "Monitor repeater online/offline status",
        "Bulk import from RepeaterBook",
        "Manage repeater ownership",
        "Coverage area configuration",
      ]}
    />
  );
}