import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, SINGLE_USER } from '../lib/supabase';
import { monthRange, toBE, summarize, ymd } from '../lib/calc';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const now = new Date();
  const [session, setSession]   = useState(null);
  const [me, setMe]             = useState(null);
  const [loading, setLoading]   = useState(true);
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [year, setYear]         = useState(toBE(now.getFullYear()));   // พ.ศ.
  const [viewUserId, setViewUser] = useState(null);                    // คนที่กำลังดู
  const [profiles, setProfiles] = useState([]);
  const [targets, setTargets]   = useState([]);
  const [sales, setSales]       = useState([]);
  const [toast, setToast]       = useState(null);

  const notify = useCallback((msg, type='success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }, []);

  /* ---- Auth ---- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setMe(null); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { setMe(data); setViewUser(v => v || data?.id); });
  }, [session]);

  /* ---- โหลดข้อมูลของ "เดือนที่เลือก" เท่านั้น ---- */
  const load = useCallback(async () => {
    if (!session) return;
    const { from, to } = monthRange(year, month);
    const [p, t, s] = await Promise.all([
      supabase.from('profiles').select('*').order('name'),
      supabase.from('monthly_targets').select('*').eq('year', year).eq('month', month),
      supabase.from('daily_sales').select('*').gte('date', from).lte('date', to).order('date', { ascending:false }),
    ]);
    setProfiles(p.data || []); setTargets(t.data || []); setSales(s.data || []);
  }, [session, year, month]);

  useEffect(() => { load(); }, [load]);

  /* ---- Realtime: มีคนบันทึกยอด → รีเฟรชทันที ---- */
  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel('rt-daily-sales')
      .on('postgres_changes', { event:'*', schema:'public', table:'daily_sales' },     load)
      .on('postgres_changes', { event:'*', schema:'public', table:'monthly_targets' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session, load]);

  const cutoff = me?.cutoff_time || '17:30';

  /* ---- Selector: สรุปของผู้ใช้คนใดก็ได้ ---- */
  const summaryOf = useCallback((uid) => summarize({
    sales:  sales.filter(r => r.user_id === uid),
    target: targets.find(t => t.user_id === uid) || null,
    yearBE: year, month, cutoff, today: ymd(new Date()),
  }), [sales, targets, year, month, cutoff]);

  /* ---- สรุปทั้งทีม ---- */
  const teamSummary = useMemo(() => {
    const list = (SINGLE_USER ? profiles.filter(p => p.id === me?.id) : profiles)
      .map(p => ({ profile:p, s: summaryOf(p.id) }))
      .sort((a,b) => b.s.percentOfTarget - a.s.percentOfTarget);
    const agg = list.reduce((a, x) => ({
      total:a.total + x.s.total, renewal:a.renewal + x.s.renewal, upsell:a.upsell + x.s.upsell,
      monthlyTarget:a.monthlyTarget + x.s.monthlyTarget, pack:a.pack + x.s.pack,
      today:a.today + x.s.todaySales,
      policiesSold:a.policiesSold + x.s.policiesSold,
      policiesCollected:a.policiesCollected + x.s.policiesCollected,
      moneyCollected:a.moneyCollected + x.s.moneyCollected,
    }), { total:0,renewal:0,upsell:0,monthlyTarget:0,pack:0,today:0,policiesSold:0,policiesCollected:0,moneyCollected:0 });
    return { list, agg };
  }, [profiles, summaryOf, me]);

  const isAdmin  = me?.role === 'admin';
  const canEdit  = (row) => isAdmin || row?.user_id === me?.id;
  const viewUser = profiles.find(p => p.id === viewUserId) || me;

  return (
    <Ctx.Provider value={{
      session, me, isAdmin, loading, toast, notify,
      month, setMonth, year, setYear, cutoff,
      profiles, targets, sales, load,
      viewUserId, setViewUser, viewUser,
      summaryOf, teamSummary, canEdit, SINGLE_USER,
      mySummary: me ? summaryOf(me.id) : null,
      myTarget: targets.find(t => t.user_id === me?.id) || null,
    }}>{children}</Ctx.Provider>
  );
      }
