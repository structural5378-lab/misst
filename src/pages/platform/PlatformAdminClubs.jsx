import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminClubs() {
  return (
    <AdminPlaceholder
      title="Club Management"
      description="Create, approve, and manage community clubs and their memberships."
      features={["Create and delete clubs", "Approve club applications", "Assign club admins", "Manage memberships", "Club analytics"]}
    />
  );
}