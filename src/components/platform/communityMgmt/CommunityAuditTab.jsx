import React from "react";

export default function CommunityAuditTab({ audit }) {
  const rows = audit || [];
  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Administrator</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Action</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Target</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Previous</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">New</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date &amp; Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No audit entries.</td></tr>}
          {rows.map((l) => (
            <tr key={l.id} className="border-t border-border hover:bg-muted/30">
              <td className="px-3 py-2 text-xs">{l.admin_email || l.admin_id || "—"}</td>
              <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{l.action}</span></td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{l.target_type}{l.target_name ? ` · ${l.target_name}` : ""}</td>
              <td className="px-3 py-2 text-[10px] text-muted-foreground font-mono max-w-[180px] truncate">{l.previous_value || "—"}</td>
              <td className="px-3 py-2 text-[10px] text-muted-foreground font-mono max-w-[180px] truncate">{l.new_value || "—"}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{l.created_date ? new Date(l.created_date).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}