import { useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddSale from './pages/AddSale';
import History from './pages/History';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';

function Shell() {
  const { session, loading, toast } = useApp();
  const [tab, setTab] = useState('dashboard');
  if (loading) return <div className="min-h-screen grid place-items-center text-4xl animate-pulse">📈</div>;
  if (!session) return <Login />;

  const PAGES = { dashboard:Dashboard, add:AddSale, history:History, goals:Goals, settings:Settings, admin:AdminPanel };
  const Page = PAGES[tab] || Dashboard;

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 pt-4 pb-28">
      <Toast toast={toast} />
      <Page goto={setTab} />
      <BottomNav tab={tab === 'admin' ? 'settings' : tab} setTab={setTab} />
    </div>
  );
}

export default function App() { return <AppProvider><Shell /></AppProvider>; }
