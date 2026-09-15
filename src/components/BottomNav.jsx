const TABS = [
  { k:'dashboard', icon:'🏠', label:'หน้าหลัก' },
  { k:'add',       icon:'➕', label:'เพิ่มยอด' },
  { k:'history',   icon:'📊', label:'ประวัติ' },
  { k:'goals',     icon:'🎯', label:'เป้าหมาย' },
  { k:'settings',  icon:'⚙️', label:'ตั้งค่า' },
];
export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto grid grid-cols-5">
        {TABS.map(t => {
          const active = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`py-2.5 flex flex-col items-center gap-0.5 transition ${active ? 'text-brand-600' : 'text-slate-400'}`}>
              <span className={`text-2xl transition-transform ${active ? 'scale-125 -translate-y-0.5' : ''}`}>{t.icon}</span>
              <span className="text-[10px] font-bold">{t.label}</span>
              {active && <span className="w-6 h-1 bg-brand-600 rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
