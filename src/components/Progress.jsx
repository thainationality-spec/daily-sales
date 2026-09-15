import { fmtPct } from '../lib/calc';
export function Progress({ percent, barClass='bg-brand-500', height='h-5', showLabel=true }) {
  const w = Math.min(Math.max(percent || 0, 0), 100);
  return (
    <div className={`w-full ${height} bg-slate-200 rounded-full overflow-hidden relative`}>
      <div className={`h-full ${barClass} rounded-full transition-all duration-700 ease-out relative`} style={{ width:`${w}%` }}>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.25)_50%,rgba(255,255,255,.25)_75%,transparent_75%)] bg-[length:1rem_1rem] animate-[stripe_1s_linear_infinite]" />
      </div>
      {showLabel && <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-700">{fmtPct(percent)}</span>}
    </div>
  );
}
