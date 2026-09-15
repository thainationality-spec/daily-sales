import { useState, useEffect } from 'react';
import { fmtMoney } from '../lib/calc';

export default function Calculator({ open, initial = 0, title = 'ใส่จำนวนเงิน', onClose, onApply }) {
  const [expr, setExpr] = useState('');
  useEffect(() => { if (open) setExpr(initial ? String(initial) : ''); }, [open, initial]);
  if (!open) return null;

  const evaluate = (e) => {
    try {
      const clean = e.replace(/[^0-9+\-*/.]/g, '');
      if (!clean) return 0;
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict";return (${clean})`)();
      return Number.isFinite(v) ? Math.max(v, 0) : 0;   // 🚫 กันค่าติดลบ
    } catch { return 0; }
  };
  const result = evaluate(expr);
  const push = (k) => setExpr(p => (p + k).slice(0, 24));

  const KEYS = [['7','8','9','÷'],['4','5','6','×'],['1','2','3','−'],['000','0','.','+']];
  const map = { '÷':'/', '×':'*', '−':'-' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-sm bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 pb-8 animate-[slideUp_.2s_ease-out]"
           onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
        <p className="text-center font-bold text-slate-500">{title}</p>

        <div className="mt-2 bg-slate-900 text-white rounded-2xl p-4 text-right">
          <div className="text-sm text-slate-400 h-5 truncate">{expr || '0'}</div>
          <div className="text-4xl font-extrabold tabular-nums">{fmtMoney(result)}</div>
          <div className="text-xs text-slate-400">บาท</div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          <button onClick={() => setExpr('')}                 className="btn bg-rose-100 text-rose-600">AC</button>
          <button onClick={() => setExpr(p => p.slice(0,-1))} className="btn bg-slate-100 col-span-2">⌫ ลบ</button>
          <button onClick={() => push('/')}                   className="btn bg-brand-100 text-brand-700">÷</button>
          {KEYS.flat().map(k => (
            <button key={k} onClick={() => push(map[k] ?? k)}
              className={`btn text-xl ${'÷×−+'.includes(k) ? 'bg-brand-100 text-brand-700' : 'bg-slate-100'}`}>{k}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={onClose} className="btn-ghost">ยกเลิก</button>
          <button onClick={() => { onApply(result); onClose(); }} className="btn-primary">✅ ใช้ยอดนี้</button>
        </div>
      </div>
    </div>
  );
    }
