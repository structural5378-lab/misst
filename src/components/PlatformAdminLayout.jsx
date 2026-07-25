import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Menu, X, LogOut, PanelLeftClose, PanelLeftOpen, Home, ArrowLeft, Command } from "lucide-react";
import { adminNavSections, getAppNavItems } from "@/lib/adminNav";
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useCommunity } from "@/hooks/useCommunity";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminBreadcrumb from "@/components/platform/AdminBreadcrumb";
import AdminGlobalSearch from "@/components/platform/AdminGlobalSearch";
import AdminNotificationBell from "@/components/platform/AdminNotificationBell";
import AdminQuickAction from "@/components/platform/AdminQuickAction";
import AdminCommandPalette from "@/components/platform/AdminCommandPalette";
import EnvironmentBadge from "@/components/platform/EnvironmentBadge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PlatformAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useMistUser();
  const { maxRoleLevel } = useAdminAccess();
  const { community } = useCommunity();
  const slug = community?.slug || null;

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  // Command palette: Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleSections = adminNavSections
    .map((section) => ({ ...section, items: section.items.filter((item) => !item.minRole || maxRoleLevel >= item.minRole) }))
    .filter((section) => section.items.length > 0);

  const appNavItems = getAppNavItems(slug);
  const isAdminMode = location.pathname.startsWith("/platform/admin");
  const widthClass = collapsed ? "lg:w-16" : "lg:w-60";

  const returnToMISST = () => {
    const last = sessionStorage.getItem("mist_last_app_path") || "/";
    navigate(last);
  };

  const confirmLogout = () => {
    setLogoutOpen(false);
    signOut();
    window.location.href = "/login";
  };

  const navLinkClass = (item) => ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all border ${collapsed ? "lg:justify-center" : ""} ${isActive ? "bg-primary/15 text-primary border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-3 sm:px-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button onClick={() => setCollapsed((c) => !c)} className="hidden lg:block p-1 text-muted-foreground hover:text-foreground">
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <Link to="/platform/admin" className="flex items-center gap-2 min-w-0">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                <Shield className="w-4 h-4 text-primary-foreground" />
                <AdminBadge size="sm" />
              </div>
              <div className="hidden sm:block min-w-0">
                <span className="text-sm font-bold tracking-wide text-foreground">MIST Control Center</span>
                <span className="text-xs text-primary ml-2">Super Admin</span>
              </div>
            </Link>
          </div>

          <AdminGlobalSearch />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Command palette trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              title="Command palette (Ctrl+K)"
              className="hidden sm:flex items-center gap-1 px-2 h-8 rounded-lg border border-border bg-background/40 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Command className="w-3.5 h-3.5" /> <span className="hidden md:inline">Quick Jump</span>
              <kbd className="hidden md:inline text-[10px] border border-border rounded px-1">⌘K</kbd>
            </button>

            {/* Return to MISST — desktop */}
            <button
              onClick={returnToMISST}
              title="Return to MISST"
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary/15 border border-primary/25 text-primary text-xs font-medium hover:bg-primary/25 transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> Return to MISST
            </button>

            <EnvironmentBadge />
            <AdminNotificationBell />
            <button onClick={() => setLogoutOpen(true)} title="Sign out" className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-14 left-0 z-40 ${widthClass} h-[calc(100vh-3.5rem)] bg-card/80 backdrop-blur-xl border-r border-border overflow-y-auto overflow-x-hidden transition-all duration-200 ${sidebarOpen ? "translate-x-0 w-60" : "-translate-x-full lg:translate-x-0"}`}>
          <nav className="p-2 space-y-4 pb-24 lg:pb-4">

            {/* Admin Mode toggle */}
            <div className={`px-3 py-2.5 rounded-xl bg-secondary/30 border border-border ${collapsed ? "lg:px-2" : ""}`}>
              <div className={`flex items-center gap-2.5 ${collapsed ? "lg:flex-col lg:gap-1" : ""}`}>
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <div className={`flex-1 min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
                  <div className="text-xs font-semibold text-foreground">Admin Mode</div>
                  <div className="text-[10px] text-muted-foreground">{isAdminMode ? "Console active" : "Switch to console"}</div>
                </div>
                <Switch
                  checked={isAdminMode}
                  onCheckedChange={(on) => on ? navigate("/platform/admin") : returnToMISST()}
                  className={`${collapsed ? "lg:scale-90" : ""}`}
                />
              </div>
            </div>

            {/* Application Navigation */}
            <div>
              <h3 className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1 ${collapsed ? "lg:hidden" : ""}`}>Application Navigation</h3>
              <div className="space-y-0.5">
                {/* Return to MISST — persistent, first item */}
                <button
                  onClick={returnToMISST}
                  title={collapsed ? "Return to MISST" : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all ${collapsed ? "lg:justify-center" : ""}`}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>Return to MISST</span>
                </button>
                {appNavItems.map((item) => (
                  <NavLink key={item.path} to={item.path} title={collapsed ? item.label : undefined} className={navLinkClass(item)}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Admin sections */}
            {visibleSections.map((section) => (
              <div key={section.title}>
                <h3 className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1 ${collapsed ? "lg:hidden" : ""}`}>{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink key={item.path} to={item.path} end={item.end} title={collapsed ? item.label : undefined} className={navLinkClass(item)}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            {/* Logout — separated, destructive */}
            <div className="pt-3 mt-2 border-t border-border">
              <button
                onClick={() => setLogoutOpen(true)}
                title={collapsed ? "Sign out" : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all ${collapsed ? "lg:justify-center" : ""}`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 top-14 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-w-0">
          <div className="mb-4"><AdminBreadcrumb /></div>
          <Outlet />
        </main>
      </div>

      <AdminQuickAction />

      {/* Mobile floating Return to MISST */}
      <button
        onClick={returnToMISST}
        className="sm:hidden fixed bottom-20 right-4 z-40 flex items-center gap-1.5 h-11 px-4 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 active:scale-95 transition-transform"
      >
        <Home className="w-4 h-4" /> MISST
      </button>

      <AdminCommandPalette open={paletteOpen} setOpen={setPaletteOpen} />

      {/* Logout confirmation */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of MISST?</AlertDialogTitle>
            <AlertDialogDescription>You'll need to sign in again to return to the platform. This won't affect your community memberships.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Signed In</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}