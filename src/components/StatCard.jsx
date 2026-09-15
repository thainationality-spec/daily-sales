import { fmtBaht, fmtPct } from '../lib/calc';
export function StatCard({ icon, title, value, percent, tone='brand', big, suffix='บาท' }) {
  const tones = {
    brand:'from-brand-500 to-brand-700', mint:'from-emerald-400 to-teal-600',
    grape:'from-violet-500 to-fuchsia-600', sun:'from-amber-400 to-orange-500', rose:'from-rose-400 to-pink-600',
  };
  return (
    <div className={`rounded-3xl p-4 text-white bg-gradient-to-br ${tones[tone]} shadow-pop relative overflow-hidden`}>
      <div className="absolute -right-6 -top-6 text-7xl opacity-15 select-none">{icon}</div>
      <p className="text-xs font-bold opacity-90">{icon} {title}</p>
      <p className={`${big ? 'text-4xl' : 'text-2xl'} font-extrabold tabular-nums mt-1 leading-tight`}>
        {typeof value === 'number' ? fmtBaht(value).replace(' บาท','') : value}
        <span className="text-sm font-bold opacity-80 ml-1">{suffix}</span>
      </p>
      {percent !== undefined && (
        <span className="inline-block mt-2 text-xs font-bold bg-white/25 px-2 py-1 rounded-full">{fmtPct(percent)}</span>
      )}
    </div>
  );
}
