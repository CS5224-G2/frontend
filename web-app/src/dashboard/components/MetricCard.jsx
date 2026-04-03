export default function MetricCard({ title, value, subtitle, icon, valueClassName, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 animate-pulse">
        <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-1/2 mb-3" />
        <div className="h-7 bg-slate-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
        <div className="h-2.5 bg-slate-100 dark:bg-zinc-800 rounded w-1/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-100 dark:border-red-900/30 p-4">
        <p className="text-xs text-red-400 mb-1">{title}</p>
        <p className="text-sm text-red-500 dark:text-red-400 mb-2">Failed to load</p>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-primary-600 dark:text-green-400 hover:underline">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{title}</p>
        {icon && <span className="text-zinc-400 dark:text-zinc-600">{icon}</span>}
      </div>
      <p className={`text-2xl font-extrabold tracking-tight ${valueClassName ?? 'text-slate-900 dark:text-zinc-100'}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-slate-400 dark:text-zinc-600 mt-1">{subtitle}</p>}
    </div>
  );
}
