import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Mail, Bell, Plus } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Forums", path: "/forums" },
  { icon: null, label: "Add", path: "/add" }, // center action
  { icon: Mail, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(210,30%,7%)]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(path);
          const isAdd = label === "Add";

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
                isAdd ? "" : isActive ? "text-violet-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAdd ? (
                <div className="relative -mt-5">
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-violet-500 blur-md opacity-50 scale-110" />
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-900/60 border-2 border-violet-400/30">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                  <span className={`text-[10px] font-medium ${isActive ? "text-violet-400" : ""}`}>
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
      {/* iPhone safe area */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </nav>
  );
}