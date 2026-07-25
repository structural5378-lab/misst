import React from "react";
import { RadioTower, ShieldCheck, CircleDashed } from "lucide-react";
import { resolveLicenseStatus } from "@/lib/gmrsCallsign";

/**
 * LicenseBadge — reusable GMRS licensing indicator.
 *
 * Renders a clean, mobile-responsive FCC/radio-style badge showing a user's
 * GMRS licensing status directly beneath or beside their avatar. Consistent
 * across profiles, member cards, search results, RadioScope, and DMs.
 *
 * Props:
 *   callsign      — the user's GMRS call sign (optional)
 *   licenseStatus — explicit stored status (optional; derived from callsign if absent)
 *   size          — "sm" (inline member rows) | "md" (profile header) | "lg" (profile hero)
 *   showCallsign  — when true and licensed, render the call sign beneath the label
 *   className      — extra classes for the outer wrapper
 */
export default function LicenseBadge({
  callsign,
  licenseStatus,
  size = "sm",
  showCallsign = true,
  className = "",
}) {
  const status = resolveLicenseStatus({ licenseStatus, callsign });
  const cs = callsign ? String(callsign).toUpperCase().trim() : "";

  // Size presets
  const sizing =
    size === "lg"
      ? { wrap: "px-3.5 py-2", icon: 18, label: "text-[11px] tracking-[0.14em]", cs: "text-sm" }
      : size === "md"
      ? { wrap: "px-3 py-1.5", icon: 15, label: "text-[10px] tracking-[0.12em]", cs: "text-xs" }
      : { wrap: "px-2.5 py-1", icon: 13, label: "text-[9px] tracking-[0.1em]", cs: "text-[11px]" };

  if (status === "LICENSED") {
    return (
      <div
        className={`inline-flex flex-col items-start gap-0.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 ${sizing.wrap} ${className}`}
        title={cs ? `GMRS Licensed · ${cs}` : "GMRS Licensed"}
      >
        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300 leading-none">
          <RadioTower className="shrink-0" style={{ width: sizing.icon, height: sizing.icon }} />
          <span className={`uppercase ${sizing.label}`}>GMRS Licensed</span>
          <ShieldCheck className="shrink-0 text-emerald-400" style={{ width: sizing.icon - 2, height: sizing.icon - 2 }} />
        </span>
        {showCallsign && cs && (
          <span className={`font-bold text-emerald-100 tracking-wider ${sizing.cs}`}>{cs}</span>
        )}
      </div>
    );
  }

  if (status === "PENDING_VERIFICATION") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 ${sizing.wrap} ${className}`}
        title="GMRS license pending verification"
      >
        <CircleDashed className="shrink-0 text-amber-400" style={{ width: sizing.icon, height: sizing.icon }} />
        <span className={`uppercase font-bold text-amber-300 leading-none ${sizing.label}`}>Pending Verification</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] ${sizing.wrap} ${className}`}
      title="No GMRS license on file"
    >
      <CircleDashed className="shrink-0 text-muted-foreground" style={{ width: sizing.icon, height: sizing.icon }} />
      <span className={`uppercase font-semibold text-muted-foreground leading-none ${sizing.label}`}>Unlicensed</span>
    </div>
  );
}