import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, CalendarPlus, Award, Megaphone, Radio, Mail, Users, X } from "lucide-react";

export default function AdminQuickAction() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const actions = [
    { label: "New User", icon: UserPlus, path: "/platform/admin/users" },
    { label: "New Event", icon: CalendarPlus, path: "/events/create" },
    { label: "New Badge", icon: Award, path: "/platform/admin/badges" },
    { label: "New Announcement", icon: Megaphone, path: "/platform/admin/notifications" },
    { label: "New Repeater", icon: Radio, path: "/repeaters/add" },
    { label: "Broadcast Message", icon: Mail, path: "/platform/admin/notifications" },
    { label: "Create Group", icon: Users, path: "/platform/admin/roles" },
  ];
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1.5 mb-1 fade-in">
          {actions.map((a) => (
            <button key={a.label} onClick={() => { setOpen(false); navigate(a.path); }} className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-card border border-border shadow-lg text-sm text-foreground hover:bg-muted transition-colors">
              <a.icon className="w-4 h-4 text-primary" />
              {a.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform">
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}