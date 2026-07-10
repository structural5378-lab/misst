import React from "react";
import { Outlet } from "react-router-dom";
import { Shield } from "lucide-react";

/**
 * PlatformAdminLayout — completely separate layout for the hidden master admin dashboard.
 * No community branding, no bottom nav, no community context.
 * This is the platform-level shell only.
 */
export default function PlatformAdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Platform admin header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wide text-slate-200">MIST Platform Admin</span>
            <span className="text-xs text-slate-500 ml-2">Master Dashboard</span>
          </div>
        </div>
        <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Exit to App →
        </a>
      </header>

      {/* Platform admin body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-900 border-r border-slate-800 p-4">
          <nav className="space-y-1">
            <a href="/platform/admin" className="block px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              Overview
            </a>
            <a href="/platform/admin/communities" className="block px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              Communities
            </a>
            <a href="/platform/admin/users" className="block px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              Users
            </a>
            <a href="/platform/admin/roles" className="block px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              Platform Roles
            </a>
            <a href="/platform/admin/audit-log" className="block px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              Audit Log
            </a>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}