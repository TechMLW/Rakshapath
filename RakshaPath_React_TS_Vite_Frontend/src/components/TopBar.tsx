import { Bell, Settings } from "lucide-react";
import { Brand } from "./Brand";
import { useLocation } from "react-router-dom";

export function TopBar() {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[.07] bg-rp-bg/75 px-4 backdrop-blur-xl lg:px-8">
      <div className="lg:hidden"><Brand /></div>
      <div className="hidden text-xs text-rp-outline lg:block">{location.pathname === "/" ? "EXPLORE" : location.pathname.slice(1).toUpperCase()}</div>
      <div className="ml-auto flex gap-2">
        <button className="icon-button" aria-label="Notifications"><Bell size={17}/></button>
        <button className="icon-button" aria-label="Settings"><Settings size={17}/></button>
      </div>
    </header>
  );
}