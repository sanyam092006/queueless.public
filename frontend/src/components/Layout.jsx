import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const userLinks = [
  { to: '/counters', label: 'Service counters' },
  { to: '/my-tokens', label: 'My tokens' },
];
const adminLinks = [{ to: '/admin', label: 'Queue dashboard' }];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = user.role === 'admin' ? adminLinks : userLinks;

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-brand-900 text-white transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 py-6">
          <p className="text-xl font-extrabold tracking-tight">QueueLess</p>
          <p className="text-xs text-brand-100/70">Smart queue management</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-white/15 text-white' : 'text-brand-100/80 hover:bg-white/10'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-brand-100/70">{user.email} ({user.role})</p>
          <button onClick={signOut} className="btn mt-3 w-full bg-white/10 text-white hover:bg-white/20">Sign out</button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="btn btn-ghost" aria-label="Open menu">Menu</button>
          <span className="font-extrabold text-brand-700">QueueLess</span>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
