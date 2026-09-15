import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import MoneyInput from '../components/MoneyInput';
import { fmtBaht, fmtMoney, fmtPct, pct, thaiDate, ymd } from '../lib/calc';

const FILTERS = [['today','วันนี้'],['week','สัปดาห์นี้'],['month','เดือนนี้'],['range','เลือกช่วง']];

export default function History() {
  const { sales, viewUser, me, canEdit, notify, load } = useApp();
  const [filter, setFilter] = useState('month');
  const [range, setRange]   = useState({ from:'', to:'' });
  const [edit, setEdit]     = useState(null);

  const rows = useMemo(() => {
    const uid = viewUser?.id || me?.id;
    let r = sales.filter(x => x.user_id === uid);
    const now = new Date(), today = ymd(now);
    if (filter === 'today') r = r.filter(x => x.date === today);
    if (filter === 'week') {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      r = r.filter(x => x.date >= ymd(mon) && x.date <= today);
    }
    if (filter === 'range' && range.from && range.to)
      r = r.filter(x => x.date >= range.from && x.date <= range.to);
    return r.sort((a,b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  }, [sales, filter, range, viewUser, me]);

  const sum = (k) => rows.reduce((a,r) => a + (+r[k] || 0), 0);

  const remove = async (row) => {
    if (!canEdit(row)) return notify('คุณไม่มีสิทธิ์ลบรายการนี้', 'error');
    if (!confirm(`ลบรายการวันที่ ${thaiDate(row.date)} ?`)) return;
    await supabase.from('daily_sales').delete().eq('id', row.id);
    notify('🗑️ ลบรายการแล้ว'); load();
  };

  const saveEdit = async () => {
    const e = edit;
    if (+e.policies_collected > +e.policies_sold) return notify('ฉบับที่เก็บเงินเกินฉบับที่ขาย', 'error');
    const tot = (+e.renewal || 0) + (+e.upsell || 0);
    if (+e.money_collected > tot) return notify('เงินที่เก็บเกินยอดขายรวม', 'error');
    const { error } = await supabase.from('daily_sales').update({
      date:e.date, renewal:+e.renewal, upsell:+e.upsell, policies_sold:+e.policies_sold,
      policies_collected:+e.policies_collected, money_collected:+e.money_collected, note:e.note,
    }).eq('id', e.id);
    if (error) return notify('แก้ไขไม่สำเร็จ: ' + error.message, 'error');
    notify('✏️ แก้ไขเรียบร้อยแล้ว'); setEdit(null); load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">📊 ประวัติยอดขาย</h2>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`chip ${filter===k ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{l}</button>
        ))}
      </div>
      {filter === 'range' && (
        <div className="card grid grid-cols-2 gap-2">
          <input type="date" className="input text-base" value={range.from} onChange={e => setRange(p => ({...p, from:e.target.value}))} />
          <input type="date" className="input text-base" value={range.to}   onChange={e => setRange(p => ({...p, to:e.target.value}))} />
        </div>
      )}

      {/* สรุปช่วงที่เลือก */}
      <div className="card bg-slate-900 text-white border-0 grid grid-cols-3 gap-2 text-center">
        <div><p className="text-[11px] opacity-70">รวม</p><p className="font-extrabold">{fmtMoney(sum('total_sales'))}</p></div>
        <div><p className="text-[11px] opacity-70">ต่ออายุ</p><p className="font-extrabold text-emerald-400">{fmtMoney(sum('renewal'))}</p></div>
        <div><p className="text-[11px] opacity-70">Upsell</p><p className="font-extrabold text-violet-400">{fmtMoney(sum('upsell'))}</p></div>
      </div>

      {rows.length === 0 && <div className="card text-center py-10 text-slate-400 font-bold">📭 ยังไม่มีข้อมูลในช่วงนี้</div>}

      {rows.map(r => {
        const pPct = pct(r.policies_collected, r.policies_sold);
        const mPct = pct(r.money_collected, r.total_sales);
        return (
          <div key={r.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-brand-700">{thaiDate(r.date)}</p>
                {r.note && <p className="text-xs text-slate-400">📝 {r.note}</p>}
              </div>
              <p className="text-2xl font-extrabold tabular-nums">{fmtMoney(r.total_sales)}<span className="text-xs ml-1">฿</span></p>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
              <div className="bg-emerald-50 rounded-xl p-2"><p className="text-slate-500">ต่ออายุ</p><p className="font-bold">{fmtMoney(r.renewal)}</p></div>
              <div className="bg-violet-50 rounded-xl p-2"><p className="text-slate-500">Upsell</p><p className="font-bold">{fmtMoney(r.upsell)}</p></div>
              <div className="bg-sky-50 rounded-xl p-2"><p className="text-slate-500">ฉบับ</p><p className="font-bold">{r.policies_collected}/{r.policies_sold}</p></div>
              <div className="bg-amber-50 rounded-xl p-2"><p className="text-slate-500">เก็บเงิน</p><p className="font-bold">{fmtMoney(r.money_collected)}</p></div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-2">
              <span>🧾 เก็บตามฉบับ {fmtPct(pPct)}</span><span>💵 เก็บตามยอดเงิน {fmtPct(mPct)}</span>
            </div>
            {canEdit(r) && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => setEdit({ ...r })} className="btn bg-slate-100 text-sm">✏️ แก้ไข</button>
                <button onClick={() => remove(r)} className="btn bg-rose-50 text-rose-600 text-sm">🗑️ ลบ</button>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal แก้ไข */}
      {edit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setEdit(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-5 max-h-[90vh] overflow-y-auto space-y-3"
               onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg">✏️ แก้ไขรายการ</h3>
            <input type="date" className="input" value={edit.date} onChange={e => setEdit(p => ({...p, date:e.target.value}))} />
            <MoneyInput icon="🔄" label="ยอดต่ออายุ" value={+edit.renewal} onChange={v => setEdit(p => ({...p, renewal:v}))} />
            <MoneyInput icon="⬆️" label="ยอด Upsell" value={+edit.upsell} onChange={v => setEdit(p => ({...p, upsell:v}))} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">ฉบับที่ขาย</label>
                <input type="number" min="0" className="input" value={edit.policies_sold}
                  onChange={e => setEdit(p => ({...p, policies_sold:Math.max(+e.target.value||0,0)}))} /></div>
              <div><label className="label">ฉบับที่เก็บแล้ว</label>
                <input type="number" min="0" className="input" value={edit.policies_collected}
                  onChange={e => setEdit(p => ({...p, policies_collected:Math.max(+e.target.value||0,0)}))} /></div>
            </div>
            <MoneyInput icon="💵" label="เงินที่เก็บได้" value={+edit.money_collected} onChange={v => setEdit(p => ({...p, money_collected:v}))} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => setEdit(null)} className="btn-ghost">ยกเลิก</button>
              <button onClick={saveEdit} className="btn-primary">💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
          }
