import { useState } from 'react';

const LEVELS = ['error', 'warn', 'info'];

export default function InfrastructureLogs({ logs, loading }) {
  const [filter, setFilter] = useState('error');

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 animate-pulse">
        <div className="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-1/4 mb-4" />
        {[1,2,3].map(i => (
          <div key={i} className="h-10 bg-slate-100 dark:bg-zinc-800 rounded w-full mb-2" />
        ))}
      </div>
    );
  }
  if (!logs) return null;

  const entries = filter === 'error' ? (logs.errors || []) : [];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-xs tracking-wide uppercase">
          Error Logs · {logs.total_errors} in {logs.period_hours}h
        </h3>
        <div className="flex gap-1">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                filter === l
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-600 text-center py-6">
            No {filter} logs in the last {logs.period_hours}h
          </p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={i}
              className="border border-red-100 dark:border-red-900/20 bg-red-50/40 dark:bg-red-950/20 rounded-lg px-3 py-2"
            >
              <p className="text-xs text-slate-400 dark:text-zinc-600 font-mono mb-0.5">{entry.timestamp}</p>
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-mono break-all">{entry.summary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
