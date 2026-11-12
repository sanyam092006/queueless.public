import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import usePolling from '../hooks/usePolling.js';
import { EmptyState, ErrorBox, PageHeader, Spinner, StatusBadge, formatWait } from '../components/ui.jsx';

const fmtDate = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function MyTokens() {
  const { data: tokens, loading, error, refresh } = usePolling(() => api.get('/tokens/my').then((r) => r.data));
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const cancel = async (id) => {
    if (!window.confirm('Cancel this token? You will lose your place in line.')) return;
    setBusyId(id);
    setActionError('');
    try {
      await api.patch(`/tokens/${id}/cancel`);
      await refresh();
    } catch (e) {
      setActionError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  const active = tokens?.filter((t) => ['waiting', 'serving'].includes(t.status)) || [];
  const history = tokens?.filter((t) => !['waiting', 'serving'].includes(t.status)) || [];

  return (
    <>
      <PageHeader title="My tokens" subtitle="Your place in line updates every 5 seconds." />
      <div className="mb-4 space-y-3">
        <ErrorBox message={error} />
        <ErrorBox message={actionError} />
      </div>

      {loading ? (
        <Spinner label="Loading your tokens..." />
      ) : (
        <>
          <h2 className="mb-3 font-semibold text-slate-900">Active</h2>
          {!active.length ? (
            <EmptyState title="No active tokens" text="Pick a service counter to get a token." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map((t) => (
                <div key={t._id} className={`rounded-xl border bg-white p-5 ${t.status === 'serving' ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{t.queue.name}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="num mt-3 text-6xl font-extrabold tracking-tight text-brand-700">{t.label}</p>

                  {t.status === 'serving' ? (
                    <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">It is your turn. Please go to the counter now.</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-slate-50 py-2"><p className="num font-bold">{t.position}</p><p className="text-xs text-slate-500">Your position</p></div>
                      <div className="rounded-lg bg-slate-50 py-2"><p className="num font-bold">{formatWait(t.estimatedWait)}</p><p className="text-xs text-slate-500">Est. wait</p></div>
                      <div className="rounded-lg bg-slate-50 py-2"><p className="num font-bold">{t.queue.nowServing ? `${t.queue.prefix}-${String(t.queue.nowServing).padStart(3, '0')}` : '-'}</p><p className="text-xs text-slate-500">Now serving</p></div>
                    </div>
                  )}

                  {t.status === 'waiting' && (
                    <button className="btn btn-danger mt-4 w-full" disabled={busyId === t._id} onClick={() => cancel(t._id)}>
                      {busyId === t._id ? 'Cancelling...' : 'Cancel token'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {!active.length && (
            <Link to="/counters" className="btn btn-primary mt-4">Browse service counters</Link>
          )}

          <h2 className="mb-3 mt-10 font-semibold text-slate-900">History</h2>
          {!history.length ? (
            <EmptyState title="No history yet" text="Served and cancelled tokens will appear here." />
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {history.map((t) => (
                <div key={t._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="num font-bold">{t.label}</p>
                    <p className="text-xs text-slate-500">{t.queue.name} - {fmtDate(t.createdAt)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
