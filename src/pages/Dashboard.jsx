import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { StatCard } from '../components/StatCard';
import { Progress } from '../components/Progress';
import { TH_MONTHS, fmtBaht, fmtMoney, fmtPct, dailyChartData, toBE } from '../lib/calc';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
         AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const { me, month, setMonth, year, setYear, viewUser, setViewUser, profiles,
          summaryOf, sales, teamSummary, SINGLE_USER } = useApp();
  const [metric, setMetric] = useState('ยอดรวม');
  const uid = viewUser?.id || me?.id;
  const s   = summaryOf(uid);
  const mySales = sales.filter(r => r.user_id === uid);
  const chart   = useMemo(() => dailyChartData(mySales, year, month), [mySales, year, month]);

  const years = Array.from({ length:5 }, (_, i) => toBE(new Date().getFullYear()) - 1 + i);
  const pie = [
    { name:'ต่ออายุ', value:s.renewal, color:'#10d9a3' },
    { name:'Upsell',  value:s.upsell,  color:'#8b5cf6' },
    { name:'ยังขาด',  value:s.remaining, color:'#e2e8f0' },
  ].filter(x => x.value > 0);

  const share = () => {
    const txt =
`📊 สรุปยอดขาย ${viewUser?.name}
🗓️ ${TH_MONTHS[month-1]} ${year}
━━━━━━━━━━━━━━
💰 ยอดขายรวม  ${fmtBaht(s.total)} (${fmtPct(s.percentOfPack)})
🔄 ต่ออายุ      ${fmtBaht(s.renewal)} (${fmtPct(s.renewalPct)})
⬆️ Upsell       ${fmtBaht(s.upsell)} (${fmtPct(s.upsellPct)})
🎯 เป้าเดือน    ${fmtBaht(s.monthlyTarget)}
📈 ความสำเร็จ   ${fmtPct(s.percentOfTarget)}
⏳ ยังขาด       ${fmtBaht(s.remaining)} (เหลือ ${s.daysLeft} วัน)
🧾 เก็บเงิน/ฉบับ ${fmtPct(s.collectByPolicyPct)}
💵 เก็บเงิน/ยอด  ${fmtPct(s.collectByMoneyPct)}
${s.status.text}`;
    if (navigator.share) navigator.share({ title:'Daily Sales', text:txt }).catch(()=>{});
    else window.open(`https://line.me/R/msg/text/?${encodeURIComponent(txt)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-brand-600 to-violet-600 text-white rounded-b-[2.5rem] -mx-4 -mt-4 px-4 pt-5 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Daily Sales</h1>
            <p className="text-xs opacity-80">ระบบบันทึกยอดขายเซลล์</p>
          </div>
          <button onClick={share} className="bg-white/20 rounded-2xl px-3 py-2 text-sm font-bold active:scale-95">📤 แชร์</button>
        </div>

        {/* เลือกเซลล์ / เดือน / ปี */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {!SINGLE_USER ? (
            <select value={uid} onChange={e => setViewUser(e.target.value)}
              className="bg-white/20 rounded-xl px-2 py-2 text-sm font-bold outline-none">
              {profiles.map(p => <option key={p.id} value={p.id} className="text-slate-800">
                {p.avatar_emoji} {p.name}{p.id === me?.id ? ' (ฉัน)' : ''}</option>)}
            </select>
          ) : <div className="bg-white/20 rounded-xl px-2 py-2 text-sm font-bold truncate">{me?.avatar_emoji} {me?.name}</div>}

          <select value={month} onChange={e => setMonth(+e.target.value)}
            className="bg-white/20 rounded-xl px-2 py-2 text-sm font-bold outline-none">
            {TH_MONTHS.map((m, i) => <option key={m} value={i+1} className="text-slate-800">{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(+e.target.value)}
            className="bg-white/20 rounded-xl px-2 py-2 text-sm font-bold outline-none">
            {years.map(y => <option key={y} value={y} className="text-slate-800">พ.ศ. {y}</option>)}
          </select>
        </div>
      </div>

      {/* ── สถานะ + Progress ── */}
      <div className="card -mt-10 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className={`chip ${s.status.cls}`}>{s.status.text}</span>
          <span className="text-xs font-bold text-slate-400">เหลือ {s.daysLeft} วันทำงาน</span>
        </div>
        <Progress percent={s.percentOfTarget} barClass={s.status.bar} height="h-6" />
        <div className="flex justify-between mt-2 text-xs font-bold text-slate-500">
          <span>ทำได้ {fmtBaht(s.total)}</span>
          <span>เป้า {fmtBaht(s.monthlyTarget)}</span>
        </div>
        <div className={`mt-3 rounded-2xl p-3 text-center font-extrabold ${s.over ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {s.over ? `🎉 เกินเป้า ${fmtBaht(s.total - s.monthlyTarget)}`
                  : `ยังขาดอีก ${fmtBaht(s.remaining)} • เฉลี่ยวันละ ${fmtBaht(s.dailyTargetLeft)}`}
        </div>
      </div>

      {/* ── Cards หลัก ── */}
      <StatCard icon="💰" title="ยอดขายวันนี้" value={s.todaySales} tone="brand" big />
      <div className="grid grid-cols-1 gap-3">
        <StatCard icon="📊" title="ยอดขายรวม"   value={s.total}   percent={s.percentOfPack} tone="mint" />
        <StatCard icon="🔄" title="งานต่ออายุ"  value={s.renewal} percent={s.renewalPct}    tone="grape" />
        <StatCard icon="⬆️" title="งานอัพเซลล์" value={s.upsell}  percent={s.upsellPct}     tone="sun" />
        <StatCard icon="🎯" title="เป้าหมายรายวัน" value={s.dailyTarget} tone="rose" />
      </div>

      {/* ── ตัวเลขสรุป ── */}
      <div className="card grid grid-cols-2 gap-3 text-sm">
        {[
          ['📦 ยอดแพ็คที่ได้รับ', fmtBaht(s.pack)],
          ['⚙️ % เป้าหมายที่ตั้ง', fmtPct(s.targetPercent)],
          ['🎯 เป้าหมายรายเดือน', fmtBaht(s.monthlyTarget)],
          ['📅 จำนวนวันทำงาน', `${s.workingDays} วัน`],
          ['⏳ ยอดที่ต้องทำ', fmtBaht(s.remaining)],
          ['📈 % ความสำเร็จ', fmtPct(s.percentOfTarget)],
          ['🧾 % เก็บเงินตามฉบับ', fmtPct(s.collectByPolicyPct)],
          ['💵 % เก็บเงินตามยอดเงิน', fmtPct(s.collectByMoneyPct)],
          ['📄 ฉบับที่ขาย/เก็บแล้ว', `${s.policiesSold} / ${s.policiesCollected}`],
          ['💰 เงินที่เก็บได้', fmtBaht(s.moneyCollected)],
        ].map(([k, v]) => (
          <div key={k} className="bg-slate-50 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-slate-500">{k}</p>
            <p className="text-base font-extrabold tabular-nums text-slate-800">{v}</p>
          </div>
        ))}
      </div>

      {/* ── กราฟรายวัน ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold">📈 ยอดขายรายวัน</h3>
          <div className="flex gap-1">
            {['ยอดรวม','ต่ออายุ','Upsell'].map(m => (
              <button key={m} onClick={() => setMetric(m)}
                className={`chip text-[11px] ${metric===m ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{m}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chart} margin={{ left:-22, right:4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="day" tick={{ fontSize:10 }} interval={2} />
            <YAxis tick={{ fontSize:10 }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
            <Tooltip formatter={v => fmtBaht(v)} labelFormatter={d => `วันที่ ${d}`} />
            <Bar dataKey={metric} radius={[6,6,0,0]} fill={metric==='ต่ออายุ' ? '#10d9a3' : metric==='Upsell' ? '#8b5cf6' : '#2b7fff'} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── กราฟสะสมเทียบเป้า ── */}
      <div className="card">
        <h3 className="font-extrabold mb-3">🚀 ยอดสะสม vs เป้าหมาย</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chart.map(d => ({ ...d, เป้าหมาย:s.monthlyTarget }))} margin={{ left:-22, right:4 }}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b7fff" stopOpacity={.55}/><stop offset="100%" stopColor="#2b7fff" stopOpacity={0}/>
            </linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="day" tick={{ fontSize:10 }} interval={2} />
            <YAxis tick={{ fontSize:10 }} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
            <Tooltip formatter={v => fmtBaht(v)} />
            <Area type="monotone" dataKey="สะสม"   stroke="#2b7fff" fill="url(#g1)" strokeWidth={3} />
            <Area type="monotone" dataKey="เป้าหมาย" stroke="#ff5c7a" fill="none" strokeDasharray="6 6" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── วงกลมสัดส่วน ── */}
      {pie.length > 0 && (
        <div className="card">
          <h3 className="font-extrabold mb-2">🍩 สัดส่วนยอดขาย</h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                {pie.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => fmtBaht(v)} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── เปรียบเทียบทีม ── */}
      {!SINGLE_USER && (
        <div className="card">
          <h3 className="font-extrabold mb-3">🏆 อันดับทีม (% ความสำเร็จ)</h3>
          {teamSummary.list.map((x, i) => (
            <div key={x.profile.id} className="mb-3">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{['🥇','🥈','🥉'][i] || `${i+1}.`} {x.profile.avatar_emoji} {x.profile.name}</span>
                <span className="tabular-nums">{fmtMoney(x.s.total)} • {fmtPct(x.s.percentOfTarget)}</span>
              </div>
              <Progress percent={x.s.percentOfTarget} barClass={x.s.status.bar} height="h-3" showLabel={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
        }
