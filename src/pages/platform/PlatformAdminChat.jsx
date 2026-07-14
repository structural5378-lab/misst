import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminChat() {
  return (
    <AdminPlaceholder
      title="Chat Moderation"
      description="Manage chat channels, messages, and user communication across the platform."
      features={["Delete messages", "Mute users in chat", "Pin important messages", "Announcement banners", "Global, club, and repeater chat", "Emergency chat channel"]}
    />
  );
}