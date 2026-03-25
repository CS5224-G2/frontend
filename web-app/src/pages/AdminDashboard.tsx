import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import { getAdminStats, getAdminUsers, type AdminStats, type AdminUser } from '../services/adminService'

type NavItem = { label: string; icon: string }

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: '📊' },
  { label: 'Users', icon: '👥' },
  { label: 'Routes', icon: '🗺️' },
  { label: 'Reports', icon: '⚠️' },
  { label: 'Settings', icon: '⚙️' },
]

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminUsers()])
      .then(([s, u]) => {
        setStats(s)
        setUsers(u)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const statCards = stats
    ? [
        { label: 'Total Rides', value: stats.totalRides.toLocaleString() },
        { label: 'Active Users', value: stats.activeUsers.toLocaleString() },
        { label: 'Revenue', value: stats.revenueFormatted },
        { label: 'Open Reports', value: String(stats.openReports), accent: 'amber' as const },
      ]
    : []

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

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : activeNav === 'Overview' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((s) => (
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
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 last:border-0">
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
                        <td className="py-3 text-slate-400">{u.joinedFormatted}</td>
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
