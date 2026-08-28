import type { ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { MobileNav } from "../components/MobileNav";
import { SOSModal } from "../components/SOSModal";

export function AppLayout({children}:{children:ReactNode}) {
  const [sos,setSos]=useState(false);
  return <div className="min-h-screen bg-rp-bg">
    <div className="flex min-h-screen">
      <Sidebar onSOS={()=>setSos(true)}/>
      <div className="min-w-0 flex-1"><TopBar/>{children}</div>
    </div>
    <MobileNav/>
    <button onClick={()=>setSos(true)} className="fixed bottom-24 right-4 z-30 rounded-full bg-rp-redStrong px-5 py-3 text-xs font-bold shadow-[0_0_25px_rgba(147,0,10,.35)] lg:hidden">SOS</button>
    <SOSModal open={sos} onClose={()=>setSos(false)}/>
  </div>;
}