import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const NAV = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/benchmarks', label: 'Base salaires' },
  { to: '/admin/prompts', label: 'IA & Prompts' },
  { to: '/admin/emails', label: 'Séquence emails' },
  { to: '/admin/orders', label: 'Commandes' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate('/admin/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-paper/60">Vérification…</div>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 bg-black/30 border-r border-paper/10 p-4 flex flex-col">
        <p className="font-display font-bold text-gold mb-6 px-2">Le Négociateur · Admin</p>
        <nav className="space-y-1 flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm ${
                  isActive ? 'bg-gold text-ink font-bold' : 'text-paper/70 hover:bg-paper/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/admin/login');
          }}
          className="text-paper/50 text-sm text-left px-3 py-2 hover:text-paper"
        >
          Déconnexion
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
