import { Bell, Settings } from "lucide-react";
import { Brand } from "./Brand";
import { useLocation, Link } from "react-router-dom";

export function TopBar() {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/":
        return "Explore Map";
      case "/routes":
        return "Route Comparison";
      case "/safety":
        return "Safety Intelligence";
      case "/reports":
        return "Incident Reporting";
      case "/navigation":
        return "Live Navigation";
      case "/profile":
        return "Safety Profile";
      default:
        return "RakshaPath";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      <div className="lg:hidden">
        <Brand />
      </div>

      <div className="hidden text-xs font-bold uppercase tracking-wider text-slate-500 lg:block">
        {getPageTitle(location.pathname)}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
          DEMO / TEST MODE
        </span>
        <button className="icon-button" aria-label="Notifications" title="Notifications">
          <Bell size={18} />
        </button>
        <Link to="/profile" className="icon-button" aria-label="Settings" title="Settings">
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}