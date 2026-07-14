import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminNews() {
  return (
    <AdminPlaceholder
      title="News Management"
      description="Publish and manage platform-wide news announcements and community newsletters."
      features={[
        "Create and publish news articles",
        "Schedule news publications",
        "Pin important announcements",
        "Rich text editor with media support",
        "News categories and tags",
        "Push notification integration",
      ]}
    />
  );
}