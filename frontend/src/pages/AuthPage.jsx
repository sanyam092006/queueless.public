import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import { ErrorBox } from '../components/ui.jsx';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = isLogin ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
      navigate(u.role === 'admin' ? '/admin' : '/counters');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <p className="text-2xl font-extrabold tracking-tight">QueueLess</p>
        <div>
          <p className="num text-8xl font-extrabold leading-none text-brand-100">B-014</p>
          <p className="mt-6 max-w-sm text-lg text-brand-100/80">Take a token from your phone, see your place in line, and arrive when it is almost your turn.</p>
        </div>
        <p className="text-sm text-brand-100/60">Banks, clinics, government desks, campus offices.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Sign in' : 'Create your account'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isLogin ? 'Welcome back to QueueLess.' : 'Join a queue in under a minute.'}</p>
          </div>
          <ErrorBox message={error} />
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="name">Full name</label>
              <input id="name" className="input" required value={form.name} onChange={set('name')} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required minLength={6} value={form.password} onChange={set('password')} />
          </div>
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-500">
            {isLogin ? 'New here? ' : 'Already registered? '}
            <Link className="font-semibold text-brand-700 hover:underline" to={isLogin ? '/register' : '/login'}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
