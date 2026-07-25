import React from "react";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";

/**
 * Persistent badge showing which database (Test 🟠 / Production 🟢) the
 * admin is currently working in. Renders nothing until the environment is
 * resolved to avoid flashing a wrong label.
 */
export default function EnvironmentBadge({ className = "" }) {
  const { data, isLoading } = useAppEnvironment();
  if (isLoading || !data) return null;
  const isTest = data.isTest;
  return (
    <span
      title={`Connected to the ${data.label} database`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${isTest ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"} ${className}`}
    >
      {isTest ? "🟠 Test" : "🟢 Production"}
    </span>
  );
}