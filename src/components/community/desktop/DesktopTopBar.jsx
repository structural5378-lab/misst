import { Link, useLocation } from "react-router-dom";
import { useMistUser } from "@/hooks/useMistUser";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Moon, Sun, User, Settings, LogOut, ChevronRight } from "lucide-react";

const LOGO =
  "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/ef2f5095f_EA7D7629-51E2-49DA-AE8B-4017441D651F.png";

function useBreadcrumbs() {
  const { pathname } = useLocation();
  if (pathname === "/community-forum") return [{ label: "Community" }];
  if (pathname === "/community/new")
    return [
      { label: "Community", to: "/community-forum" },
      { label: "New Thread" },
    ];
  if (pathname.startsWith("/community/thread/"))
    return [
      { label: "Community", to: "/community-forum" },
      { label: "Thread" },
    ];
  return [{ label: "Community" }];
}

export default function DesktopTopBar() {
  const { mistUser, signOut } = useMistUser();
  const { data: unread = 0 } = useUnreadNotifications();
  const { amoled, setAmoled } = useTheme();
  const crumbs = useBreadcrumbs();

  return (
    <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-4 border-b border-border bg-background/95 backdrop-blur-xl">
      {/* Brand + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={LOGO} alt="MIST" className="w-6 h-6 object-contain" />
          <span className="text-sm font-bold tracking-[0.15em] text-primary uppercase hidden xl:inline">
            MIST
          </span>
        </Link>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-sm">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />}
              {c.to ? (
                <Link to={c.to} className="text-muted-foreground hover:text-foreground truncate">
                  {c.label}
                </Link>
              ) : (
                <span className="font-semibold text-foreground truncate">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Quick search */}
      <Link
        to="/search"
        className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-secondary/60 border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors w-56 lg:w-72"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="text-xs">Search community…</span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Theme switcher (AMOLED toggle) */}
        <button
          onClick={() => setAmoled(!amoled)}
          aria-label="Toggle AMOLED theme"
          title="Toggle AMOLED black"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          {amoled ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification bell */}
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {mistUser.avatarUrl ? (
                <img
                  src={mistUser.avatarUrl}
                  alt={mistUser.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30">
                  {(mistUser.displayName || "M").charAt(0)}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold text-foreground truncate">{mistUser.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{mistUser.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" /> Account Center
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" /> My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive cursor-pointer">
              <LogOut className="w-4 h-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}