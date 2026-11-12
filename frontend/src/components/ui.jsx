export const Spinner = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    <span className="text-sm">{label}</span>
  </div>
);

export const EmptyState = ({ title, text }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <p className="font-semibold text-slate-800">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{text}</p>
  </div>
);

export const ErrorBox = ({ message }) =>
  message ? (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  ) : null;

const BADGES = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  waiting: 'bg-amber-50 text-amber-800 ring-amber-200',
  serving: 'bg-brand-50 text-brand-700 ring-brand-100',
  served: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};
const DOTS = { open: 'bg-emerald-500', closed: 'bg-slate-400', waiting: 'bg-amber-500', serving: 'bg-brand-500 animate-pulse', served: 'bg-emerald-500', cancelled: 'bg-red-500' };

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${BADGES[status]}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status]}`} />
    {status}
  </span>
);

export const StatCard = ({ label, value, tone = 'text-slate-900' }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`num mt-1 text-3xl font-bold ${tone}`}>{value}</p>
  </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export const formatWait = (mins) => (mins <= 0 ? 'Next up' : mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`);

// Stacked bar showing the share of waiting / served / cancelled tokens.
export const StatsBar = ({ waiting = 0, served = 0, cancelled = 0 }) => {
  const total = waiting + served + cancelled;
  if (!total) return <p className="text-sm text-slate-500">No tokens issued yet, so there is nothing to chart.</p>;
  const parts = [
    { label: 'Served', value: served, color: 'bg-emerald-500' },
    { label: 'Waiting', value: waiting, color: 'bg-amber-500' },
    { label: 'Cancelled', value: cancelled, color: 'bg-red-500' },
  ];
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Token status breakdown">
        {parts.map((p) => (p.value ? <div key={p.label} className={p.color} style={{ width: `${(p.value / total) * 100}%` }} /> : null))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        {parts.map((p) => (
          <span key={p.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${p.color}`} />
            {p.label} <span className="num font-semibold">{Math.round((p.value / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
};
