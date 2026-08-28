import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 text-inherit no-underline">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
        <ShieldCheck size={22} strokeWidth={2.2} />
      </div>
      <div>
        <div className="font-extrabold tracking-tight text-slate-900 text-base leading-tight">RakshaPath</div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">AI Safety Navigator</div>
      </div>
    </Link>
  );
}