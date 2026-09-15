import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email:'', password:'', name:'' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email:f.email, password:f.password })
      : await supabase.auth.signUp({ email:f.email, password:f.password, options:{ data:{ name:f.name } } });
    setBusy(false);
    if (error) setErr(error.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600">
      <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-5xl">📈</div>
          <h1 className="text-3xl font-extrabold text-brand-700">Daily Sales</h1>
          <p className="text-xs text-slate-400 font-bold">ระบบบันทึกยอดขายเซลล์</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <div><label className="label">ชื่อเซลล์</label>
              <input className="input" required value={f.name} onChange={e => setF(p=>({...p,name:e.target.value}))} /></div>
          )}
          <div><label className="label">อีเมล</label>
            <input type="email" className="input" required value={f.email} onChange={e => setF(p=>({...p,email:e.target.value}))} /></div>
          <div><label className="label">รหัสผ่าน</label>
            <input type="password" className="input" required minLength={6} value={f.password} onChange={e => setF(p=>({...p,password:e.target.value}))} /></div>
          {err && <p className="text-sm font-bold text-rose-600 bg-rose-50 rounded-xl p-2">{err}</p>}
          <button disabled={busy} className="btn-primary w-full text-lg">
            {busy ? 'กำลังดำเนินการ...' : mode === 'login' ? '🔓 เข้าสู่ระบบ' : '✨ สมัครสมาชิก'}
          </button>
        </form>
        <button onClick={() => setMode(m => m==='login'?'signup':'login')}
          className="w-full mt-3 text-sm font-bold text-brand-600">
          {mode === 'login' ? 'ยังไม่มีบัญชี? สมัครเลย' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  );
}
