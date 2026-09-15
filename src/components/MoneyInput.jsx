import { useState } from 'react';
import Calculator from './Calculator';
import { fmtMoney } from '../lib/calc';

export default function MoneyInput({ label, value, onChange, icon = '💵', disabled, hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label className="label">{icon} {label}</label>
      <button type="button" disabled={disabled} onClick={() => setOpen(true)}
        className={`input flex items-center justify-between text-left ${disabled ? 'bg-slate-100 text-slate-400' : ''}`}>
        <span className="text-2xl font-extrabold tabular-nums">{fmtMoney(value)}</span>
        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">🧮 คิดเลข</span>
      </button>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      <Calculator open={open} initial={value} title={label} onClose={() => setOpen(false)} onApply={onChange} />
    </div>
  );
}
