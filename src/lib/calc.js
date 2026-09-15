export const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export const TH_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

/* ---------- พ.ศ. ⇄ ค.ศ. ---------- */
export const toBE = (ce) => ce + 543;
export const toCE = (be) => be - 543;

/* ---------- Format ---------- */
export const fmtMoney = (n) =>
  new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0));
export const fmtBaht  = (n) => `${fmtMoney(n)} บาท`;
export const fmtPct   = (n) => `${(Number.isFinite(+n) ? +n : 0).toFixed(2)}%`;

/* ---------- สูตรพื้นฐาน (หาร 0 = 0 เสมอ) ---------- */
export const pct = (part, whole) => (!whole || whole <= 0 ? 0 : (Number(part) / Number(whole)) * 100);
export const totalSales    = (renewal, upsell) => (+renewal || 0) + (+upsell || 0);
export const monthlyTarget = (pack, targetPercent) => ((+pack || 0) * (+targetPercent || 0)) / 100;
export const dailyTarget   = (mTarget, workDays) => (!workDays || workDays <= 0 ? 0 : mTarget / workDays);
export const remainingAmt  = (mTarget, total) => Math.max((+mTarget || 0) - (+total || 0), 0);

/* ---------- วันที่ ---------- */
export const ymd = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};
export const monthRange = (yearBE, month) => {
  const y = toCE(yearBE);
  return { from: ymd(new Date(y, month-1, 1)), to: ymd(new Date(y, month, 0)) };
};
export const thaiDate = (s) => {
  const d = new Date(s);
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${toBE(d.getFullYear())}`;
};

/**
 * สร้างรายการ "วันทำงาน" ของเดือน จากจำนวนวันที่ตั้งไว้
 * ฐาน = จันทร์–ศุกร์ ; ถ้าตั้งมากกว่า → เติมเสาร์ ; ถ้าน้อยกว่า → ตัดท้ายออก
 */
export function workingDayList(yearBE, month, workDays) {
  const y = toCE(yearBE), last = new Date(y, month, 0).getDate();
  const weekdays = [], sats = [], suns = [];
  for (let d = 1; d <= last; d++) {
    const w = new Date(y, month-1, d).getDay();
    if (w >= 1 && w <= 5) weekdays.push(d);
    else if (w === 6) sats.push(d); else suns.push(d);
  }
  let list = [...weekdays];
  if (workDays < list.length) list = list.slice(0, workDays);
  else { const extra = [...sats, ...suns];
         let i = 0; while (list.length < workDays && i < extra.length) list.push(extra[i++]);
         list.sort((a,b)=>a-b); }
  return list;
}

/**
 * 🕔 วันทำงานที่เหลือ — ลดอัตโนมัติหลังเวลาตัดรอบ (ค่าเริ่มต้น 17:30)
 */
export function remainingWorkingDays(yearBE, month, workDays, cutoff = '17:30', now = new Date()) {
  const list = workingDayList(yearBE, month, workDays);
  const y = toCE(yearBE);
  const curY = now.getFullYear(), curM = now.getMonth() + 1;
  if (y > curY || (y === curY && month > curM)) return list.length;   // เดือนอนาคต
  if (y < curY || (y === curY && month < curM)) return 0;             // เดือนที่ผ่านมา

  const [ch, cm] = cutoff.split(':').map(Number);
  const passedCutoff = now.getHours() > ch || (now.getHours() === ch && now.getMinutes() >= cm);
  const today = now.getDate();
  return list.filter(d => d > today || (d === today && !passedCutoff)).length;
}

/* ---------- 🎯 สถานะเป้า ---------- */
export function goalStatus(percent) {
  const p = +percent || 0;
  if (p > 100)  return { text:'🔥 เกินเป้าแล้ว',   cls:'bg-gradient-to-r from-orange-500 to-rose-500 text-white', bar:'bg-gradient-to-r from-orange-400 to-rose-500' };
  if (p >= 100) return { text:'🎉 ถึงเป้าแล้ว',    cls:'bg-gradient-to-r from-emerald-500 to-teal-500 text-white', bar:'bg-gradient-to-r from-emerald-400 to-teal-500' };
  if (p >= 80)  return { text:'✨ ใกล้ถึงเป้าแล้ว', cls:'bg-amber-100 text-amber-800',  bar:'bg-gradient-to-r from-amber-400 to-orange-400' };
  if (p >= 50)  return { text:'💪 กำลังไปได้ดี',   cls:'bg-sky-100 text-sky-800',      bar:'bg-gradient-to-r from-sky-400 to-brand-500' };
  return          { text:'⚡ ต้องเร่งยอด',         cls:'bg-rose-100 text-rose-700',    bar:'bg-gradient-to-r from-rose-400 to-pink-500' };
}

/**
 * ⭐ ตัวสรุปกลาง — ทุกหน้าเรียกใช้ฟังก์ชันนี้ตัวเดียว (Single Source of Truth)
 */
export function summarize({ sales = [], target = null, yearBE, month, cutoff = '17:30', today = ymd(new Date()) }) {
  const t = target || { pack_amount:0, target_percent:0, working_days:1 };
  const pack  = +t.pack_amount || 0;
  const tPct  = +t.target_percent || 0;
  const wDays = +t.working_days || 1;

  const sum = (k) => sales.reduce((a, r) => a + (+r[k] || 0), 0);
  const renewal          = sum('renewal');
  const upsell           = sum('upsell');
  const total            = renewal + upsell;
  const policiesSold     = sum('policies_sold');
  const policiesCollected= sum('policies_collected');
  const moneyCollected   = sum('money_collected');

  const todayRows  = sales.filter(r => r.date === today);
  const todaySales = todayRows.reduce((a,r)=>a + totalSales(r.renewal, r.upsell), 0);

  const mTarget   = monthlyTarget(pack, tPct);
  const dTarget   = dailyTarget(mTarget, wDays);
  const remaining = remainingAmt(mTarget, total);
  const daysLeft  = remainingWorkingDays(yearBE, month, wDays, cutoff);
  const dTargetLeft = daysLeft > 0 ? remaining / daysLeft : remaining;   // เป้าวันนี้ตามยอดที่ยังขาด

  const percentOfPack   = pct(total, pack);        // ⭐ ใช้แพ็คเป็นฐาน 100%
  const percentOfTarget = pct(total, mTarget);     // ความสำเร็จเทียบเป้า

  return {
    pack, targetPercent: tPct, workingDays: wDays, daysLeft,
    renewal, upsell, total, todaySales, todayCount: todayRows.length,
    policiesSold, policiesCollected, moneyCollected,
    monthlyTarget: mTarget, dailyTarget: dTarget, dailyTargetLeft: dTargetLeft, remaining,
    percentOfPack, percentOfTarget,
    renewalPct: pct(renewal, pack),
    upsellPct:  pct(upsell,  pack),
    collectByPolicyPct: pct(policiesCollected, policiesSold),
    collectByMoneyPct:  pct(moneyCollected, total),
    over: total > mTarget,
    status: goalStatus(percentOfTarget),
  };
}

/* ---------- ข้อมูลกราฟรายวัน ---------- */
export function dailyChartData(sales, yearBE, month) {
  const y = toCE(yearBE), last = new Date(y, month, 0).getDate();
  const map = {};
  sales.forEach(r => {
    const d = new Date(r.date).getDate();
    map[d] = map[d] || { renewal:0, upsell:0 };
    map[d].renewal += +r.renewal || 0;
    map[d].upsell  += +r.upsell  || 0;
  });
  let acc = 0;
  return Array.from({ length: last }, (_, i) => {
    const d = i + 1, v = map[d] || { renewal:0, upsell:0 };
    const tot = v.renewal + v.upsell; acc += tot;
    return { day:String(d), วันที่:d, ต่ออายุ:v.renewal, Upsell:v.upsell, ยอดรวม:tot, สะสม:acc };
  });
                                                                                       }
