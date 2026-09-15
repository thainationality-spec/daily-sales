import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { TH_MONTHS, fmtBaht, monthlyTarget, dailyTarget, fmtPct } from '../lib/calc';

export default function AdminPanel({ goto }) {
  const { profiles, targets, month, year, notify, load, summaryOf } = useApp();
  const [draft, setDraft] = useState({});

  const get = (uid) => {
    const t = targets.find(x => x.user_id === uid);
    return draft[uid] || { pack_amount:+(t?.pack_amount||0), target_percent:+(t?.target_percent||100), working_days:+(t?.working_days||22) };
  };
  const set = (uid, k, v) => setDraft(p => ({ ...p, [uid]: { ...get(uid), [k]:Math.max(+v||0,0) } }));

  const save = async (uid) => {
    const d = get(uid);
    if (d.working_days < 1) return notify('จำนวนวันทำงานต้องมากกว่า 0', 'error');
    const { error } = await supabase.from('monthly_targets')
      .upsert({ user_id:uid, month, year, ...d }, { onConflict:'user_id,month,year' });
    if (error) return notify(error.message, 'error');
    notify('✅ บันทึกเป้าหมายแล้ว'); load();
  };

  const setRole = async (uid, role) => {
    await supabase.from('profiles').update({ role }).eq('id', uid);
    notify('เปลี่ยนสิทธิ์เป็น ' + role); load();
  };

  return (
    <div className="space-y-4">
      <button onClick={() => goto('settings')} className="text-sm font-bold text-brand-600">← กลับ</button>
      <h2 className="text-2xl font-extrabold">🛡️ Admin Panel</h2>
      <p className="text-sm text-slate-500 font-bold">กำหนดเป้าหมาย {TH_MONTHS[month-1]} {year}</p>

      {profiles.map(p => {
        const d = get(p.id), s = summaryOf(p.id);
        const mT = monthlyTarget(d.pack_amount, d.target_percent);
        return (
          <div key={p.id} className="card space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-extrabold">{p.avatar_emoji} {p.name}</p>
              <select value={p.role} onChange={e => setRole(p.id, e.target.value)}
                className="chip bg-slate-100 text-slate-700 outline-none">
                <option value="sales">พนักงานขาย</option><option value="admin">ผู้ดูแลระบบ</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="label text-[11px]">ยอดแพ็ค</label>
                <input type="number" min="0" className="input text-base py-2" value={d.pack_amount}
                  onChange={e => set(p.id,'pack_amount',e.target.value)} /></div>
              <div><label className="label text-[11px]">เป้า %</label>
                <input type="number" min="0" className="input text-base py-2" value={d.target_percent}
                  onChange={e => set(p.id,'target_percent',e.target.value)} /></div>
              <div><label className="label text-[11px]">วันทำงาน</label>
                <input type="number" min="1" className="input text-base py-2" value={d.working_days}
                  onChange={e => set(p.id,'working_days',e.target.value)} /></div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 text-xs font-bold text-slate-600 flex justify-between">
              <span>เป้าเดือน {fmtBaht(mT)}</span>
              <span>เป้า/วัน {fmtBaht(dailyTarget(mT, d.working_days))}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">ทำได้ {fmtBaht(s.total)}</span>
              <span className={`chip ${s.status.cls}`}>{fmtPct(s.percentOfTarget)}</span>
            </div>
            <button onClick={() => save(p.id)} className="btn-primary w-full py-2 text-sm">💾 บันทึกเป้าหมาย</button>
          </div>
        );
      })}
    </div>
  );
}
