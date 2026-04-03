import { useState } from 'react';

function RoleBadge({ role }) {
  const styles = {
    admin:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    business: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    user:     'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${styles[role] ?? styles.user}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'Active';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
      isActive
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    }`}>
      {status}
    </span>
  );
}

export default function UserManagement({ users, loading, error }) {
  const [query, setQuery] = useState('');

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-9 bg-slate-200 dark:bg-zinc-800 rounded-lg w-64" />
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-4 p-4 border-b border-slate-100 dark:border-zinc-800 last:border-0">
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-48" />
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-16" />
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-16" />
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-100 dark:border-red-900/30 p-6 text-center">
        <p className="text-sm text-red-500 dark:text-red-400">Failed to load users</p>
      </div>
    );
  }

  const q = query.toLowerCase();
  const filtered = (users ?? []).filter(u =>
    (u.email_address ?? '').toLowerCase().includes(q) || (u.role ?? '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by email or role…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 w-64"
        />
        <p className="text-xs text-slate-400 dark:text-zinc-600">
          {filtered.length} of {(users ?? []).length} accounts
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-sm text-slate-400 dark:text-zinc-600">
                  No accounts match &ldquo;{query}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr
                  key={u.user_id}
                  className="border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-700 dark:text-zinc-300 font-mono text-xs">{u.email_address}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3"><StatusBadge status={u.account_status} /></td>
                  <td className="px-4 py-3 text-slate-500 dark:text-zinc-500 text-xs">{u.joined_formatted}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
