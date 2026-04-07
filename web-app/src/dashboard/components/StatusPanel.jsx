const DOT = { up: 'bg-green-500', down: 'bg-red-500', degraded: 'bg-amber-500' };

export default function StatusPanel({ health, loading }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 animate-pulse">
        <div className="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-1/3 mb-4" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded w-full mb-2" />
        ))}
      </div>
    );
  }
  if (!health) return null;

  const items = [
    ...Object.entries(health.dependencies).map(([name, status]) => ({ name, status, type: 'Dependency' })),
    ...Object.entries(health.services).map(([name, status]) => ({ name, status, type: 'Service' })),
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2.5 h-2.5 rounded-full ${DOT[health.status] || DOT.degraded}`} />
        <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-xs tracking-wide uppercase">
          System: {health.status}
        </h3>
      </div>
      <div className="space-y-2">
        {items.map(({ name, status, type }) => (
          <div key={name} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800 last:border-0">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${DOT[status] || 'bg-slate-300'}`} />
              <span className="text-xs text-slate-700 dark:text-zinc-300 font-mono">{name}</span>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-600">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
