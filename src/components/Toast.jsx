export default function Toast({ toast }) {
  if (!toast) return null;
  const tone = toast.type === 'error' ? 'bg-rose-600' : toast.type === 'warn' ? 'bg-amber-500' : 'bg-emerald-600';
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] ${tone} text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-[slideDown_.25s_ease-out] max-w-[90vw] text-center`}>
      {toast.msg}
    </div>
  );
}
