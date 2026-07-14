import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminForum() {
  return (
    <AdminPlaceholder
      title="Forum Moderation"
      description="Manage forum content, moderation rules, and automated filters."
      features={["Create and delete forums", "Pin and lock posts", "Move and merge topics", "Auto moderation rules", "Spam and keyword filters", "Profanity filter"]}
    />
  );
}