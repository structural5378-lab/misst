import React from "react";
import { PERMISSIONS } from "@/lib/rbacClient";

/**
 * PermissionMatrix — grouped toggle grid for the Role Editor.
 * Supports the wildcard "*" (all permissions) and a per-permission
 * "Deny" override (removes an inherited permission).
 */
export default function PermissionMatrix({ selected = [], denied = [], onTogglePerm, onToggleAll, onToggleDeny, disabled = false }) {
  const hasAll = selected.includes("*");
  const categories = {};
  for (const p of PERMISSIONS) (categories[p.category] ||= []).push(p);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm py-1">
        <input
          type="checkbox"
          checked={hasAll}
          disabled={disabled}
          onChange={(e) => onToggleAll(e.target.checked)}
        />
        <span className="font-semibold text-foreground">All permissions (wildcard)</span>
      </label>

      {Object.entries(categories).map(([cat, perms]) => (
        <div key={cat}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {perms.map((p) => {
              const on = hasAll || selected.includes(p.key);
              const den = denied.includes(p.key);
              return (
                <div
                  key={p.key}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs ${on ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground"} ${hasAll ? "opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={hasAll || disabled}
                    onChange={() => onTogglePerm(p.key)}
                  />
                  <span className="flex-1 truncate">{p.label}</span>
                  {onToggleDeny && !hasAll && (
                    <button
                      type="button"
                      onClick={() => onToggleDeny(p.key)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${den ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground/70 hover:text-foreground"}`}
                      title="Override: deny this inherited permission"
                    >
                      {den ? "Denied" : "Deny"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}