import { useEffect, useState } from "react";
import { Phone, ShieldAlert, X } from "lucide-react";

export function SOSModal({open,onClose}:{open:boolean;onClose:()=>void}) {
  const [seconds,setSeconds]=useState(5);
  const [sent,setSent]=useState(false);
  useEffect(()=>{ if(!open){setSeconds(5);setSent(false);return} const id=window.setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000); return()=>clearInterval(id)},[open]);
  if(!open) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
    <div className="glass-card w-full max-w-md p-6">
      <button onClick={onClose} className="icon-button float-right"><X size={17}/></button>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rp-redStrong/20 text-rp-red"><ShieldAlert/></div>
      <h2 className="mt-5 text-center text-xl font-bold">Emergency SOS</h2>
      <p className="mt-2 text-center text-sm leading-6 text-rp-outline">The prototype uses a confirmation countdown. No emergency alert is sent unless an authorized backend integration confirms it.</p>
      {!sent ? <>
        <div className="my-5 rounded-xl border border-rp-red/20 bg-rp-redStrong/10 p-4 text-center text-sm">{seconds ? `Confirm in ${seconds}s` : "Ready to send"}</div>
        <button disabled={seconds>0} onClick={()=>setSent(true)} className="danger-button disabled:cursor-not-allowed disabled:opacity-40"><Phone size={17}/> Send Emergency Alert</button>
        <button onClick={onClose} className="secondary-button mt-2 w-full">Cancel</button>
      </> : <div className="my-5 rounded-xl border border-rp-green/20 bg-rp-green/10 p-4 text-center text-sm text-rp-green">UI confirmation recorded. Connect this action to the authorized emergency backend before production use.</div>}
    </div>
  </div>;
}