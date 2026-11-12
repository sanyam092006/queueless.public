import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import usePolling from '../hooks/usePolling.js';
import { EmptyState, ErrorBox, PageHeader, Spinner, StatusBadge, formatWait } from '../components/ui.jsx';

export default function Counters() {
  const navigate = useNavigate();
  const { data: queues, loading, error } = usePolling(() => api.get('/queues').then((r) => r.data));
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const getToken = async (queueId) => {
    setBusyId(queueId);
    setActionError('');
    try {
      await api.post('/tokens', { queueId });
      navigate('/my-tokens');
    } catch (e) {
      setActionError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Service counters" subtitle="Pick a counter to get your digital token. Updates every 5 seconds." />
      <div className="mb-4 space-y-3">
        <ErrorBox message={error} />
        <ErrorBox message={actionError} />
      </div>

      {loading ? (
        <Spinner label="Loading counters..." />
      ) : !queues?.length ? (
        <EmptyState title="No counters yet" text="An admin has not opened any service counters. Check back soon." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {queues.map((q) => (
            <div key={q._id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-slate-900">{q.name}</h2>
                <StatusBadge status={q.status} />
              </div>
              <p className="mt-1 min-h-[2.5rem] text-sm text-slate-500">{q.description || 'No description'}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="num text-lg font-bold">{q.nowServing ? `${q.prefix}-${String(q.nowServing).padStart(3, '0')}` : '-'}</p>
                  <p className="text-xs text-slate-500">Now serving</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="num text-lg font-bold">{q.stats.waiting}</p>
                  <p className="text-xs text-slate-500">Waiting</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="num text-lg font-bold">{formatWait(q.estimatedWait)}</p>
                  <p className="text-xs text-slate-500">Wait if you join</p>
                </div>
              </div>

              <button
                className="btn btn-primary mt-5"
                disabled={q.status !== 'open' || busyId === q._id}
                onClick={() => getToken(q._id)}
              >
                {q.status !== 'open' ? 'Counter closed' : busyId === q._id ? 'Getting token...' : 'Get a token'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
