import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'

type NavItem = { label: string; icon: string }

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: '📊' },
  { label: 'Users', icon: '👥' },
  { label: 'Routes', icon: '🗺️' },
  { label: 'Reports', icon: '⚠️' },
  { label: 'Settings', icon: '⚙️' },
]

const STATS = [
  { label: 'Total Rides', value: '1,280' },
  { label: 'Active Users', value: '452' },
  { label: 'Revenue', value: '$12.4k' },
  { label: 'Open Reports', value: '12', accent: 'amber' as const },
]

const USERS = [
  { email: 'alex@email.com', role: 'user', status: 'Active', joined: 'Jan 2025' },
  { email: 'jamie@email.com', role: 'user', status: 'Active', joined: 'Feb 2025' },
  { email: 'grace@email.com', role: 'user', status: 'Inactive', joined: 'Feb 2025' },
  { email: 'admin@cyclink.com', role: 'admin', status: 'Active', joined: 'Jan 2025' },
  { email: 'business@cyclink.com', role: 'business', status: 'Active', joined: 'Jan 2025' },
]

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Overview')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-52 bg-primary-900 flex flex-col flex-shrink-0">
        <div className="px-4 py-5">
          <p className="text-white font-extrabold text-base">🚲 Admin</p>
        </div>
        <nav className="flex-1 flex flex-col">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                activeNav === item.label
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-primary-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mx-4 mb-4 text-sm text-primary-300 hover:text-red-400 transition-colors text-left px-2 py-2"
        >
          ↩ Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-slate-50 p-6 overflow-auto">
        <h1 className="text-xl font-extrabold text-primary-900 mb-1">System Overview</h1>
        <p className="text-slate-500 text-sm mb-6">Admin Panel — CycleLink</p>

        {activeNav === 'Overview' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {STATS.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-primary-900 mb-4">User Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 pr-4 font-medium">Email</th>
                      <th className="pb-2 pr-4 font-medium">Role</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {USERS.map((u) => (
                      <tr key={u.email} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 text-slate-700">{u.email}</td>
                        <td className="py-3 pr-4 text-slate-500">{u.role}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              u.status === 'Active'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{u.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
            <p className="text-3xl mb-3">🚧</p>
            <p className="font-semibold">{activeNav} — Coming soon</p>
          </div>
        )}
      </main>
    </div>
  )
}
