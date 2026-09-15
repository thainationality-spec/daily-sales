import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import MoneyInput from '../components/MoneyInput';
import { ymd, fmtBaht, fmtPct, pct, totalSales, thaiDate } from '../lib/calc';

export default function AddSale({ goto }) {
  const { me, notify, load, sales } = useApp();
  const today = ymd(new Date());
  const empty = { date:today, renewal:0, upsell:0, policies_sold:0, policies_collected:0, money_collected:0, note:'' };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));

  /* 📌 กติกา: เลือกวันที่ของ "เดือนถัดไป" → บันทึกได้เฉพาะต่ออายุ */
  const cur = new Date(); const d = new Date(f.date);
  const isFutureMonth = d.getFullYear() > cur.getFullYear() ||
                        (d.getFullYear() === cur.getFullYear() && d.getMonth() > cur.getMonth());

  const total = totalSales(f.renewal, isFutureMonth ? 0 : f.upsell);
  const pPct  = pct(f.policies_collected, f.policies_sold);
  const mPct  = pct(f.money_collected, total);

  const validate = () => {
    if (!f.date) return 'กรุณาเลือกวันที่';
    if (total <= 0) return 'กรุณากรอกยอดขายอย่างน้อย 1 ช่อง';
    if ([f.renewal,f.upsell,f.money_collected,f.policies_sold,f.policies_collected].some(v => +v < 0))
      return 'ห้ามกรอกค่าติดลบ';
    if (+f.policies_collected > +f.policies_sold) return 'ฉบับที่เก็บเงินแล้ว มากกว่าฉบับที่ขายไม่ได้';
    if (+f.money_collected > total) return 'เงินที่เก็บได้ มากกว่ายอดขายรวมไม่ได้';
    return null;
  };

  const save = async () => {
    const err = validate(); if (err) return notify(err, 'error');
    setBusy(true);
    const { error } = await supabase.from('daily_sales').insert({
      user_id: me.id, date: f.date,
      renewal: +f.renewal, upsell: isFutureMonth ? 0 : +f.upsell,
      policies_sold: +f.policies_sold, policies_collected: +f.policies_collected,
      money_collected: +f.money_collected, note: f.note || null,
    });
    setBusy(false);
    if (error) return notify('บันทึกไม่สำเร็จ: ' + error.message, 'error');
    notify('✅ บันทึกยอดขายเรียบร้อยแล้ว');
    setF({ ...empty, date:f.date }); load(); goto('dashboard');
  };

  const undo = async () => {
    const mine = sales.filter(r => r.user_id === me.id)
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (!mine.length) return notify('ไม่มีรายการให้ยกเลิก', 'warn');
    if (!confirm(`ยกเลิกรายการล่าสุด ${thaiDate(mine[0].date)} • ${fmtBaht(mine[0].total_sales)} ?`)) return;
    await supabase.from('daily_sales').delete().eq('id', mine[0].id);
    notify('↩️ ยกเลิกรายการล่าสุดแล้ว'); load();
  };

  const resetToday = async () => {
    if (!confirm('ลบยอดขายของวันนี้ทั้งหมด?')) return;
    await supabase.from('daily_sales').delete().eq('user_id', me.id).eq('date', today);
    notify('🗑️ ล้างยอดขายวันนี้แล้ว', 'warn'); load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">➕ เพิ่มยอดขาย</h2>

      <div className="card space-y-4">
        <div>
          <label className="label">📅 วันที่</label>
          <input type="date" className="input" value={f.date} onChange={e => set('date', e.target.value)} />
          {isFutureMonth && (
            <p className="mt-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl p-2">
              ⚠️ วันที่อยู่ในเดือนถัดไป — บันทึกได้เฉพาะ <b>ยอดต่ออายุ</b> เท่านั้น
            </p>
          )}
        </div>

        <MoneyInput icon="🔄" label="ยอดต่ออายุ" value={f.renewal} onChange={v => set('renewal', v)} />
        <MoneyInput icon="⬆️" label="ยอด Upsell" value={f.upsell} onChange={v => set('upsell', v)}
          disabled={isFutureMonth} hint={isFutureMonth ? 'ปิดใช้งานสำหรับเดือนถัดไป' : undefined} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">📄 ฉบับที่ขาย</label>
            <input type="number" min="0" className="input" value={f.policies_sold}
              onChange={e => set('policies_sold', Math.max(+e.target.value || 0, 0))} />
          </div>
          <div>
            <label className="label">✅ ฉบับที่เก็บเงินแล้ว</label>
            <input type="number" min="0" className="input" value={f.policies_collected}
              onChange={e => set('policies_collected', Math.max(+e.target.value || 0, 0))} />
          </div>
        </div>

        <MoneyInput icon="💵" label="จำนวนเงินที่เก็บได้" value={f.money_collected} onChange={v => set('money_collected', v)} />

        <div>
          <label className="label">📝 หมายเหตุ (ไม่บังคับ)</label>
          <input className="input text-base font-normal" value={f.note} onChange={e => set('note', e.target.value)} placeholder="เช่น ลูกค้าคุณสมชาย" />
        </div>
      </div>

      {/* ── สรุปสด ── */}
      <div className="card bg-gradient-to-br from-brand-600 to-violet-600 text-white border-0">
        <p className="text-xs font-bold opacity-90">ยอดขายรวมรายการนี้</p>
        <p className="text-4xl font-extrabold tabular-nums">{fmtBaht(total)}</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-white/20 rounded-2xl p-2 text-center">
            <p className="text-[11px] opacity-90">% เก็บเงินตามฉบับ</p>
            <p className="text-xl font-extrabold">{fmtPct(pPct)}</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-2 text-center">
            <p className="text-[11px] opacity-90">% เก็บเงินตามยอดเงิน</p>
            <p className="text-xl font-extrabold">{fmtPct(mPct)}</p>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={busy} className="btn-primary w-full text-lg">
        {busy ? 'กำลังบันทึก...' : '💾 บันทึกยอดขาย'}
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={undo}       className="btn bg-amber-100 text-amber-800">↩️ ยกเลิกยอดล่าสุด</button>
        <button onClick={resetToday} className="btn bg-rose-100 text-rose-700">🗑️ ล้างยอดวันนี้</button>
      </div>
    </div>
  );
      }
