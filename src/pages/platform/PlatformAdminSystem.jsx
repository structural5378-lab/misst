import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminSystem() {
  return (
    <AdminPlaceholder
      title="System"
      description="Platform backup, maintenance, and server configuration."
      features={["Backup and restore", "Export and import database", "Server settings", "Maintenance mode", "Version control", "Automatic updates"]}
    />
  );
}