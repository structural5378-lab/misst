import { Outlet } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import DesktopTopBar from "./DesktopTopBar";
import DesktopLeftNav from "./DesktopLeftNav";
import DesktopRightRail from "./DesktopRightRail";

/**
 * CommunityDesktopShell — responsive Community workspace.
 *
 *  - < 1280px (mobile / tablet): pass-through `<Outlet />` — the existing
 *    mobile-first experience (AppLayout chrome + BottomNav) is untouched.
 *  - >= 1280px (desktop): a full three-column workspace — collapsible/resizable
 *    left navigation, a wide scrollable center, and a contextual right rail.
 *
 * AppLayout drops its mobile chrome for community routes on desktop, so this
 * shell owns the full viewport. Persistent prefs (nav width, collapse, widget
 * layout) are stored in localStorage by the child panels.
 */
export default function CommunityDesktopShell() {
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  if (!isDesktop) return <Outlet />;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <DesktopTopBar />
      <div className="flex flex-1 min-h-0">
        <DesktopLeftNav />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
        <DesktopRightRail />
      </div>
    </div>
  );
}