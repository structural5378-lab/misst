import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminReports() {
  return (
    <AdminPlaceholder
      title="Reports & Moderation Queue"
      description="Unified queue for user reports, flagged posts, and pending moderation items across the platform."
      features={[
        "User-submitted reports",
        "Flagged forum posts",
        "Flagged chat messages",
        "Pending content approvals",
        "Automated spam detection",
        "Bulk moderation actions",
      ]}
    />
  );
}