import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Mail, Bell, PlusCircle } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Forums", path: "/forums" },
  { icon: PlusCircle, label: "Add", path: "/add" },
  { icon: Mail, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
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
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                isAdd ? "" : isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAdd ? (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center -mt-3 shadow-lg shadow-primary/30">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className={`text-[10px] font-medium ${isAdd ? "mt-0.5" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}