import { NavLink } from "react-router-dom";
import { BarChart3, ClipboardList, FlaskConical, Activity } from "lucide-react";

const TABS = [
  { to: "/platform/admin/notifications", label: "Analytics", icon: BarChart3, end: true },
  { to: "/platform/admin/notifications/logs", label: "Delivery Logs", icon: ClipboardList },
  { to: "/platform/admin/notifications/test", label: "Test Console", icon: FlaskConical },
  { to: "/platform/admin/notifications/monitor", label: "Live Monitor", icon: Activity },
];

export default function NotificationAdminTabs() {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-5">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
              isActive ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground border-transparent hover:bg-muted"
            }`
          }
        >
          <t.icon className="w-3.5 h-3.5" /> {t.label}
        </NavLink>
      ))}
    </div>
  );
}