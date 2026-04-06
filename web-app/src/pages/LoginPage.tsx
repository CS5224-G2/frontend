import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in — redirect using Navigate component (safe during render)
  if (user) {
    const dest = user.role === 'admin' ? '/admin' : user.role === 'business' ? '/dashboard' : '/'
    return <Navigate to={dest} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login({ email, password })
      // Navigate based on the role returned by the auth service
      if (result.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (result.role === 'business') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-2xl font-black text-primary-900">🚲 CycleLink</p>
          <p className="text-slate-500 text-sm mt-1">Partner &amp; Admin Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="admin@cyclink.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="••••••••"
            />
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-700 transition-colors hover:text-primary-800"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white font-bold py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-5 bg-primary-50 rounded-xl p-4 text-xs text-slate-600">
          <p className="font-semibold text-primary-800 mb-2">Demo credentials</p>
          <p>Admin: <span className="font-mono">admin@cyclink.com</span></p>
          <p>Business: <span className="font-mono">business@cyclink.com</span></p>
          <p className="text-slate-400 mt-1">Password: <span className="font-mono">CycleLink123</span></p>
        </div>

        <Link
          to="/"
          className="block text-center text-xs text-slate-400 hover:text-primary-600 mt-4 transition-colors"
        >
          ← Back to cyclelink.com
        </Link>
      </div>
    </div>
  )
}
