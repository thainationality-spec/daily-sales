import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import MoneyInput from '../components/MoneyInput';
import { TH_MONTHS, fmtBaht, monthlyTarget, dailyTarget, toBE, remainingWorkingDays } from '../lib/calc';

export default function Settings({ goto }) {
  const { me, isAdmin, month, setMonth, year, setYear, myTarget, notify, load, cutoff, SINGLE_USER } = useApp();
  const [t, setT] = useState({ pack_amount:0, target_percent:100, working_days:22 });
  const [name, setName] = useState(''); const [cut, setCut] = useState('17:30');

  useEffect(() => {
    setT({ pack_amount:+(myTarget?.pack_amount || 0),
           target_percent:+(myTarget?.target_percent || 100),
           working_days:+(myTarget?.working_days || 22) });
  }, [myTarget]);
  useEffect(() => { if (me) { setName(me.name); setCut(me.cutoff_time || '17:30'); } }, [me]);

  const mT = monthlyTarget(t.pack_amount, t.target_percent);
  const dT = dailyTarget(mT, t.working_days);
  const left = remainingWorkingDays(year, month, t.working_days, cut);

  const saveTarget = async () => {
    if (t.pack_amount < 0 || t.target_percent < 0 || t.working_days < 1)
      return notify('กรอกค่าให้ถูกต้อง (ห้ามติดลบ)', 'error');
    const { error } = await supabase.from('monthly_targets').upsert({
      user_id: me.id, month, year,
      pack_amount:+t.pack_amount, target_percent:+t.target_percent, working_days:+t.working_days,
    }, { onConflict:'user_id,month,year' });
    if (error) return notify('บันทึกไม่สำเร็จ: ' + error.message, 'error');
    notify('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว'); load();
  };

  const saveProfile = async () => {
    await supabase.from('profiles').update({ name, cutoff_time:cut }).eq('id', me.id);
    notify('✅ บันทึกโปรไฟล์แล้ว'); load();
  };

  const years = Array.from({ length:5 }, (_,i) => toBE(new Date().getFullYear()) - 1 + i);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">⚙️ ตั้งค่า</h2>

      <div className="card space-y-3">
        <h3 className="font-extrabold">👤 โปรไฟล์</h3>
        <div><label className="label">ชื่อเซลล์</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="label">🕔 เวลาตัดรอบวันทำงาน</label>
          <input type="time" className="input" value={cut} onChange={e => setCut(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">เมื่อเลยเวลานี้ ระบบจะหักวันทำงานของวันนี้ออกอัตโนมัติ</p></div>
        <button onClick={saveProfile} className="btn-ghost w-full">💾 บันทึกโปรไฟล์</button>
      </div>

      <div className="card space-y-3">
        <h3 className="font-extrabold">🎯 ตั้งค่าเป้าหมาย</h3>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">เดือน</label>
            <select className="input" value={month} onChange={e => setMonth(+e.target.value)}>
              {TH_MONTHS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
            </select></div>
          <div><label className="label">ปี (พ.ศ.)</label>
            <select className="input" value={year} onChange={e => setYear(+e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select></div>
        </div>

        <MoneyInput icon="📦" label="ยอดแพ็คที่ได้รับ" value={t.pack_amount} onChange={v => setT(p => ({...p, pack_amount:v}))} />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">⚙️ เปอร์เซ็นต์เป้าหมาย (%)</label>
            <input type="number" min="0" step="1" className="input" value={t.target_percent}
              onChange={e => setT(p => ({...p, target_percent:Math.max(+e.target.value||0,0)}))} /></div>
          <div><label className="label">📅 จำนวนวันทำงาน</label>
            <input type="number" min="1" className="input" value={t.working_days}
              onChange={e => setT(p => ({...p, working_days:Math.max(+e.target.value||1,1)}))} /></div>
        </div>

        <div className="bg-brand-50 rounded-2xl p-4 space-y-1">
          <p className="text-sm font-bold text-slate-600">🧮 คำนวณอัตโนมัติ</p>
          <p className="text-xs text-slate-500">เป้าหมายรายเดือน = {t.pack_amount.toLocaleString()} × {t.target_percent}%</p>
          <p className="text-2xl font-extrabold text-brand-700">{fmtBaht(mT)}</p>
          <p className="text-xs text-slate-500 pt-1">เป้าหมายรายวัน = เป้าเดือน ÷ {t.working_days} วัน</p>
          <p className="text-xl font-extrabold text-violet-700">{fmtBaht(dT)}</p>
          <p className="text-xs font-bold text-emerald-700 pt-1">⏳ เหลือวันทำงานจริง {left} วัน (ตัดรอบ {cut} น.)</p>
        </div>

        <button onClick={saveTarget} className="btn-primary w-full">💾 บันทึกการตั้งค่า</button>
      </div>

      {isAdmin && !SINGLE_USER && (
        <button onClick={() => goto('admin')} className="btn w-full bg-slate-900 text-white">🛡️ แผงควบคุมผู้ดูแลระบบ</button>
      )}
      <button onClick={() => supabase.auth.signOut()} className="btn w-full bg-rose-50 text-rose-600">🚪 ออกจากระบบ</button>
      <p className="text-center text-xs text-slate-400 pb-2">Daily Sales v1.0 • ใช้งานฟรี</p>
    </div>
  );
}
