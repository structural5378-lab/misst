import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminBadges() {
  return (
    <AdminPlaceholder
      title="Badge System"
      description="Create, assign, and manage operator badges and achievements across the platform."
      features={["Upload badge images", "Create animated badges", "Assign manually or automatically", "Create badge categories", "Hide or retire badges", "Badge rarity system"]}
    />
  );
}