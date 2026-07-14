import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { Shield, Menu, X, LogOut } from "lucide-react";
import { adminNavSections } from "@/lib/adminNav";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import AdminBadge from "@/components/admin/AdminBadge";

export default function PlatformAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useMyBBAuth();
  const { maxRoleLevel } = useAdminAccess();

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const visibleSections = adminNavSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.minRole || maxRoleLevel >= item.minRole),
    }))
    .filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Shield className="w-4 h-4 text-primary-foreground" />
              <AdminBadge size="sm" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wide text-foreground">MIST Control Center</span>
              <span className="text-xs text-primary ml-2 hidden sm:inline">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Exit to App →</Link>
            <button onClick={() => { logout(); window.location.href = "/login"; }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-14 left-0 z-40 w-60 h-[calc(100vh-3.5rem)] bg-card/80 backdrop-blur-xl border-r border-border overflow-y-auto transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <nav className="p-3 space-y-5">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1.5">{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 top-14 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}