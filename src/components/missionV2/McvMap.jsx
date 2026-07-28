import React from "react";
import MissionMap from "@/components/mission/MissionMap";

// McvMap — Map view tab. Reuses the existing MissionMap (participant + repeater
// + net-control markers) full-bleed.
export default function McvMap({ v2 }) {
  const { approved, repeater, activeSession } = v2;
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06] h-[60vh]">
      <MissionMap checkins={approved} repeater={repeater} netControlUid={activeSession?.net_control_uid} />
    </div>
  );
}