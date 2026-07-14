import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminRadioScope() {
  return (
    <AdminPlaceholder
      title="RadioScope Management"
      description="Configure the tactical GMRS mapping system — repeaters, coverage, layers, and visual overlays."
      features={["Manage repeaters and coverage circles", "Configure map layers and RF overlays", "Heat maps and distance colors", "Tower and radio icon customization", "Map themes", "Offline mode"]}
    />
  );
}