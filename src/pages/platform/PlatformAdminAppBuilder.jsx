import React from "react";
import AdminPlaceholder from "@/components/platform/AdminPlaceholder";

export default function PlatformAdminAppBuilder() {
  return (
    <AdminPlaceholder
      title="App Builder"
      description="Visual drag-and-drop page builder — edit every page in the app without touching code."
      features={["Edit Home, Profile, RadioScope pages", "Drag-and-drop widgets", "Movable, resizable, hideable elements", "Reorder dashboard widgets", "Live preview", "No code required"]}
    />
  );
}