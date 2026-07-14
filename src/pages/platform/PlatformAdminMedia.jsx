import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminMedia() {
  return (
    <AdminPlaceholder
      title="Media Library"
      description="Upload and manage media assets used throughout the MIST application."
      features={["Upload icons and badge images", "Profile banners and backgrounds", "Club logos", "Avatar frames", "Use across the entire app"]}
    />
  );
}