import { useApp } from '../store/AppContext';
import { Progress } from '../components/Progress';
import { TH_MONTHS, fmtBaht, fmtMoney, fmtPct } from '../lib/calc';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function Goals() {
  const { me, month, year, summaryOf, teamSummary, SINGLE_USER } = useApp();
  const s = summaryOf(me?.id);
  const { list, agg } = teamSummary;
  const teamPct = agg.monthlyTarget > 0 ? (agg.total / agg.monthlyTarget) * 100 : 0;

  const chart = list.map(x => ({
    ชื่อ: x.profile.name, ต่ออายุ:x.s.renewal, Upsell:x.s.upsell, เป้าหมาย:x.s.monthlyTarget,
  }));

  const shareTeam = () => {
    const txt =
`🏆 สรุปผลงานทีม
🗓️ ${TH_MONTHS[month-1]} ${year}
━━━━━━━━━━━━━━
💰 ยอดทีมรวม ${fmtBaht(agg.total)}
🎯 เป้าทีม    ${fmtBaht(agg.monthlyTarget)} (${fmtPct(teamPct)})
━━━━━━━━━━━━━━
${list.map((x,i) => `${['🥇','🥈','🥉'][i] || `${i+1}.`} ${x.profile.name}  ${fmtMoney(x.s.total)} (${fmtPct(x.s.percentOfTarget)})`).join('\n')}`;
    if (navigator.share) navigator.share({ title:'สรุปทีม', text:txt }).catch(()=>{});
    else window.open(`https://line.me/R/msg/text/?${encodeURIComponent(txt)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">🎯 เป้าหมาย {TH_MONTHS[month-1]} {year}</h2>

      {/* เป้าของฉัน */}
      <div className="card bg-gradient-to-br from-violet-600 to-brand-600 text-white border-0">
        <p className="text-xs opacity-90 font-bold">เป้าหมายของฉัน</p>
        <p className="text-4xl font-extrabold tabular-nums">{fmtBaht(s.monthlyTarget)}</p>
        <div className="mt-3"><Progress percent={s.percentOfTarget} barClass="bg-white" height="h-4" showLabel={false} /></div>
        <div className="flex justify-between text-xs font-bold mt-2 opacity-90">
          <span>ทำได้ {fmtBaht(s.total)}</span><span>{fmtPct(s.percentOfTarget)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-white/20 rounded-2xl p-2"><p className="text-[11px]">ยังขาด</p><p className="font-extrabold text-sm">{fmtMoney(s.remaining)}</p></div>
          <div className="bg-white/20 rounded-2xl p-2"><p className="text-[11px]">วันที่เหลือ</p><p className="font-extrabold text-sm">{s.daysLeft} วัน</p></div>
          <div className="bg-white/20 rounded-2xl p-2"><p className="text-[11px]">ต้องทำ/วัน</p><p className="font-extrabold text-sm">{fmtMoney(s.dailyTargetLeft)}</p></div>
        </div>
      </div>

      {!SINGLE_USER && (
        <>
          <div className="card">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold">👥 ผลงานทีมรวม</h3>
              <button onClick={shareTeam} className="chip bg-emerald-500 text-white">📤 แชร์ไลน์</button>
            </div>
            <p className="text-3xl font-extrabold tabular-nums">{fmtBaht(agg.total)}</p>
            <p className="text-xs text-slate-500 font-bold mb-2">จากเป้า {fmtBaht(agg.monthlyTarget)}</p>
            <Progress percent={teamPct} barClass="bg-gradient-to-r from-emerald-400 to-teal-500" />
          </div>

          <div className="card">
            <h3 className="font-extrabold mb-3">📊 เปรียบเทียบรายบุคคล</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, chart.length * 56)}>
              <BarChart data={chart} layout="vertical" margin={{ left:8, right:16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v => v>=1000 ? `${Math.round(v/1000)}k` : v} />
                <YAxis type="category" dataKey="ชื่อ" width={70} tick={{ fontSize:11 }} />
                <Tooltip formatter={v => fmtBaht(v)} /><Legend />
                <Bar dataKey="ต่ออายุ" stackId="a" fill="#10d9a3" radius={[0,0,0,0]} />
                <Bar dataKey="Upsell"  stackId="a" fill="#8b5cf6" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-extrabold mb-3">🏅 ตารางอันดับ</h3>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 text-left">
                  <th className="py-2">#</th><th>เซลล์</th><th className="text-right">ยอดรวม</th><th className="text-right">%</th>
                </tr></thead>
                <tbody>
                  {list.map((x,i) => (
                    <tr key={x.profile.id} className="border-t border-slate-100">
                      <td className="py-2 font-bold">{['🥇','🥈','🥉'][i] || i+1}</td>
                      <td className="font-bold">{x.profile.avatar_emoji} {x.profile.name}</td>
                      <td className="text-right tabular-nums font-bold">{fmtMoney(x.s.total)}</td>
                      <td className="text-right"><span className={`chip text-[10px] ${x.s.status.cls}`}>{fmtPct(x.s.percentOfTarget)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
