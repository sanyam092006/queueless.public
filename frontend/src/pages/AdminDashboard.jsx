import { useState } from 'react';
import api, { errMsg } from '../api.js';
import usePolling from '../hooks/usePolling.js';
import { EmptyState, ErrorBox, PageHeader, Spinner, StatCard, StatsBar, StatusBadge } from '../components/ui.jsx';

const emptyForm = { name: '', prefix: '', avgServiceTime: 5, description: '' };

function TokenList({ queueId }) {
  const { data, loading, error } = usePolling(() => api.get(`/queues/${queueId}/tokens`).then((r) => r.data), 5000);
  if (loading) return <Spinner label="Loading tokens..." />;
  if (error) return <ErrorBox message={error} />;
  if (!data.length) return <p className="py-3 text-sm text-slate-500">No tokens have been issued for this queue yet.</p>;
  return (
    <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
      {data.map((t) => (
        <div key={t._id} className="flex items-center justify-between px-3 py-2 text-sm">
          <span><span className="num font-bold">{t.label}</span> <span className="text-slate-500">{t.user?.name || 'Deleted user'}</span></span>
          <StatusBadge status={t.status} />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: queues, loading, error, refresh } = usePolling(() => api.get('/queues').then((r) => r.data));
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState(null);

  const totals = (queues || []).reduce(
    (a, q) => ({ waiting: a.waiting + q.stats.waiting, served: a.served + q.stats.served, cancelled: a.cancelled + q.stats.cancelled, open: a.open + (q.status === 'open' ? 1 : 0) }),
    { waiting: 0, served: 0, cancelled: 0, open: 0 }
  );

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      await api.post('/queues', { ...form, avgServiceTime: Number(form.avgServiceTime) });
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setCreating(false);
    }
  };

  const act = async (id, fn) => {
    setBusyId(id);
    setActionError('');
    setNotice('');
    try {
      const res = await fn();
      if (res?.data?.message && res.data.token !== undefined) setNotice(res.data.message);
      await refresh();
    } catch (err) {
      setActionError(errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = (q) => {
    if (!window.confirm(`Delete "${q.name}" and all of its tokens? This cannot be undone.`)) return;
    act(q._id, () => api.delete(`/queues/${q._id}`));
  };

  return (
    <>
      <PageHeader title="Queue dashboard" subtitle="Create queues, call the next token and close counters. Updates every 5 seconds." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open queues" value={totals.open} />
        <StatCard label="Waiting" value={totals.waiting} tone="text-amber-600" />
        <StatCard label="Served" value={totals.served} tone="text-emerald-600" />
        <StatCard label="Cancelled" value={totals.cancelled} tone="text-red-600" />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Token analytics (all queues)</p>
        <StatsBar waiting={totals.waiting} served={totals.served} cancelled={totals.cancelled} />
      </div>

      <form onSubmit={create} className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Create a queue</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium" htmlFor="qname">Queue name</label>
            <input id="qname" className="input" required value={form.name} onChange={set('name')} placeholder="Bank Cash Counter" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="qprefix">Token prefix (1-3 letters)</label>
            <input id="qprefix" className="input uppercase" required maxLength={3} value={form.prefix} onChange={set('prefix')} placeholder="B" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="qtime">Minutes per token</label>
            <input id="qtime" type="number" min={1} max={120} className="input" required value={form.avgServiceTime} onChange={set('avgServiceTime')} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="mb-1 block text-sm font-medium" htmlFor="qdesc">Description (optional)</label>
            <input id="qdesc" className="input" maxLength={200} value={form.description} onChange={set('description')} />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <ErrorBox message={formError} />
          <button className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create queue'}</button>
        </div>
      </form>

      <h2 className="mb-3 mt-10 font-semibold text-slate-900">All queues</h2>
      <div className="mb-4 space-y-3">
        <ErrorBox message={error} />
        <ErrorBox message={actionError} />
        {notice && <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">{notice}</div>}
      </div>

      {loading ? (
        <Spinner label="Loading queues..." />
      ) : !queues?.length ? (
        <EmptyState title="No queues yet" text="Create your first queue with the form above." />
      ) : (
        <div className="space-y-4">
          {queues.map((q) => {
            const busy = busyId === q._id;
            return (
              <div key={q._id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">{q.name}</h3>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Prefix {q.prefix}, {q.avgServiceTime} min per token. Now serving{' '}
                      <span className="num font-semibold text-slate-800">{q.nowServing ? `${q.prefix}-${String(q.nowServing).padStart(3, '0')}` : 'nobody'}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-primary" disabled={busy} onClick={() => act(q._id, () => api.post(`/queues/${q._id}/next`))}>Call next</button>
                    {q.status === 'open' ? (
                      <button className="btn btn-ghost" disabled={busy} onClick={() => act(q._id, () => api.patch(`/queues/${q._id}/close`))}>Close queue</button>
                    ) : (
                      <button className="btn btn-ghost" disabled={busy} onClick={() => act(q._id, () => api.patch(`/queues/${q._id}/open`))}>Reopen</button>
                    )}
                    <button className="btn btn-danger" disabled={busy} onClick={() => remove(q)}>Delete</button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Waiting" value={q.stats.waiting} tone="text-amber-600" />
                  <StatCard label="Serving" value={q.stats.serving} tone="text-brand-600" />
                  <StatCard label="Served" value={q.stats.served} tone="text-emerald-600" />
                  <StatCard label="Cancelled" value={q.stats.cancelled} tone="text-red-600" />
                </div>

                <div className="mt-4"><StatsBar waiting={q.stats.waiting} served={q.stats.served} cancelled={q.stats.cancelled} /></div>

                <button className="mt-4 text-sm font-semibold text-brand-700 hover:underline" onClick={() => setExpanded(expanded === q._id ? null : q._id)}>
                  {expanded === q._id ? 'Hide tokens' : 'View tokens'}
                </button>
                {expanded === q._id && <div className="mt-3"><TokenList queueId={q._id} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
