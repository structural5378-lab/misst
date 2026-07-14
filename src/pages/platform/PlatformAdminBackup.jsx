import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminBackup() {
  return (
    <AdminPlaceholder
      title="Backup & Restore"
      description="Export, backup, and restore platform data — entities, configurations, and user records."
      features={[
        "Full platform data export",
        "Entity-level backup (users, communities, content)",
        "Configuration backup (themes, feature flags, roles)",
        "Scheduled automatic backups",
        "Point-in-time restore",
        "Data migration tools",
      ]}
    />
  );
}